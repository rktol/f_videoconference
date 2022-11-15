import Peer, {SfuRoom} from "skyway-js"
import React from "react";
import styled from "styled-components";
import {MediaPipe} from "./MediaPipeScript";
import { SKYWAYAPI } from "../env";

type VideoStream = {
    stream: MediaStream;
    peerId: string;
    participantStatus: string;
};

const MyVideo = styled.video<{parsta:string, num:number, len:number}>`
    position: absolute;
    width: ${props => calcVideosize(props.parsta)};
    left: calc((50% - ${props => calcVideosize(props.parsta)}/2) + (${props => calcRadius(props.parsta)}*${props => calcSin(props.num,props.len)}));
    top : calc((50% - ${props => calcVideosize(props.parsta)}/2) + (${props => calcRadius(props.parsta)}*${props => calcCos(props.num,props.len)}));
`;

const Area = styled.div`
    position: ralative;
    width: 100%;
    height 80%;
    border: 1px solid black;
`

const calcCos = (num:number,len:number) =>{
    return Math.cos(num*2*Math.PI / len);
}

const calcSin = (num:number,len:number) =>{
    return Math.sin(num*2*Math.PI / len);
}


const calcRadius = (tmp:string) =>{
    if(tmp === 'bystander'){
        return '30%';
    }else{
        return '15%';
    }
}

const calcVideosize = (tmp:string) =>{
    // 個々の大きさをどうするか相談したい
    switch(tmp){
        case 'speaker':
            return '15%'
        case 'addressee':
            return '11%'
        case 'sideparticipant':
            return '8%'
        default :
            return '5%'
    }
}


export const Room: React.VFC<{roomId: string}> =({roomId}) => {
    const peer = React.useRef(new Peer({ key: SKYWAYAPI as string}));
    const [remoteVideo, setRemoteVideo] = React.useState<VideoStream[]>([]);
    const [localStream, setLocalStream] = React.useState<MediaStream>();
    const [room, setRoom] = React.useState<SfuRoom>();
    const localVideoRef = React.useRef<HTMLVideoElement>(null);
    const [isStarted, setIsStarted] = React.useState(false);
    const [localParSta,setLocalParSta] =React.useState("bystander");
    const [statusArray,setStatusArray] =React.useState<string[]>([]);

    // メディアデバイスからローカルのビデオ情報を取得する
    React.useEffect(() => {
        initLocalVideo();
    },[]);

    const initLocalVideo = () =>{
        navigator.mediaDevices
            .getUserMedia({ video: true})
            .then((stream) => {
                setLocalStream(stream);
                if (localVideoRef.current){
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.play().catch((e) => console.log(e));
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }

    // countStatusから参与構造を取得する関数
    function getParticipantStatus(countstatus:string){
        setLocalParSta(countstatus)
    }

    // 新規参加者がいたときにStreamを追加する
    const addRemoteStream = (stream:MediaStream,peerId:string,parsta:string) =>{
        setRemoteVideo((prev) => [
            ...prev,
            { stream:stream, peerId:peerId, participantStatus:parsta}
        ]);
    }

    // 参与役割の変化を受信したときにRemoteVideoに設定
    const changeParticipantStatus = (peerId:string,parsta:string)=>{
        setRemoteVideo((prev) => {
            return prev.map((video)=>{
                if (video.peerId === peerId){
                    return {stream: video.stream, peerId: video.peerId, participantStatus:parsta};
                }else{
                    return video;
                }
            });
        });
    }

    // RemoteVideoをPeerId昇順に設定
    const sortRemoteVideo=()=>{
        setRemoteVideo((prev)=>{
            return prev.sort((a,b)=>{
                if(a.peerId < b.peerId){
                    return 1;
                }else{
                    return -1;
                };
            });
        });
    }

    // MediaPipeに送信するための参与役割の配列を設定
    const getStatusArray=()=>{
        setStatusArray(remoteVideo.map((value)=>{
            return value.participantStatus
        }))
        // console.log(statusArray)
    }

    React.useEffect(() => {
        if(room){
            room.send(localParSta);
        }
        // remoteVideoの自分のparstaを変更する
        changeParticipantStatus(peer.current.id,localParSta);
    },[localParSta]);

    React.useEffect(() => {
        getStatusArray();
    },[remoteVideo])

    // スタートが押されたら動き続ける関数
    const onStart = () => {
        if(peer.current){
            if(!peer.current.open){
                return;
            }
            const tmpRoom = peer.current.joinRoom<SfuRoom>(roomId, {
                mode: "sfu",
                stream: localStream,
            });
            tmpRoom.once("open", ()=>{
                console.log("=== You joined ===\n");
                // Startが押されるとremoteVideoにlocalを入れて
                if(localStream){
                    addRemoteStream(localStream,peer.current.id,localParSta);
                }
            });
            tmpRoom.on("peerJoin",(peerId)=>{
                console.log(`=== ${peerId} joined === \n}`);
            });
            tmpRoom.on("stream", async (stream) => {
                // streamを受信したらstreamとpeerId,participantStatusをsetRemoteVideoする
                addRemoteStream(stream,stream.peerId,"bystander");
                // setRemoteVideoを並び変える
                sortRemoteVideo();
                // 現在のParticipationStatusを新規参加者に送る
                if(room){
                    room.send(localParSta);
                }
            });
            tmpRoom.on("data",({src,data}) => {
                // data（参与役割）を受信したらsetRemoteVidoeを更新する
                changeParticipantStatus(src,data);
            });
            tmpRoom.on("peerLeave",(peerId) => {
                setRemoteVideo((prev) => {
                    return prev.filter((video) => {
                        if (video.peerId === peerId){
                            video.stream.getTracks().forEach((track) => track.stop());
                        }
                        return video.peerId !== peerId;
                    });
                });
                console.log(`=== ${peerId} left ===\n`);
            });
            setRoom(tmpRoom);
        }
        setIsStarted((prev) => !prev);
    };

    // エンドが押されたら動く
    const onEnd = () => {
        if(room){
            room.close();
            // RemoteVideoを全部空にする
            setRemoteVideo((prev) => {
                return prev.filter((video) =>{
                    video.stream.getTracks().forEach((track) => track.stop());
                    return false;
                });
            });
        }
        // roomが切れたらlocalのplayを再開する
        initLocalVideo();
        setIsStarted((prev) => !prev);
    };

    // remoteVideoに置かれている全ての要素でpopsとしてvideoとkeyとしてpeerIdを関数RemoteVideoに送る
    const castVideo = () => {
        return remoteVideo.map((video,index) => {
            return <RemoteVideo video={video} index={index} length={remoteVideo.length}key={video.peerId} />; 
        });
    };

    const mediaPipeOn = () => {
        return <MediaPipe  getParticipantStatus = {getParticipantStatus} participantsStatus ={statusArray}/>;
    }

    return (
        <div>
            <div>
                {/* <form>
                    <select onChange={getParticipantStatus} defaultValue={localParSta} disabled={!isStarted}>
                        <option value="speaker">話し手</option>
                        <option value="addressee">受け手</option>
                        <option value="sideparticipant">傍参加者</option>
                        <option value="bystander">傍観者</option>
                    </select>
                </form> */}
                <button onClick={() => onStart()} disabled={isStarted}>
                    start
                </button>
                {/* <button onClick={() => onEnd()} disabled={!isStarted}> */}
                <button onClick={() => onEnd()} disabled={true}>
                    end
                </button>
                <MyVideo ref={localVideoRef} parsta={localParSta} num={1} len={1} style={{display:(isStarted?'none':'block')}} playsInline>
                </MyVideo>
                <Area>
                {castVideo()}
                </Area>
                {/* 子コンポーネントに送りたい */}
                {mediaPipeOn()}
                {/* <MediaPipe /> */}
            </div>
        </div>
    );
};

const RemoteVideo = (props: {video: VideoStream,index:number,length:number}) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        if(videoRef.current){
            videoRef.current.srcObject = props.video.stream;
            videoRef.current.play().catch((e) => console.log(e));
        }
    },[props.video]);
    return <MyVideo ref={videoRef} parsta={props.video.participantStatus} num={props.index} len={props.length} playsInline></MyVideo>
};
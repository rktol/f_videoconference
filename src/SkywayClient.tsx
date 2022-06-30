import Peer, {SfuRoom} from "skyway-js"
import React from "react";
import { SKYWAYAPI } from "./env";

type VideoStream = {
    stream: MediaStream;
    peerId: string;
};

export const Room: React.VFC<{roomId: string}> =({roomId}) => {
    const peer = React.useRef(new Peer({ key: SKYWAYAPI as string}));
    const [remoteVideo, setRemoteVideo] = React.useState<VideoStream[]>([]);
    const [localStream, setLocalStream] = React.useState<MediaStream>();
    const [room, setRoom] = React.useState<SfuRoom>();
    const localVideoRef = React.useRef<HTMLVideoElement>(null);
    const [isStarted, setIsStarted] = React.useState(false);
    // メディアデバイスからローカルのビデオ情報を取得する
    React.useEffect(() => {
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
    },[]);
    // 参与構造を取得する関数
    const getParticipantStatus = () =>{
        // とりあえずプルダウンで表示して後から非言語情報から計算する
        const ps = ["話し手","受け手","傍参加者","傍観者"];
        return 
        // onChangeを多分使う
    }
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
            });
            tmpRoom.on("peerJoin",(peerId)=>{
                console.log(`=== ${peerId} joined === \n}`);
            });
            tmpRoom.on("stream", async (stream) => {
                setRemoteVideo((prev) => [
                    ...prev,
                    { stream: stream, peerId: stream.peerId}
                ]);
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
            setRemoteVideo((prev) => {
                return prev.filter((video) =>{
                    video.stream.getTracks().forEach((track) => track.stop());
                    return false;
                });
            });
        }
        setIsStarted((prev) => !prev);
    };
    // remoteVideoに置かれている全ての要素でpopsとしてvideoとkeyとしてpeerIdを関数RemoteVideoに送る
    const castVideo = () => {
        return remoteVideo.map((video) => {
            return <RemoteVideo video={video} key={video.peerId} />; 
        });
    };
    return (
        <div>
            <button onClick={() => onStart()} disabled={isStarted}>
                start
            </button>
            <button onClick={() => onEnd()} disabled={!isStarted}>
                end
            </button>
            <video ref={localVideoRef} playsInline></video>
            {castVideo()}
        </div>
    );
};

const RemoteVideo = (props: {video: VideoStream}) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        if(videoRef.current){
            videoRef.current.srcObject = props.video.stream;
            videoRef.current.play().catch((e) => console.log(e));
        }
    },[props.video]);
    return <video ref={videoRef} playsInline></video>
};
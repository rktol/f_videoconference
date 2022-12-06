import Peer, { SfuRoom } from "skyway-js"
import React from "react";
import styled from "styled-components";
import { MediaPipe } from "./MediaPipeScript";
import { SKYWAYAPI } from "../env";

type VideoStream = {
    stream: MediaStream;
    peerId: string;
    participantStatus: string;
};

const MyVideo = styled.video<{ parsta: string, num: number, len: number }>`
    position: absolute;
    width: ${props => calcVideosize(props.parsta)};
    // 大きさ調整用コメント
    // width: 15%;
    left: calc((50% - ${props => calcVideosize(props.parsta)}/2) + (${props => calcRadius(props.parsta)}*${props => calcSin(props.num, props.len)}));
    top : calc((50% - ${props => calcVideosize(props.parsta)}/2) + (${props => calcRadius(props.parsta)}*${props => calcCos(props.num, props.len)}));
    clip-path:circle(35% at 50% 50%);
    // 角丸
    // border-radius: 30px;
    // 枠線の太さ、色
    // border:solid 10px #ffffff;
    
`;

const Area = styled.div`
    position: ralative;
    width: 100%;
    height 100%;
`

const Circle = styled.div`
    position: absolute;
    display: block;
    left:calc(50% - 40% * 9/16);
    top:calc(50% - 40%);
    width: calc(80% * 9/16);
    height: 80%;
    border-radius:50%;
    background:rgba(255,247,153,0.75);
`


export const calcCos = (num: number, len: number) => {
    return Math.cos(num * 2 * Math.PI / len);
}

export const calcSin = (num: number, len: number) => {
    return Math.sin(num * 2 * Math.PI / len);
}


const calcRadius = (tmp: string) => {
    if (tmp === 'bystander') {
        return '45%';
    } else {
        return '25%';
    }
}

const calcVideosize = (tmp: string) => {
    // 個々の大きさをどうするか相談したい
    switch (tmp) {
        case 'speaker':
            return '16%'
        case 'addressee':
            return '12%'
        case 'sideparticipant':
            return '8%'
        default:
            return '4%'
    }
}


export const Room: React.VFC<{ roomId: string }> = ({ roomId }) => {
    const peer = React.useRef(new Peer({ key: SKYWAYAPI as string }));
    const [remoteVideo, setRemoteVideo] = React.useState<VideoStream[]>([]);
    const [localStream, setLocalStream] = React.useState<MediaStream>();
    const [room, setRoom] = React.useState<SfuRoom>();
    const localVideoRef = React.useRef<HTMLVideoElement>(null);
    const [isStarted, setIsStarted] = React.useState(false);
    const [localParSta, setLocalParSta] = React.useState("bystander");
    const [statusArray, setStatusArray] = React.useState<string[]>([]);
    const [isAdd, setIsAdd] = React.useState<boolean>(false);
    const [addData, setAddData] = React.useState<number>();
    const [myNumber,setMyNumber] = React.useState<number>(0);

    // メディアデバイスからローカルのビデオ情報を取得する
    React.useEffect(() => {
        initLocalVideo();
    }, []);

    const initLocalVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.play().catch((e) => console.log(e));
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }

    // countStatusから参与構造を取得する関数
    function getParticipantStatus(countstatus: string) {
        setLocalParSta(countstatus)
    }
    // MediaPipeScriptから送られてきた話し手の視線をRoomに送る
    function getSpeakerFace(num: number) {
        // console.log(num)
        if (room) {
            room.send(num);
        }
    }

    // 新規参加者がいたときにStreamを追加する
    const addRemoteStream = (stream: MediaStream, peerId: string, parsta: string) => {
        setRemoteVideo((prev) => [
            ...prev,
            { stream: stream, peerId: peerId, participantStatus: parsta }
        ]);
    }

    // 参与役割の変化を受信したときにRemoteVideoに設定
    const changeParticipantStatus = (peerId: string, parsta: string) => {
        setRemoteVideo((prev) => {
            return prev.map((video) => {
                if (video.peerId === peerId) {
                    return { stream: video.stream, peerId: video.peerId, participantStatus: parsta };
                } else {
                    return video;
                }
            });
        });
    }

    React.useEffect(() => {
        changeIsAdd(addData, peer.current.id)
    }, [addData])

    const changeIsAdd = (data: number | undefined, peerid: string) => {
        // dataがnullでなく、-1でもなく（誰かしらが受け手）、それが自分である時
        if (data != undefined && data != -1 && remoteVideo[data].peerId == peer.current.id) {
            setIsAdd(true)
        } else {
            setIsAdd(false)
        }
    }

    // RemoteVideoをPeerId昇順に設定
    const sortRemoteVideo = () => {
        setRemoteVideo((prev) => {
            return prev.sort((a, b) => {
                if (a.peerId < b.peerId) {
                    return 1;
                } else {
                    return -1;
                };
            });
        });
    }

    // MediaPipeに送信するための参与役割の配列を設定
    const getStatusArray = () => {
        setStatusArray(remoteVideo.map((value) => {
            return value.participantStatus
        }))
    }

    React.useEffect(() => {
        if (room) {
            room.send(localParSta);
        }
        // remoteVideoの自分のparstaを変更する
        changeParticipantStatus(peer.current.id, localParSta);
    }, [localParSta]);

    React.useEffect(() => {
        getStatusArray();
        remoteVideo.map((value,index) => {
            if(value.peerId == peer.current.id){
                setMyNumber(index);
            }
        })
    }, [remoteVideo])

    // スタートが押されたら動き続ける関数
    const onStart = () => {
        if (peer.current) {
            if (!peer.current.open) {
                return;
            }
            const tmpRoom = peer.current.joinRoom<SfuRoom>(roomId, {
                mode: "sfu",
                stream: localStream,
            });
            tmpRoom.once("open", () => {
                console.log("=== You joined ===\n");
                // Startが押されるとremoteVideoにlocalを入れて
                if (localStream) {
                    addRemoteStream(localStream, peer.current.id, localParSta);
                }
            });
            tmpRoom.on("peerJoin", (peerId) => {
                console.log(`=== ${peerId} joined === \n}`);
            });
            tmpRoom.on("stream", async (stream) => {
                // streamを受信したらstreamとpeerId,participantStatusをsetRemoteVideoする
                addRemoteStream(stream, stream.peerId, "bystander");
                // setRemoteVideoを並び変える
                sortRemoteVideo();
                // 現在のParticipationStatusを新規参加者に送る
                if (room) {
                    room.send(localParSta);
                }
            });

            // dataの受信
            tmpRoom.on("data", ({ src, data }) => {
                if (typeof data == "number") {
                    setAddData(data)
                } else {
                    // data（参与役割）を受信したらsetRemoteVidoeを更新する
                    changeParticipantStatus(src, data);
                }
            });

            tmpRoom.on("peerLeave", (peerId) => {
                setRemoteVideo((prev) => {
                    return prev.filter((video) => {
                        if (video.peerId === peerId) {
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
        if (room) {
            room.close();
            // RemoteVideoを全部空にする
            setRemoteVideo((prev) => {
                return prev.filter((video) => {
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
        return remoteVideo.map((video, index) => {
            return <RemoteVideo video={video} index={index} length={remoteVideo.length} key={video.peerId} isMute={video.peerId == peer.current.id} />;
        });
    };

    const mediaPipeOn = () => {
        return <MediaPipe getParticipantStatus={getParticipantStatus} getSpeakerFace={getSpeakerFace} participantsStatus={statusArray} addressee={isAdd} mynumber={myNumber} />;
    }

    return (
        <div>
            <div>
                <button onClick={() => onStart()} disabled={isStarted}>
                    Call
                </button>
                {/* <button onClick={() => onEnd()} disabled={!isStarted}> */}
                {/* <button onClick={() => onEnd()} disabled={true}>
                    end
                </button> */}
                {/* 子コンポーネントに送りたい */}
                <Circle></Circle>
                {mediaPipeOn()}

                {/* 描画 */}
                
                <MyVideo ref={localVideoRef} parsta={localParSta} num={1} len={1} style={{ display: (isStarted ? 'none' : 'block') }} playsInline muted>
                </MyVideo>
                <Area>
                    {castVideo()}
                </Area>
            </div>
        </div>
    );
};

const RemoteVideo = (props: { video: VideoStream, index: number, length: number, isMute: boolean }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = props.video.stream;
            videoRef.current.play().catch((e) => console.log(e));
        }
    }, [props.video]);

    return <MyVideo ref={videoRef} parsta={props.video.participantStatus} num={props.index} len={props.length} playsInline muted={props.isMute}></MyVideo>
};
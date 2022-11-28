import React from 'react';
import '../App.css';
import { useCallback, useEffect, useRef, VFC, } from 'react';
import Webcam from 'react-webcam';
import { css } from '@emotion/css';
import { Camera } from '@mediapipe/camera_utils';
import { Holistic, Results, ResultsListener } from '@mediapipe/holistic';
import { detectItem, InitHand, InitiationHands, CountAndDetection } from './nonVerbal';
import SpeechRecognition,{useSpeechRecognition} from 'react-speech-recognition';

// export const MediaPipe = (props: {parsta:string}) =>{
export const MediaPipe: React.VFC<{ getParticipantStatus: Function, getSpeakerFace: Function, participantsStatus: string[], addressee: boolean }> = ({ getParticipantStatus, getSpeakerFace, participantsStatus, addressee }) => {

  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultsRef = useRef<any>(null)
  const [isHands, setIsHands] = React.useState<InitiationHands>({ right: 1, left: 1 });
  const [nod,setNod] = React.useState<number[]>( [0, 0, 0] );
  let [count, setCount] = React.useState<number>(0);
  let [isParticipantStatus, setIsParticipantStatus] = React.useState<string>("bystander")
  let [participants, setParticipants] = React.useState<string[]>([])
  const [tmpResults, setTmpResults] = React.useState<Results>()
  const [whoFace, setWhoFace] = React.useState<number>(0)
  const [speakerFace,setSpeakerFace] = React.useState<number>(-1)
  const [isSpeaker, setIsSpeaker] = React.useState<boolean>(false)
  const [isAddressee, setIsAddressee] = React.useState<boolean>(false)
  const [FinishToSpeakCount,setFinishToSpeakCount] = React.useState<number>(0)

  /**
  * 検出結果（フレーム毎に呼び出される）
  * @param results
  */

  const {
    transcript,
    listening,
    finalTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const Speech = () =>{

    if (!browserSupportsSpeechRecognition) {
      return <span>Browser doesn't support speech recognition.</span>;
    }

    SpeechRecognition.startListening({
      continuous:false,
      language: 'ja'
    })

  }

  React.useEffect(() => {
    SpeechRecognition.startListening({
      continuous:false,
      language: 'ja'
    })
    console.log(finalTranscript)
  },[listening])

  React.useEffect(() => {
    if(transcript){
      setIsSpeaker(true)
      setCount(100)
    }else{
      setIsSpeaker(false)
    }
  },[transcript])

  // Holisticを起動したときにひたすら回り続ける
  const onResults: ResultsListener = (results: Results): void => {
    resultsRef.current = results
    setTmpResults(results)
  }

  // onResultsでTmpResultsが変更されたときに毎回動き、countを算出して自らの参与役割を決定
  React.useEffect(() => {
    
    // 頷きのためのnod関数
    let nodtmp = nod
    if (tmpResults && tmpResults.faceLandmarks) {
      nodtmp.push(tmpResults.faceLandmarks[1].y)
      nodtmp.shift()
    }
    setNod(nodtmp)


    let conHands = isHands
    let tmp: CountAndDetection
    let tmpcount = count

    // 非言語情報からcountを算出する
    if (conHands && tmpResults) {
      tmp = detectItem(tmpResults, count, conHands, nod, participants)
      tmpcount = tmp.nblCount
      // 誰を向いているか
      setWhoFace(tmp.faceDetection)
    }

    // speaker,adresserは仮置き
    if (isSpeaker) {
      setIsParticipantStatus("speaker")
    } else {

      tmpcount = tmpcount - 0.5

      if (tmpcount < 0) {
        tmpcount = 0
      } else if (tmpcount > 101) {
        tmpcount = 100
      }

      setCount(tmpcount)

      if (isAddressee) {
        setIsParticipantStatus("addressee")
      } else {
        if (count > 50) {
          setIsParticipantStatus("sideparticipant")
        } else if (count <= 50) {
          setIsParticipantStatus("bystander")
        }
      }
      console.log("現在のスコア：" + count)
    }
    
  }, [tmpResults])

  useEffect(() => {
    // console.log('participantsStatus is updated')
    setParticipants(participantsStatus)

    // 話し手が傍参加者をみているか
    SpeakerFaceAddressee()
  }, [participantsStatus])

  useEffect(() => {
    // 話し手が傍参加者をみているか
    SpeakerFaceAddressee()
  },[whoFace])

  useEffect(() => {
    setIsAddressee(addressee)
  }, [addressee])

  useEffect(() => {
    // 親コンポーネントからgetLocalparstaが欲しい
    getParticipantStatus(isParticipantStatus)
    console.log("現在の参与役割：" + isParticipantStatus)
  }, [isParticipantStatus])

  // speaker（自分）がsideparticipantを見ていたらその番号を、それ以外は-1をskywayにおくる
  useEffect(() => {
    getSpeakerFace(speakerFace)
  }, [speakerFace])

  // もしSpeakerがSideParticipantを見ていたらその番号をSkywayClientに送る
  const SpeakerFaceAddressee = () => {
    if (isParticipantStatus == "speaker" && (participants[whoFace] == "sideparticipant" || participants[whoFace] == "addressee")) {
      // console.log("私は"+isParticipantStatus+",参加者"+whoFace+":"+participants[whoFace]+"を見ています")
      setSpeakerFace(whoFace)
    }else{
      setSpeakerFace(-1)
    }
  }

  // const OutputData = () => {
  //   const results = resultsRef.current as Results
  //   console.log(results)
  // }

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user'
  }

  // 開いた手を登録する
  const InitHands = () => {
    const results = resultsRef.current as Results
    setIsHands((prev) => {
      if (prev) {
        return InitHand(results, prev)
      } else {
        return prev
      }
    })
  }

  const ClickOnCalc = () => {
    console.log('ClickOnResults')
    const holistic = new Holistic({
      locateFile: file => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
      }
    })
    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    holistic.onResults(onResults);

    if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null) {
      const camera = new Camera(webcamRef.current.video!, {
        onFrame: async () => {
          await holistic.send({ image: webcamRef.current!.video! })
        },
        width: 1280,
        height: 720
      })
      camera.start()

    }

    Speech()
  }

  // const getIsSpeaker = () => {
  //   if (isSpeaker == true) {
  //     setCount(100)
  //   }
  //   setIsSpeaker((prev) => { return !(prev) });
  // }

  return (
    <>
      <div className={styles.container}>{/* capture */}
        <Webcam
          audio={false}
          style={{ visibility: 'hidden' }}
          width={1280}
          height={720}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
        />
        {/* draw */}
        <canvas ref={canvasRef} className={styles.canvas} />
        {/* output */}
        <div className={styles.buttonContainer}>
          {/* result出力デバッグ用 */}
          {/* <button className={styles.button} onClick={OutputData}>
            Output Data
        </button> */}

          <button onClick={InitHands}>
            Init Hand
          </button>
          <button onClick={ClickOnCalc}>
            Calculate Non Verbal Language
          </button>
          {/* <button onClick={getIsSpeaker}>
            Speaker or etc
          </button> */}
          {/* <button onClick={Speech}>
            音声認識
          </button> */}
        </div>
      </div>
    </>
  )
}


// =============================---
export const styles = {
  container: css`
        position: relative;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
    `,
  canvas: css`
        position: relative;
        // width: 1280px;
        // height: 720px;
        // background-color: #fff;
    `,
  buttonContainer: css`
        position: absolute;
        top: 0px;
        left: 0px;
    `,
  button: css`
        color: #fff;
        background-color: #0082cf;
        font-size: 1rem;
        border: none;
        border-radius: 5px;
        padding: 10px 10px;
        cursor: pointer;
    `
}
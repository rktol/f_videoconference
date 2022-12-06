import React, { LinkHTMLAttributes } from 'react';
import '../App.css';
import { useCallback, useEffect, useRef, VFC, } from 'react';
import styled, { IntrinsicElementsKeys } from "styled-components";
import Webcam from 'react-webcam';
import { css } from '@emotion/css';
import { Camera } from '@mediapipe/camera_utils';
import { Holistic, Results, ResultsListener } from '@mediapipe/holistic';
import { detectItem, InitHand, InitiationHands, CountAndDetection,isScore } from './nonVerbal';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { calcCos,calcSin } from './SkywayClient';
import {CSVLink} from "react-csv";

type TalkResult = {
  Start: number;
  End: number;
  Condition:number;
  Num: number;
  Text: string;
};

type ParticipantStatusResult = {
  Start: number;
  End: number;
  Condition:number;
  Num: number;
  Status: string;
};

type GazeResult = {
  Start: number;
  End: number;
  Condition:number;
  Num: number;
  Id: number;
};

type ScoreResult = {
  Start: number;
  End: number;
  Condition:number;
  Num: number;
  Count: number;
  LeftHand:boolean;
  RightHand:boolean;
  Mouth:boolean;
  Nod:boolean;
  GazeSpeeker:boolean;
};

// export const MediaPipe = (props: {parsta:string}) =>{
export const MediaPipe: React.VFC<{ getParticipantStatus: Function, getSpeakerFace: Function, participantsStatus: string[], addressee: boolean, mynumber:number }> = ({ getParticipantStatus, getSpeakerFace, participantsStatus, addressee,mynumber }) => {

  const [myId,setMyId] = React.useState<number>(0);
  const [condition,setCondition] = React.useState<number>(0);
  const [nowTest,setNowTest] = React.useState<boolean>(false);
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultsRef = useRef<any>(null)
  const [isHands, setIsHands] = React.useState<InitiationHands>({ right: 1, left: 1 });
  const [nod, setNod] = React.useState<number[]>([0, 0, 0]);
  let [count, setCount] = React.useState<number>(0);
  let [isParticipantStatus, setIsParticipantStatus] = React.useState<string>("bystander")
  let [participants, setParticipants] = React.useState<string[]>([])
  const [tmpResults, setTmpResults] = React.useState<Results>()
  const [whoFace, setWhoFace] = React.useState<number>(0)
  const [scoreCount,setScoreCount] = React.useState<isScore>({LeftHand:false,RightHand:false,Mouth:false,Nod:false,GazeSpeeker:false})
  const [speakerFace, setSpeakerFace] = React.useState<number>(-1)
  const [isSpeaker, setIsSpeaker] = React.useState<boolean>(false)
  const [isAddressee, setIsAddressee] = React.useState<boolean>(false)

  /**
  * 検出結果（フレーム毎に呼び出される）
  * @param results
  */

  // 時間計測開始
  const [startTime,setStartTime] = React.useState<number>(performance.now());
  const [startToTalkTime,setStartToTalkTime] = React.useState<number>(0);
  const [startParstaTime,setStartParstaTime] = React.useState<number>(0);
  const [startToGazeTime,setStartToGazeTime] = React.useState<number>(0);
  const [startScoreTime,setStartScoreTime] = React.useState<number>(0);
  const [talkResults,setTalkResults] = React.useState<TalkResult[]>([]);
  const [parstaResults,setParstaResults] = React.useState<ParticipantStatusResult[]>([]);
  const [gazeResults,setGazeResults] = React.useState<GazeResult[]>([]);
  const [scoreResults,setScoreResults] = React.useState<ScoreResult[]>([]);
  const csvGazeRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const csvTalkRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const csvParstaRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const csvScoreRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

  // 会話認識開始
  const {
    transcript,
    listening,
    finalTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Speech()を起動した場合会話の待機が始まる
  const Speech = () => {

    if (!browserSupportsSpeechRecognition) {
      return <span>Browser doesn't support speech recognition.</span>;
    }

    SpeechRecognition.startListening({
      continuous: false,
      language: 'ja'
    })

  }

    // listeningがfalseになった時、trueする
    React.useEffect(() => {
      SpeechRecognition.startListening({
        continuous: false,
        language: 'ja'
      })
      if(finalTranscript){
        if(nowTest){
          const nowtime = (performance.now() -  startTime)/1000
          setTalkResults((prev) => [
            ...prev,
            { Start:startToTalkTime, End:nowtime, Condition:condition, Num:myId, Text:finalTranscript}
          ]);
        }
      }
    }, [listening])
  
    // transcriptに値がある時、参与役割をspeakerにする
    React.useEffect(() => {
      if (transcript) {
        if(!isSpeaker){
          setIsSpeaker(true)
          setStartToTalkTime((performance.now() -  startTime)/1000)
        }
        setCount(100)
      } else {
        setIsSpeaker(false)
      }
    }, [transcript])

  // 視線が変わった時に計測する
  const GazeTimeDetection = (()=>{
    const endGazeTime = (performance.now() - startTime)/1000;
    if(nowTest){
      setGazeResults((prev) => [
        ...prev,
        { Start:startToGazeTime, End:endGazeTime, Condition:condition, Num:myId, Id:whoFace}
      ]);
    }
    setStartToGazeTime(endGazeTime)
  })

  const ScoreTimeDetection = ((count:number)=>{
    const endScoreTime = (performance.now() - startTime)/1000;
    if(nowTest){
      setScoreResults((prev) => [
        ...prev,
        { Start:startScoreTime, 
          End:endScoreTime, 
          Condition:condition, 
          Num:myId, 
          Count:count, 
          LeftHand:scoreCount.LeftHand,
          RightHand:scoreCount.RightHand,
          Mouth:scoreCount.Mouth,
          Nod:scoreCount.Nod,
          GazeSpeeker:scoreCount.GazeSpeeker,
        }
      ]);
    }
    setStartScoreTime(endScoreTime)
  })

  const ParstaTimeDetection = (() => {
    const endParstaTime =  (performance.now() - startTime)/1000;
    if(nowTest){
      setParstaResults((prev) => [
        ...prev,
        { Start:startParstaTime, End:endParstaTime, Condition:condition, Num:myId, Status:isParticipantStatus}
      ]);
    }
    setStartParstaTime(endParstaTime)
  })

  const ChangeOwnParticipantStatus = ((parsta:string) => {
    if(isParticipantStatus != parsta){
      ParstaTimeDetection()
    }
    setIsParticipantStatus(parsta)
  })

  const ScoreCheck = (prev:isScore,data:isScore):boolean =>{
    if(prev.GazeSpeeker == data.GazeSpeeker){
      if(prev.LeftHand == data.LeftHand){
        if(prev.RightHand == data.RightHand){
          if(prev.Mouth == data.Mouth){
            if(prev.Nod == data.Nod){
              return false
            }
          }
        }
      }
    }
    return true;
  }

  React.useEffect(()=> {
    setMyId(mynumber)
  },[mynumber])

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
      if(whoFace != tmp.faceDetection){
        GazeTimeDetection()
        setWhoFace(tmp.faceDetection)
      }
      // scoreに変更があった時にカウントし、stateを変える
      if(ScoreCheck(scoreCount,tmp.Score)){
        ScoreTimeDetection(tmpcount)
        setScoreCount(tmp.Score)
      }
      
    }

    if (isSpeaker) {
      ChangeOwnParticipantStatus("speaker")
    } else {

      tmpcount = tmpcount - 0.5

      if (tmpcount < 0) {
        tmpcount = 0
      } else if (tmpcount > 101) {
        tmpcount = 100
      }

      setCount(tmpcount)

      if (isAddressee) {
        ChangeOwnParticipantStatus("addressee")
      } else {
        if (count > 50) {
          ChangeOwnParticipantStatus("sideparticipant")
        } else if (count <= 50) {
          ChangeOwnParticipantStatus("bystander")
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
  }, [whoFace])

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
    } else {
      setSpeakerFace(-1)
    }
  }

  const ChangeNowTest = () => {
    setNowTest(true)
  }

  React.useEffect(() => {
    if(nowTest){
      StartToTest()
    }
  },[nowTest])

  const StartToTest = () => {
    const time = performance.now()
    setStartTime(time)
    setStartScoreTime(0)
    setStartToGazeTime(0)
    setStartToTalkTime(0)
    setStartParstaTime(0)
    setParstaResults([])
    setScoreResults([])
    setTalkResults([])
    setGazeResults([])
  }
  
  const EndToTest = () => {
    setNowTest(false)
    csvTalkRef?.current?.link.click();
    csvScoreRef?.current?.link.click();
    csvGazeRef?.current?.link.click();
    csvParstaRef?.current?.link.click();
    writecsv()
  }

  const writecsv = () => {
    console.log(scoreResults)
    console.log(gazeResults)
    console.log(talkResults)
    console.log(parstaResults)
  }

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

  return (
    <>
      <button onClick={InitHands}>
        Init Hand
      </button>
      <button onClick={ClickOnCalc}>
        Detect
      </button>

      {/* result出力デバッグ用 */}
      <button onClick={ChangeNowTest} disabled={nowTest}>
        Start to Test
      </button>
      <button onClick={EndToTest} disabled={!nowTest}>
        End to Test
      </button>
      {!(nowTest) && <a>Setting</a>}

      <CSVLink data={talkResults} filename={`${condition}_${myId}_talk.csv`} ref={csvTalkRef} ></CSVLink>
      <CSVLink data={gazeResults} filename={`${condition}_${myId}_gaze.csv`} ref={csvGazeRef} ></CSVLink>
      <CSVLink data={parstaResults} filename={`${condition}_${myId}_parsta.csv`} ref={csvParstaRef} ></CSVLink>
      <CSVLink data={scoreResults} filename={`${condition}_${myId}_score.csv`} ref={csvScoreRef} ></CSVLink>

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
        {/* <canvas ref={canvasRef} className={styles.canvas} /> */}
        {/* output */}
        {/* <div className={styles.buttonContainer}> */}
      </div>
      <Circle who={whoFace} len={participants.length}></Circle>
      {/* </div> */}
    </>
  )
}


// =============================---
const Circle = styled.div<{ who: number,len: number}>`
    position: absolute;
    display: block;
    left:calc((50%) + (10%*${props => calcSin(props.who,props.len)}));
    top:calc((50%) + (10%*${props => calcCos(props.who,props.len)}));
    // left:calc((50%) + (10%*0));
    // top:calc((50%) + (10%));
    width: 10px;
    height: 10px;
    border-radius:50%;
    background:rgba(0,0,0);
`

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
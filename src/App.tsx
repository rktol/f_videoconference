import React from 'react';
import './App.css';
import { Room } from "./SkywayClient";

import {useCallback, useEffect,useRef, VFC} from 'react';
import Webcam from 'react-webcam';
import {css} from '@emotion/css';
import { Camera } from '@mediapipe/camera_utils';
import { Holistic, Results } from '@mediapipe/holistic';
import {detectItem, InitHand,InitiationHands,nodCount} from './utils/nonVerbal';


const App: React.VFC = () =>{

  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultsRef = useRef<any>(null)
  const [isHands, setIsHands] = React.useState<InitiationHands>({right:1,left:1});
  let nod = [0,0,0]
  let count = 0

   /**
   * 検出結果（フレーム毎に呼び出される）
   * @param results
   */

    const onResults = useCallback((results: Results) => {
      resultsRef.current = results

      // 頷きのためのnod関数
      if(results.faceLandmarks){
        nod.push(results.faceLandmarks[1].y)
        nod.shift()
      }

      // 非言語情報を読み取るための関数
      let conHands = isHands
      // console.log(conHands)
      if(conHands){
        count = detectItem(results,count,conHands,nod)
      }
      
      // count -= 0.5
      
      if(count < 0){
        count=0
      }else if(count > 101){
        count=100
      }
      console.log("現在のスコア："+count)
    },[])

    useEffect(() => {
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
  
      if(typeof webcamRef.current !== 'undefined' && webcamRef.current !== null){
        const camera = new Camera(webcamRef.current.video!,{
          onFrame: async () => {
            await holistic.send({ image: webcamRef.current!.video! })
          },
          width: 1280,
          height: 720
        })
        camera.start()
      }
    },[onResults])

    const OutputData = () => {
      const results = resultsRef.current as Results
      console.log(results)
    }
    const videoConstraints = {
      width: 1280,
      height: 720,
      facingMode: 'user'
    }
    const InitHands = () => {
      const results = resultsRef.current as Results
      setIsHands((prev) => {
          if(prev){
              return InitHand(results,prev)
          }else{
            return prev
          }
      })
      // console.log("init:"+isHands?.left+","+isHands?.right)
    }

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
        <button className={styles.button} onClick={OutputData}>
            Output Data
        </button>
        <button className={styles.button} onClick={InitHands}>
            Init Hand
        </button>
     </div>

    </div>
    <>
      <Room roomId={"1"} />
    </>
    </>
  );
};

export default App;

// =============================---
const styles = {
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
      position: absolute;
      width: 1280px;
      height: 720px;
      background-color: #fff;
  `,
  buttonContainer: css`
      position: absolute;
      top: 20px;
      left: 20px;
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
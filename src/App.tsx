import React from 'react';
import './App.css';
import { Room } from "./SkywayClient";

import {useCallback, useEffect,useRef, VFC} from 'react';
import Webcam from 'react-webcam';
import {css} from '@emotion/css';
import { Camera } from '@mediapipe/camera_utils';
import { Holistic, Results } from '@mediapipe/holistic';


const App: React.VFC = () =>{

  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resultsRef = useRef<any>(null)

   /**
   * 検出結果（フレーム毎に呼び出される）
   * @param results
   */

    const onResults = useCallback((results: Results) => {
      resultsRef.current = results
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
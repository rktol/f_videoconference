import { Results, NormalizedLandmarkList } from '@mediapipe/holistic';
import {faceNormalize} from './faceMesh';

/**
 * 
 * @param 
 * @param results 検出結果
 */
 export type InitiationHands = {
    right: number;
    left: number;
};

export type CountAndDetection = {
    nblCount:number;
    faceDetection:number;
    Score:isScore;
};

export type isScore = {
    LeftHand:boolean;
    RightHand:boolean;
    Mouth:boolean;
    Nod:boolean;
    GazeSpeeker:boolean;
};

export const InitHand = (result:Results,conHands:InitiationHands):InitiationHands => {
    if(result.leftHandLandmarks){
        conHands.left = Math.sqrt(Math.pow(result.leftHandLandmarks[0].x - result.leftHandLandmarks[12].x, 2) + Math.pow(result.leftHandLandmarks[0].y - result.leftHandLandmarks[12].y, 2))
    }
    if(result.rightHandLandmarks){
        conHands.right = Math.sqrt(Math.pow(result.rightHandLandmarks[0].x - result.rightHandLandmarks[12].x, 2) + Math.pow(result.rightHandLandmarks[0].y - result.rightHandLandmarks[12].y, 2))
    }
    return conHands;
}

export const detectItem = (results: Results,count:number,hands: InitiationHands,nod:number[],participants:string[]):CountAndDetection => {
    let scoreCount:isScore = {LeftHand:false,RightHand:false,Mouth:false,Nod:false,GazeSpeeker:false};
    // console.log(participants)
    // 挙手判定
    // 左手
    if(results.leftHandLandmarks){
        let dist = Math.sqrt(Math.pow(results.leftHandLandmarks[0].x - results.leftHandLandmarks[12].x, 2) + Math.pow(results.leftHandLandmarks[0].y - results.leftHandLandmarks[12].y, 2));
        //console.log(dist)
        if(hands.left - dist < 0.15){
            console.log("左手をあげています+10")
            count += 5
            scoreCount.LeftHand = true
        }else{
            // console.log("LeftHand is around the face")
        }
    }else{
        // console.log("LeftHand is down")
    }
    // 右手
    if(results.rightHandLandmarks){
        let dist = Math.sqrt(Math.pow(results.rightHandLandmarks[0].x - results.rightHandLandmarks[12].x, 2) + Math.pow(results.rightHandLandmarks[0].y - results.rightHandLandmarks[12].y, 2));
        //console.log(dist)
        if(hands.right - dist < 0.15){
            console.log("右手をあげています+10")
            count += 5
            scoreCount.RightHand = true
        }else{
            // console.log("RightHand is around the face")
        }
    }else{
        // console.log("RightHand is down")
    }

    // 開口判定
    if(results.faceLandmarks){
        if(results.faceLandmarks[14].y - results.faceLandmarks[13].y < 0.005){
            // console.log("Close Mouse")
        }else{
            console.log("口があいています+1.5")
            count += 1.5
            scoreCount.Mouth = true
        }
    }

    // 顔向き判定
    // ヨコｘ＝±0.006 縦　0~0.01
    // ↓←(＋)、↑→(-)
    let face:NormalizedLandmarkList = faceNormalize(results)
    let deg = 0
    let faceposition=0

    if(face){
        let rad = Math.atan2(face[1].y,face[1].x)
        deg = rad * (180/Math.PI)
        deg = (deg - 90)
        if(deg < 0){
            deg = deg + 360
        }
        faceposition=whereFace(deg,participants.length)

        // 方向のテスト
        // faceposition=whereFace(deg,6)
        // let statusArray:string[] = ["sideparticipant","addressee","speaker","bystander","sideparticipant","bystander"]
        // console.log("参加者"+faceposition+"("+participants[faceposition]+")を向いています")
        
    }

    // 毎フレーム頷きを計測するための動作
    if(results.faceLandmarks){
        if(nodCount(nod)){
          count+= 15
          console.log("頷きました+15")
          scoreCount.Nod = true
        }
    }

    // 仮置き参加メンバーの参与役割から視線を把握
    if(participants[faceposition] == "speaker"){
        count = count + 0.5
        console.log("Speakerを見ています")
        scoreCount.GazeSpeeker = true
    }
    
    // 顔がない時にカウントを0にする
    if(!results.faceLandmarks){
        count = 0
    }

    return {nblCount:count,faceDetection:faceposition,Score:scoreCount}
}

export const nodCount = (nod:number[]):boolean =>{
    if(((nod[1]-nod[0] > 0) && (nod[2] - nod[1] <0)) && Math.abs(nod[1]-nod[0])+Math.abs(nod[2]-nod[1]) > 0.10){
        return true
    }else{
        return false
    }
}

const whereFace = (deg:number,length:number):number => {
    // 軸↓→　0 < deg < 359
    const theta = 360 / length

    let tmp = Math.floor((deg+(theta/2))/theta)
    if(tmp == length)tmp=0
    return tmp
}
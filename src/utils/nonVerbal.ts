import { POSE_CONNECTIONS, FACEMESH_TESSELATION, HAND_CONNECTIONS, Results, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/holistic';
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

export const InitHand = (result:Results,conHands:InitiationHands):InitiationHands => {
    if(result.leftHandLandmarks){
        conHands.left = Math.sqrt(Math.pow(result.leftHandLandmarks[0].x - result.leftHandLandmarks[12].x, 2) + Math.pow(result.leftHandLandmarks[0].y - result.leftHandLandmarks[12].y, 2))
    }
    if(result.rightHandLandmarks){
        conHands.right = Math.sqrt(Math.pow(result.rightHandLandmarks[0].x - result.rightHandLandmarks[12].x, 2) + Math.pow(result.rightHandLandmarks[0].y - result.rightHandLandmarks[12].y, 2))
    }
    return conHands;
}

export const detectItem = (results: Results,count:number,hands: InitiationHands,nod:number[]):number => {
    // 挙手判定

    // 左手
    if(results.leftHandLandmarks){
        let dist = Math.sqrt(Math.pow(results.leftHandLandmarks[0].x - results.leftHandLandmarks[12].x, 2) + Math.pow(results.leftHandLandmarks[0].y - results.leftHandLandmarks[12].y, 2));
        //console.log(dist)
        if(hands.left - dist < 0.15){
            console.log("左手をあげています+10")
            count += 5
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
            console.log("口があいています+3")
            count += 1.5
        }
    }

    // 顔向き判定
    // ヨコｘ＝±0.006 縦　0~0.01
    let face:NormalizedLandmarkList = faceNormalize(results)
    const display_x = 0.012
    const display_y = 0.01

    let face_x = face[1].x/display_x
    let face_y = face[1].y/display_y

    if(face_y < 1/2 && Math.abs(face_x) < 1/3){
        console.log("特定の方向を向いています+2")
        count += 1
    }

    // if(face_y < 1/2){
    //     console.log("上")
    // }else{
    //     console.log("下")
    // }
    // if(Math.abs(face_x) < 1/3){
    //     console.log("2")
    // }else if(face_x > 1/3){
    //     console.log("1")
    // }else{
    //     console.log("3")
    // }
    // console.log(face[1].x+":"+face[1].y)

    // 毎フレーム頷きを計測するための動作
    if(results.faceLandmarks){
        if(nodCount(nod)){
          count+= 15
          console.log("頷きました+15")
        }
    }
    return count
}

export const nodCount = (nod:number[]):boolean =>{
    if(((nod[1]-nod[0] > 0) && (nod[2] - nod[1] <0)) && Math.abs(nod[1]-nod[0])+Math.abs(nod[2]-nod[1]) > 0.10){
        return true
    }else{
        return false
    }
}
import { FACEMESH_TESSELATION, Results, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/holistic';

/**
 * 
 * @param results 検出結果
 */

export const faceNormalize = (result:Results):NormalizedLandmarkList => {
    let tmp = result.faceLandmarks
    // 
    if(tmp){
        const dist = Math.sqrt(Math.pow(tmp[33].x-tmp[263].x, 2) + Math.pow(tmp[33].y-tmp[263].y, 2)+ Math.pow(tmp[33].z-tmp[263].z,2));
        for (let i=0;i < tmp.length;i++){
            tmp[i].x = (tmp[i].x/dist)*0.06
            tmp[i].y = (tmp[i].y/dist)*0.06
            tmp[i].z = (tmp[i].z/dist)*0.06
        }

        let center:NormalizedLandmark = faceCenter(tmp)

        for (let i=0;i < tmp.length;i++){
            tmp[i].x -= center.x
            tmp[i].y -= center.y
            tmp[i].z -= center.z 
        }

        return tmp
    }else{
        return tmp
    }
}

const faceCenter = (face:NormalizedLandmarkList):NormalizedLandmark =>{
    let c:NormalizedLandmark={x:0,y:0,z:0};
    for(let j=0; j<face.length;j++){
        c.x += face[j].x
        c.y += face[j].y
        c.z += face[j].z
    }

    c.x /= face.length
    c.y /= face.length
    c.z /= face.length

    return c;
}
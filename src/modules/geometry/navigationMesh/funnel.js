import {vec3} from '../../math'

const triangleAreaSquared = (a, b, c) => {
    const ax = b[0] - a[0], az = b[2] - a[2],
          bx = c[0] - a[0], bz = c[2] - a[2]
    return bx * az - ax * bz
}

const Funnel = _ => {
    const portalsL = [],
          portalsR = []
    let length = 0,
        path = []
    
    return {
        get path(){ return path },
        clear: _ => portalsL.length = portalsR.length = length = 0,
        push: (left, right = left) => {
            portalsL[length] = left
            portalsR[length] = right
            length++
        },
        traverse: _ => {
            path.length = 0
            
            let leftIndex = 0,
                rightIndex = 0,
                leftPortal = portalsL[leftIndex],
                rightPortal = portalsR[rightIndex],
                apexPortal = leftPortal
            
            path.push(apexPortal)
            
            for(let i = 0; i < length; i++){
                let left = portalsL[i],
                    right = portalsR[i]
                if(triangleAreaSquared(apexPortal, rightPortal, right) <= 0.0)
                    if(vec3.equals(apexPortal, rightPortal) || triangleAreaSquared(apexPortal, leftPortal, right) > 0.0){
                        rightPortal = right
                        rightIndex = i
                    }else{
                        apexPortal = rightPortal = leftPortal
                        i = rightIndex = leftIndex
                        path.push(apexPortal)
                        continue
                    }
                if(triangleAreaSquared(apexPortal, leftPortal, left) >= 0.0)
                    if(vec3.equals(apexPortal, leftPortal) || triangleAreaSquared(apexPortal, rightPortal, left) < 0.0){
                        leftPortal = left
                        leftIndex = i
                    }else{
                        apexPortal = leftPortal = rightPortal
                        i = leftIndex = rightIndex
                        path.push(apexPortal)
                        continue
                    }
            }
            
            if(!path.length || !vec3.equals(path[path.length - 1], portalsL[length - 1]))
                path.push(portalsL[length - 1])
            
            return path
        }
    }
}

export {Funnel}
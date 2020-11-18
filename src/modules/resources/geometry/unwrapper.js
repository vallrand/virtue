import {logger} from '../../debug/logger'
import {factory, tie, Signal} from '../../util'
import {BinPacker, vec3, mat4, vec2, vec4} from '../../math'
import {LIGHTMAP_RESOLUTION} from '../../graphics'

const LIGHTMAP_PADDING = 2

const generateLightmapUV = (mesh, taskManager, MAX_BATCH_SIZE = 1024) => Signal(done => {
    const vertexArray = mesh.vertexArray,
          indexArray = mesh.indexArray,
          polycount = indexArray.length / 3,
          vertexcount = vertexArray.length / mesh.stride,
          offsets = mesh.dataFormat.reduce((attribs, attr) => (attribs[attr.type] = attribs.total, attribs.total += attr.size, attribs), {total: 0}),
          tempClusterLookup = new Uint16Array(vertexcount),
          stride = mesh.stride + 2,
          lightmappedArray = new Float32Array(vertexcount * stride),
          clusters = [],
          packer = BinPacker(),
          lightmapResolution = 128 * LIGHTMAP_RESOLUTION
    let clusterCount = 0,
        totalArea = 0,
        padding = 0
    logger.info('lightmap', `Unwrapping mesh for lightmap. polygons: ${polycount}, vertices: ${vertexcount}`)
    
    const selectCluster = vertices => vertices.map(idx => tempClusterLookup[idx]).filter(x => x).sort((c0, c1) => clusters[c1-1].length - clusters[c0-1].length)[0] || ++clusterCount
    const transferCluster = (fromIdx, intoIdx) => {
        clusters[intoIdx] = clusters[intoIdx].concat(clusters[fromIdx] || [])
        clusters[fromIdx].forEach(triangle => triangle.forEach(vertIdx => tempClusterLookup[vertIdx] = intoIdx+1))
        clusters[fromIdx].length = 0
    }
    const processTriangle = index => {
        const triangle = new Uint16Array(indexArray.buffer, indexArray.byteOffset + index * Uint16Array.BYTES_PER_ELEMENT * 3, 3),
              clusterIdx = selectCluster(triangle)
        clusters[clusterIdx-1] = clusters[clusterIdx-1] || []
        triangle.forEach(vertIdx => {
            const prevClusterIdx = tempClusterLookup[vertIdx]
            if(prevClusterIdx !== clusterIdx && prevClusterIdx)
                transferCluster(prevClusterIdx-1, clusterIdx-1)
            tempClusterLookup[vertIdx] = clusterIdx
        })
        clusters[clusterIdx-1].push(triangle)
    }
    const extractVertex = vertIndex => ({
        position: !isNaN(offsets.position) && new Float32Array(vertexArray.buffer, vertexArray.byteOffset + (vertIndex * offsets.total + offsets.position) * Float32Array.BYTES_PER_ELEMENT, 3),
        uv: !isNaN(offsets.uv) && new Float32Array(vertexArray.buffer, vertexArray.byteOffset + (vertIndex * offsets.total + offsets.uv) * Float32Array.BYTES_PER_ELEMENT, 2)
    })
    const calculateScaleContribution = (v0, v1) => {
        const uvEdge = vec2.subtract(v0.uv, v1.uv),
              edge = vec3.subtract(v0.position, v1.position),
              uvEdgeLength = vec2.distance(uvEdge),
              edgeLength = vec3.distance(edge),
              xContrib = Math.abs(uvEdge[0]) / uvEdgeLength,
              yContrib = Math.abs(uvEdge[1]) / uvEdgeLength
        return vec2(
            xContrib * edgeLength / uvEdgeLength || 0,
            yContrib * edgeLength / uvEdgeLength || 0
        )
    }
    const processCluster = clusterIdx => {
        if(!clusters[clusterIdx].length) return clusters[clusterIdx] = null
        
        const cluster = clusters[clusterIdx],
              scale = vec2(),
              vertices = cluster.reduce((vertexMap, polygon) => {
                  vertexMap[polygon[0]] = vertexMap[polygon[0]] || extractVertex(polygon[0])
                  vertexMap[polygon[1]] = vertexMap[polygon[1]] || extractVertex(polygon[1])
                  vertexMap[polygon[2]] = vertexMap[polygon[2]] || extractVertex(polygon[2])
                  vec2.add(scale, calculateScaleContribution(vertexMap[polygon[0]], vertexMap[polygon[1]]), scale)
                  vec2.add(scale, calculateScaleContribution(vertexMap[polygon[0]], vertexMap[polygon[2]]), scale)
                  vec2.add(scale, calculateScaleContribution(vertexMap[polygon[1]], vertexMap[polygon[2]]), scale)
                  return vertexMap
              }, Object.create(null)),
              vertexIndices = Object.keys(vertices),
              lightmapUVs = new Float32Array(vertexIndices.length * 2),
              min = vec2(Number.MAX_VALUE, Number.MAX_VALUE), max = vec2(-Number.MAX_VALUE, -Number.MAX_VALUE)

        for(let i = 0; i < vertexIndices.length; i++){
            let vertex = vertices[vertexIndices[i]]  
            lightmapUVs[i*2+0] = vertex.uv[0]
            lightmapUVs[i*2+1] = vertex.uv[1]
            vec2.min(min, vertex.uv, min)
            vec2.max(max, vertex.uv, max)
        }
        const bounds = vec2.subtract(max, min)
        vec2.scale(scale, 1/cluster.length, scale)
        vec2.multiply(bounds, scale, bounds)
        totalArea += bounds[0]*bounds[1]
        clusters[clusterIdx] = {
            vertexIndices, lightmapUVs, min, scale, bounds,
            rect: { w: bounds[0], h: bounds[1] }
        }
    }
    const generateLightmapUV = clusterIdx => {
        const cluster = clusters[clusterIdx]
        if(!cluster) return false
        cluster.vertexIndices.map(idx => parseInt(idx)).forEach((idx, i) => {
            const lmUv = vec2(
                (cluster.lightmapUVs[i*2+0] - cluster.min[0]) * cluster.scale[0],
                (cluster.lightmapUVs[i*2+1] - cluster.min[1]) * cluster.scale[1]
            )
            lightmappedArray[idx * stride + offsets.total + 0] = (lmUv[0] + cluster.rect.fit.x + padding) / packer.root.w
            lightmappedArray[idx * stride + offsets.total + 1] = (lmUv[1] + cluster.rect.fit.y + padding) / packer.root.h
        })
    }
    const copyVertexData = idx => { for(let offset = 0; offset < offsets.total; lightmappedArray[idx * stride + offset] = vertexArray[idx * offsets.total + offset++]); }

    return taskManager.deferIteration(processTriangle, polycount, 0, MAX_BATCH_SIZE)
    .pipe(_ => taskManager.deferIteration(processCluster, clusterCount, 0, MAX_BATCH_SIZE))
    .pipe(_ => {
        let lightmapScale = Math.sqrt(LIGHTMAP_PADDING*totalArea)
        padding = lightmapScale / lightmapResolution
        return clusters.filter(x => x)
            .map(cluster => cluster.rect)
            .map(block => (block.w += 2 * padding, 
                           block.h += 2 * padding, block))
    })
    .pipe(blocks => packer.insert(blocks))
    .pipe(_ => taskManager.deferIteration(generateLightmapUV, clusterCount, 0, MAX_BATCH_SIZE))
    .pipe(_ => taskManager.deferIteration(copyVertexData, vertexcount, 0, MAX_BATCH_SIZE))
    .pipe(_ => {
        mesh.dataFormat.push({
            type: 'lm_uv', size: 2, byteSize: Float32Array.BYTES_PER_ELEMENT, offset: mesh.stride
        })
        mesh.stride = stride
        mesh.vertexArray = lightmappedArray
        mesh.uvBounds = { w: packer.root.w, h: packer.root.h }
        logger.info('lightmap', `Lightmap UVs generated. dimensions: ${packer.root.w} x ${packer.root.h} padding: ${padding*128}`) 
        done()
    })
})

factory.declare('loader', (target, options) => {
    const taskManager = options.manager
    
    target.appendParser((loader, resource, next) => {
        if(resource.type !== loader.RESOURCE_TYPE.MESH) return next()
        if(resource.data.dataFormat.find(attrib => attrib.type === 'joint' || attrib.type === 'lm_uv')) return next()
        
        generateLightmapUV(resource.data, taskManager).listen(next)
    })
})
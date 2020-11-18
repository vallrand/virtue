import {mat4, dualquat, quat, vec4, vec3, lerp, DEG_RAD, EPSILON} from '../../modules/math'

let PARSER_DEBUG = false

const parseFBXNodes = rawData => {
	let indent = 0,
	propCursor = null
	
	const rootNode = {subNodes: {}},
	nodeStack = [],
	nodeMap = Object.create(null),
	trimName = name => name.trim().replace(/^"/,'').replace(/"$/,''),
	nodeStart = (nodeName, attrs) => {
		const parentNode = nodeStack[indent - 1] || rootNode,
			attrType = attrs.pop() || null,
			attrName = (attrs.pop() || '').replace(/^(\w+)::/,'') || null,
			attrId = parseInt(attrs.pop()) || null,
			node = { nodeName, subNodes: {} }
		attrType && (node.attrType = attrType)
		attrName && (node.attrName = attrName)
		attrId && (node.attrId = attrId)

        if(node.attrId)
            (parentNode.subNodes[nodeName] = parentNode.subNodes[nodeName] || Object.create(null))[node.attrId] = node 
        else if(parentNode.subNodes[nodeName]) 
            parentNode.subNodes[nodeName] instanceof Array ? parentNode.subNodes[nodeName].push(node) : parentNode.subNodes[nodeName] = [parentNode.subNodes[nodeName], node]
        else
            parentNode.subNodes[nodeName] = node
		nodeStack.push(node)
		++indent
	},
	nodeEnd = _ => {
		const prevNode = nodeStack[indent - 2],
			node = nodeStack.pop()
		--indent
		Object.keys(node.subNodes).length > 0 || delete node.subNodes
		if((/Properties(\d)+/).test(node.nodeName)) delete prevNode.subNodes[node.nodeName]
		node.attrId && (nodeMap[node.attrId] = node)
	},
	nodeProperty = (propName, propValue) => {
		let parentNode = nodeStack[indent - 1]
		
		if(propName === 'C') propValue = propValue.split(',').map((v, i) => i && i < 3 ? parseInt(v) : trimName(v))
		if((/Properties(\d)+/).test(parentNode.nodeName)){
			let properties = propValue.split('",').map(prop => prop.trim().replace(/^\"/,''))
			parentNode = nodeStack[indent - 2]
			propName = properties[0].replace(/\s/,'_')
			propValue = {
				type: properties[1],
				type2: properties[2],
				flag: properties[3],
				value: (({
					'int': parseInt,
					'double': parseFloat,
                    'bool': n => !!parseInt(n),
					'Vector3D': n => n.split(','),
					'ColorRGB': n => n.split(',')
				})[properties[1]] || (v => v))(properties[4] || properties[3])
			}
		}
		
		!parentNode[propName] ? (parentNode[propName] = propValue) : 
		(parentNode[propName] instanceof Array ? parentNode[propName].push(propValue) : parentNode[propName] = [parentNode[propName], propValue])
		propCursor = propName		
	},
	nodePropertyContinue = propValue => nodeStack[indent - 1][propCursor] += propValue
	
	if(PARSER_DEBUG) console.log('%c FBX::PARSER - Parsing Node Tree...', 'color: #888800')
	rawData.split('\n')
	.filter(line => !(/^[\s\t]*;/).test(line) && !(/^[\s\t]*$/).test(line))
	.forEach(line => {
		let match = line.match(new RegExp('^\\t{' + indent + '}(\\w+):(.*){'))
		if(match)
			nodeStart(trimName(match[1]), match[2].split(',').map(trimName))
		else if(match = line.match(new RegExp('^\\t{' + indent + '}(\\w+):[\\s\\t\\r\\n](.*)')))
			nodeProperty(trimName(match[1]), trimName(match[2]) || null)
		else if(new RegExp('^\\t{' + (indent - 1) + '}}').test(line))
			nodeEnd()
		else if(line.match( /^[^\s\t}]/ ))
			nodePropertyContinue(line)
	})
	
	if(PARSER_DEBUG) console.log('%c FBX::PARSER - Resolving Connections..', 'color: #888800')
	if(rootNode.subNodes['Connections']){
		const connections = rootNode.subNodes['Connections']['C']
		Object.values(nodeMap).forEach(linkedNode => {
			const id = linkedNode.attrId,
				linkParents = connections.filter(conn => conn[1] === id).map(conn => conn[2]).map(parentId => nodeMap[parentId] || null).filter(l => l),
				linkChildren = connections.filter(conn => conn[2] === id).map(conn => conn[1]).map(childId => nodeMap[childId] || null).filter(l => l)
			linkParents.length > 0 && (linkedNode.linkParents = linkParents)
			linkChildren.length > 0 && (linkedNode.linkChildren = linkChildren)
		})
	}
	return {fbxNodes: rootNode.subNodes, nodeMap}
}


const constructHierarchy = fbxCtx => {
	const objects = fbxCtx.fbxNodes['Objects'],
          models = objects.subNodes['Model'],
          poses = objects.subNodes['Pose']
	
	if(PARSER_DEBUG) console.log('%c FBX::PARSER - Constructing Bone Hierarchy..', 'color: #888800')
	const bones = Object.values(models).filter(model => model.attrId)
	.map((bone, id, boneList) => {
        const localTranslation = vec3(0.0, 0.0, 0.0),
              localRotation = quat(),
              localScale = vec3(1.0, 1.0, 1.0),
              localTransform = mat4.identity()
        
        if(bone['Lcl_Rotation']) quat.fromEulerOrdered(...bone['Lcl_Rotation'].value.split(',').map(n => parseFloat(n) * DEG_RAD), 'ZYX', localRotation)
        if(bone['Lcl_Translation']) vec3.copy(bone['Lcl_Translation'].value.split(',').map(n => parseFloat(n)), localTranslation)
        if(bone['Lcl_Scaling']) vec3.copy(bone['Lcl_Scaling'].value.split(',').map(n => parseFloat(n)), localScale)
        
        if(bone['PreRotation']){
            const preRotation = quat.normalize(quat.fromEulerOrdered(...bone['PreRotation'].value.map(n => parseFloat(n) * DEG_RAD), 'ZYX'))
            bone.preRotationTransform = preRotation
            quat.multiply(preRotation, localRotation, localRotation)
        }
        if(bone['PostRotation']){
            const postRotation = quat.normalize(quat.fromEulerOrdered(...bone['PostRotation'].value.map(n => parseFloat(n) * DEG_RAD), 'ZYX'))
            bone.postRotationTransform = postRotation
            quat.multiply(localRotation, postRotation, localRotation)
        }
        mat4.fromRotationTranslationScale(quat.normalize(localRotation), localTranslation, localScale, localTransform)

        const pivotTransform = mat4.fromRotationTranslationScale(
             bone['GeometricRotation'] ? quat.normalize(quat.fromEulerOrdered(...bone['GeometricRotation'].value.map(n => parseFloat(n) * DEG_RAD), 'ZYX')) : quat(),
             bone['GeometricTranslation'] ? bone['GeometricTranslation'].value.map(n => parseFloat(n)) : vec3(0, 0, 0),
             bone['GeometricScaling'] ? bone['GeometricScaling'].value.map(n => parseFloat(n)) : vec3(1, 1, 1))
        
		return Object.assign(bone, {
			parentBone: (bone.linkParents || []).find(parent => models[parent.attrId]) || null,
			depth: 0, localTransform, pivotTransform, invBindPose: mat4.identity(), bindPose: mat4.identity()
		})
	}).map(bone => {
		let tempParent = bone,
            worldTransform = mat4.identity()
		do{
			mat4.multiply(tempParent.localTransform, worldTransform, worldTransform)
		}while((bone.depth++, tempParent = tempParent.parentBone))
		return Object.assign(bone, {worldTransform})
	}).sort((a, b) => a.depth - b.depth).map((bone, id, bones) => ({
        id: bone.boneIdx = id+1, original: bone, name: bone.attrName,
		parent: bones.indexOf(bone.parentBone) + 1,
        localTransform: bone.localTransform,
        pivotTransform: bone.pivotTransform,
        bindPose: mat4.copy(bone.worldTransform, bone.bindPose),
        invBindPose: mat4.invert(bone.bindPose, bone.invBindPose)
	}))
	fbxCtx.boneHierarchy = bones
    
	if(PARSER_DEBUG) console.log('%c FBX::PARSER - Restoring Bind Pose..', 'color: #888800')
	if(poses)
        Object.values(poses).map(poseNode => poseNode.subNodes['PoseNode']).map(poseNodes => (poseNodes instanceof Array ? poseNodes : [poseNodes]) 
		.map(pose => Object.assign(fbxCtx.nodeMap[pose.Node], {
                worldTransform: mat4.copy(pose.subNodes['Matrix']['a'].split(',').map(n => parseFloat(n)), mat4())
        })).forEach(bone => {
            const parent = bone.linkParents ? bone.linkParents.find(p => p.worldTransform) : null
            const localTransform = parent ? mat4.multiply(mat4.invert(parent.worldTransform), bone.worldTransform) : bone.worldTransform
            mat4.copy(localTransform, bone.localTransform)
            mat4.copy(bone.worldTransform, bone.bindPose)
            mat4.copy(mat4.invert(bone.worldTransform), bone.invBindPose)
		}))
	
	return fbxCtx
}

const FBXTimeline = (T, R, S, node) => {
    const KTIME = 1539538600,
          EPSILON = 0.000001,
          DISCARD_THRESHOLD = EPSILON
    
    let initialPosition = vec3.translationFromMat4(node.localTransform, vec3()),
        initialRotation = quat.fromMat4(node.localTransform, quat()),
        initialScale = vec3.scaleFromMat4(node.localTransform, vec3()),
        preRotation = node.preRotationTransform || quat(),
        discardedKeyFrames = 0
    
    const sampleAnimatedProperty = (propertyCurve, time) => {
        const propertyFrameIndex = propertyCurve.times.findIndex(t => t >= time)
        if(propertyFrameIndex === -1) return propertyCurve.values[propertyCurve.times.length - 1]
        if(propertyFrameIndex === 0) return propertyCurve.values[0]
        const frameTime = propertyCurve.times[propertyFrameIndex], prevFrameTime = propertyCurve.times[propertyFrameIndex - 1],
              frameValue = propertyCurve.values[propertyFrameIndex], prevFrameValue = propertyCurve.values[propertyFrameIndex - 1],
              f = (time - prevFrameTime)/(frameTime - prevFrameTime)
        return lerp(prevFrameValue, frameValue, f)
    }
    
    let minTimestamp = Number.MAX_VALUE, maxTimestamp = 0
    ;[T, R, S].filter(n => n)
    .forEach(n => [n.axis.x, n.axis.y, n.axis.z].filter(n => n)
             .forEach(n => (minTimestamp = Math.min(minTimestamp, n.times[0]), maxTimestamp = Math.max(maxTimestamp, n.times[n.times.length-1]))))
    const frameCount = ((maxTimestamp - minTimestamp) / KTIME) + 1
    const frames = Array.range(0, frameCount).map(frameIdx => {
        const time = frameIdx * KTIME + minTimestamp
        const key = {
            position: vec3.copy(initialPosition, vec3()),
            rotation: quat.copy(initialRotation, quat()),
            scale: vec3.copy(initialScale, vec3()),
            time: time / (KTIME * 30)}
        if(T) vec3.copy([T.axis.x ? sampleAnimatedProperty(T.axis.x, time) : 0,
                      T.axis.y ? sampleAnimatedProperty(T.axis.y, time) : 0,
                      T.axis.z ? sampleAnimatedProperty(T.axis.z, time) : 0], key.position)
        if(S) vec3.copy([S.axis.x ? sampleAnimatedProperty(S.axis.x, time) : 1,
                      S.axis.y ? sampleAnimatedProperty(S.axis.y, time) : 1,
                      S.axis.z ? sampleAnimatedProperty(S.axis.z, time) : 1], key.scale)
        if(R) quat.multiply(preRotation, quat.fromEulerOrdered( 
                      R.axis.x ? sampleAnimatedProperty(R.axis.x, time) : 0,
                      R.axis.y ? sampleAnimatedProperty(R.axis.y, time) : 0,
                      R.axis.z ? sampleAnimatedProperty(R.axis.z, time) : 0, 'ZYX'), key.rotation)
        const combinedTransform = mat4.fromRotationTranslationScale(quat.normalize(key.rotation, quat()), key.position, key.scale, mat4()),
              dualQuatTransform = dualquat.fromMat4(combinedTransform, dualquat())
        return Object.assign(key, {combinedTransform, dualQuatTransform})
    }).map((frame, idx, frameArray) => {
        if(idx > 0 && idx < frameArray.length - 1){
            const prevFrame = frameArray[idx-1],
                  nextFrame = frameArray[idx+1],
                  factor = (frame.time - prevFrame.time)/(nextFrame.time - prevFrame.time),
                  expectedPosition = vec3.lerp(prevFrame.position, nextFrame.position, factor),
                  expectedRotation = quat.slerp(prevFrame.rotation, nextFrame.rotation, factor),
                  expectedScale = vec3.lerp(prevFrame.scale, nextFrame.scale, factor),
                  positionDifference = vec3.sqrtLength(vec3.subtract(frame.position, expectedPosition, vec3())),
                  rotationDifference = vec4.sqrtLength(vec4.subtract(frame.rotation, expectedRotation, vec4())),
                  scaleDifference = vec3.sqrtLength(vec3.subtract(frame.scale, expectedScale, vec3()))
            if(positionDifference < DISCARD_THRESHOLD && rotationDifference < DISCARD_THRESHOLD && scaleDifference < DISCARD_THRESHOLD)
                return (discardedKeyFrames++, null)
        }
        return frame
    }).filter(f => f)

    return {
        T, S, R, frames, node,
        sample: time => {
            let minTime = frames[0].time,
                maxTime = frames[frames.length - 1].time
            let frame = Math.max(Math.floor((frames.length-1)*((time- minTime) / (maxTime - minTime))) || 0, 0)
            return frames[Math.min(frames.length-1,frame)].dualQuatTransform
        },
        get startTime(){ return minTimestamp / (KTIME * 30) },
        get duration(){ return (maxTimestamp - minTimestamp) / (KTIME * 30) }
    }
}

const readAnimationData = fbxCtx => {
    const objects = fbxCtx.fbxNodes['Objects'],
          connections = fbxCtx.fbxNodes['Connections']['C']
    
    if(!objects.subNodes['AnimationCurveNode']) return false
    
    if(PARSER_DEBUG) console.log('%c FBX::PARSER - Reading Animation Data..', 'color: #888800')
    const curveNodes = objects.subNodes['AnimationCurveNode'],
          curves = objects.subNodes['AnimationCurve'],
          layers = objects.subNodes['AnimationLayer'],
          stacks = objects.subNodes['AnimationStack']
    const animNodes = Object.keys(curveNodes).filter(key => (/\d+/).test(key)).map(key => curveNodes[key])
    .filter(curveNode => (/S|R|T/).test(curveNode.attrName))
    .map(curveNode => {
        const parentBone = curveNode.linkParents.find(p => p.boneIdx),
              boneIdx = parentBone && parentBone.boneIdx
        return Object.assign(curveNode, {
            axis: {}, boneIdx
        })
    }).filter(curve => !isNaN(curve.boneIdx))
    Object.keys(curves).filter(key => (/\d+/).test(key)).map(key => curves[key])
    .map(curve => ({
        times: curve.subNodes['KeyTime']['a'].split(',').map(n => parseFloat(n)),
        values: curve.subNodes['KeyValueFloat']['a'].split(',').map(n => parseFloat(n)),
        attrFlags: curve.subNodes['KeyAttrFlags']['a'].split(',').map(n => parseInt(n)),
        attrData: curve.subNodes['KeyAttrDataFloat']['a'].split(',').map(n => parseFloat(n)),
        parent: curve.linkParents[0],
        relation: connections.find(conn => conn[1] === curve.attrId)[3].replace('d|','').toLowerCase()
    })).forEach(curve => {
        curve.parent.axis[curve.relation] = curve
        curve.parent.attrName === 'R' && (curve.values = curve.values.map(n => n * DEG_RAD))
    })
    Object.values(layers).forEach(layer => Object.assign(layer, {
        nodeCurves: layer.linkChildren.reduce((nodeCurves, nodeCurve) => ((nodeCurves[nodeCurve.boneIdx] = nodeCurves[nodeCurve.boneIdx] || Object.create(null))[nodeCurve.attrName] = nodeCurve, nodeCurves), [])      
    }))
    Object.values(stacks).forEach(stack => stack.linkChildren.map(layer => {
            const timeline = layer.nodeCurves.map((nodeCurve, boneIdx) => FBXTimeline(nodeCurve.T, nodeCurve.R, nodeCurve.S, fbxCtx.boneHierarchy[boneIdx-1].original))
            fbxCtx.animation = timeline
    }))
    return fbxCtx
}

const mapBoneWeights = fbxCtx => {
	const objects = fbxCtx.fbxNodes['Objects']
	
    if(!objects.subNodes['Deformer']) return false
    
	if(PARSER_DEBUG) console.log('%c FBX::PARSER - Mapping Bone Weights..', 'color: #888800')
	const deformers = objects.subNodes['Deformer']
	Object.values(deformers).filter(deformer => deformer.attrType === 'Cluster' && deformer.subNodes['Indexes'])
	.forEach(cluster => {
		const id = cluster.attrId
		const linkMode = cluster.Mode
		const indexes = cluster.subNodes['Indexes']['a'].split(',').map(n => parseInt(n))
		const weights = cluster.subNodes['Weights']['a'].split(',').map(n => parseFloat(n))
		const transform = cluster.subNodes['Transform']['a'].split(',').map(n => parseFloat(n))
		const transformLink = cluster.subNodes['TransformLink']['a'].split(',').map(n => parseFloat(n))
		const parent = cluster.linkParents[0]
		const boneIdx = cluster.linkChildren[0].boneIdx
        
        mat4.copy(transformLink, cluster.linkChildren[0].bindPose)
        
        Object.assign(cluster, {
            boneWeights: { indexes, weights, boneIdx },
            transformLink: mat4.copy(transformLink, mat4()),
            transform: mat4.copy(transform, mat4())
        })
	})
    Object.values(deformers)
	.filter(deformer => deformer.attrType === 'Skin')
    .forEach(skin => {
        const mappedWeights = []
        skin.linkChildren.filter(subDeformer => subDeformer.boneWeights)
            .forEach((subDeformer, deformerIdx) => subDeformer.boneWeights.indexes.forEach((vertIdx, i) => {
            mappedWeights[vertIdx] = mappedWeights[vertIdx] || {weight: [], index: []}
            mappedWeights[vertIdx].weight.push(subDeformer.boneWeights.weights[i])
            mappedWeights[vertIdx].index.push(subDeformer.boneWeights.boneIdx)
        }))
        mappedWeights.filter(weightData => weightData.index.length > 4).forEach(weightData => {
            const maxInfluence = weightData.index.map((idx, i) => ({idx, w: weightData.weight[i]})).sort((a, b) => b.w - a.w),
                  remaining = maxInfluence.slice(-4).reduce((acc, a) => acc + a.w, 0)
            weightData.index = maxInfluence.slice(0, 4).map(wd => wd.idx)
            weightData.weight = maxInfluence.slice(0, 4).map(wd => wd.w + remaining)
        })
        Object.assign(skin, { mappedWeights })
    })
	return fbxCtx
}

const buildGeometry = fbxCtx => {
    const objects = fbxCtx.fbxNodes['Objects']
    
	if(PARSER_DEBUG) console.log('%c FBX::PARSER - Building Geometry..', 'color: #888800')
    const geometries = objects.subNodes['Geometry']
    const processVertexData = (node, dataSize, dataNodeName, indexNodeName, indexes) => {
        if(!node) return null
        const mappingType = node['MappingInformationType'],
              referenceType = node['ReferenceInformationType'],
              dataMapping = [],
              duplicates = node.subNodes[dataNodeName]['a'].split(',').map(n => parseFloat(n))
                .reduce((group, el, i) => (i%dataSize === 0 ? group.push([el]) : group[Math.floor(i/dataSize)].push(el), group), []),
              data = duplicates.reduce((unique, value, idx) => 
                  (duplicates[idx] = (unique.findIndex(vector => vector.every((v, i) => Math.abs(v - value[i]) < EPSILON)) + 1 || (unique.push(value), unique.length)) - 1, unique), [])
        if(referenceType === 'IndexToDirect'){
            const indexArray = node.subNodes[indexNodeName]['a'].split(',').map(n => parseInt(n))
            if(mappingType === 'ByPolygonVertex')
                 indexes.forEach((polyIndexes, polyIdx) => dataMapping[polyIdx] = polyIndexes.map(_ => indexArray.shift()).map(i => duplicates[i]))
            else if(mappingType === 'ByPolygon')
                indexes.forEach((polyIndexes, polyIdx) => dataMapping[polyIdx] = polyIndexes.map(i => indexArray[polyIdx]).map(i => duplicates[i]))
            else if(mappingType === 'ByVertex' || mappingType === 'ByVertice')
                indexes.forEach((polyIndexes, polyIdx) => dataMapping[polyIdx] = polyIndexes.map(i => indexArray[i]).map(i => duplicates[i]))
        }else if(referenceType === 'Direct')
            if(mappingType === 'ByPolygonVertex'){
                let id = 0
                indexes.forEach((polyIndexes, polyIdx) => dataMapping[polyIdx] = polyIndexes.map(_ => id++).map(i => duplicates[i]))
            }else if(mappingType === 'ByPolygon')
                indexes.forEach((polyIndexes, polyIdx) => dataMapping[polyIdx] = polyIndexes.map(_ => polyIdx).map(i => duplicates[i]))
            else if(mappingType === 'ByVertex' || mappingType === 'ByVertice')
                indexes.forEach((polyIndexes, polyIdx) => dataMapping[polyIdx] = polyIndexes.map(i => i).map(i => duplicates[i]))
        return {dataMapping, data}
    }
    //const processMaterials = (node) => {
    //    const materials = node.subNodes['Materials'],
    //          mappingType = materials['MappingInformationType'],
    //          referenceType = materials['ReferenceInformationType'],
    //          materialIndexes = materials['a'].split(',').map(n => parseInt(n))
    //    return 0
    //}
    const meshes = Object.values(geometries).filter(geometry => geometry.attrType === 'Mesh')
    .map(geometry => {
        const indexes = geometry.subNodes['PolygonVertexIndex']['a'].split(',').map(n => parseInt(n))
            .reduce((group, idx) => (idx < 0 ? (group[group.length-1].push(idx ^ -1), group.push([])) : 
                                     group[group.length-1].push(idx), group), [[]]).slice(0, -1)
        const positions = geometry.subNodes['Vertices']['a'].split(',').map(n => parseFloat(n))
            .reduce((group, el, i) => (i%3 === 0 ? group.push([el]) : group[Math.floor(i/3)].push(el), group), [])
        const normals = processVertexData(geometry.subNodes['LayerElementNormal'], 3, 'Normals', 'NormalIndex', indexes)
        const uvs = processVertexData(geometry.subNodes['LayerElementUV'], 2, 'UV', 'UVIndex', indexes)
        const colors = processVertexData(geometry.subNodes['LayerElementColor'], 4, 'Colors', 'ColorIndex', indexes)
        const skin = geometry.linkChildren && geometry.linkChildren.find(child => child.attrType === 'Skin')
        const outIndices = []
        const outVertices = Object.create(null)
        const outDataFormat = []
        //const materials = processMaterials(geometry.subNodes['LayerElementMaterial'])
        
        indexes.map((poly, polyIdx) => poly.map((vertIdx, i) => {
            const vertexIndexes = [vertIdx],
                  vertex = {position: positions[vertIdx]}
            vertexIndexes.push(normals ? (vertex.normal = normals.data[normals.dataMapping[polyIdx][i]], normals.dataMapping[polyIdx][i]) : null)
            vertexIndexes.push(uvs ? (vertex.uv = uvs.data[uvs.dataMapping[polyIdx][i]], uvs.dataMapping[polyIdx][i]) : null)
            vertexIndexes.push(colors ? (vertex.color = colors.data[colors.dataMapping[polyIdx][i]], colors.dataMapping[polyIdx][i]) : null)
            skin && (vertex.weights = skin.mappedWeights[vertIdx])
            outVertices[vertexIndexes.join('|')] = vertex
            return vertexIndexes.join('|')
        })).forEach(poly => Array.range(poly.length - 2).forEach(iOffset => outIndices.push(poly[0], poly[iOffset+1], poly[iOffset+2])))
        
        const parentBone = geometry.linkParents.find(parent => parent.attrType === 'Mesh'),
              preTransform = mat4.multiply(parentBone.worldTransform, parentBone.pivotTransform)

        Object.values(outVertices).forEach(vertex => {
            vertex.position = vec4.transform(vec4(vertex.position[0], vertex.position[1], vertex.position[2], 1.0), preTransform).slice(0, 3)
            if(vertex.normal) vertex.normal = vec4.transform(vec4(vertex.normal[0], vertex.normal[1], vertex.normal[2], 0.0), preTransform).slice(0, 3)
        })
        return { outIndices, outVertices, outDataFormat, boneIdx: parentBone.boneIdx, materialId: parentBone.materialId }
    }).sort((a, b) => a.materialId - b.materialId)
    fbxCtx.meshes = meshes
	return fbxCtx
}

const assignMaterials = fbxCtx => {
    const objects = fbxCtx.fbxNodes['Objects'],
          connections = fbxCtx.fbxNodes['Connections']['C']
    
    const WRAP_REPEAT = 0,
          WRAP_CLAMP = 1
    
    if(!objects.subNodes['Texture']) return false
    
	if(PARSER_DEBUG) console.log('%c FBX::PARSER - Assigning Materials..', 'color: #888800')
    const video = objects.subNodes['Video'],
          texture = objects.subNodes['Texture'],
          material = objects.subNodes['Material']
    
    const textures = Object.values(texture).map((textureNode, textureId) => {
        const filename = (textureNode['RelativeFilename'] || textureNode['FileName']).split('\\').pop(),
              wrapModeS = (textureNode['WrapModeU'] && textureNode['WrapModeU'].value) ? WRAP_CLAMP : WRAP_REPEAT,
              wrapModeT = (textureNode['WrapModeV'] && textureNode['WrapModeV'].value) ? WRAP_CLAMP : WRAP_REPEAT,
              textureType = connections.find(conn => conn[1] === textureNode.attrId)[3].split('|').pop()
        return textureNode.textureData = {filename, wrapModeS, wrapModeT, textureId, textureType}
    })
    //TODO sort by material and order geometry
    const materials = Object.values(material).filter(materialNode => materialNode.linkChildren).map((materialNode, materialId) => {
        const parentBones = materialNode.linkParents.filter(parent => parent.attrType === 'Mesh'),
              textures = materialNode.linkChildren.filter(child => child.textureData).map(child => child.textureData)
        .reduce((texMap, texture) => {
            if(texture.textureType === 'texmapDiffuse' || texture.textureType === 'DiffuseColor')
                texMap.diffuse = texture
            else if(texture.textureType === 'texmapBump' || texture.textureType === 'NormalMap')
                texMap.normal = texture
            return texMap
        }, Object.create(null))
        return {textures, bones: parentBones.map(parentBone => (parentBone.materialId = materialId, parentBone.boneIdx))}
    })
    
    fbxCtx.materials = materials
	return fbxCtx
}

const parseFBX = data => new Promise((resolve, reject) => {
    const ctx = parseFBXNodes(data)
    constructHierarchy(ctx)
    readAnimationData(ctx)
    mapBoneWeights(ctx)
    assignMaterials(ctx)
    buildGeometry(ctx)
    if(PARSER_DEBUG) console.log('%c FBX::PARSER - Done!', 'color: #888800')
    resolve(ctx)
})

export {parseFBX}
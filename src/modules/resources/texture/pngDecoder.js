import {factory, Signal, Stream} from '../../util'
import {zlib} from './zlib'

const defaultTaskManager = { schedule: task => task() }

const PNGDecoder = Object.create(null)

PNGDecoder.process = (buffer, taskManager = defaultTaskManager) => 
    PNGDecoder.decode(buffer, taskManager)
    .pipe(ctx => PNGDecoder.inflate(ctx))
    .pipe(ctx => PNGDecoder.readInterlace(ctx))
    .pipe(ctx => PNGDecoder.toRGBA8(ctx))

PNGDecoder.inflate = target => Signal((resolve, reject) => {
    const inflator = zlib.Inflator(),
          rawData = target.out.data,
          rawDataLength = rawData.length,
          taskManager = target.taskManager,
          maxChunkSize = 1024 * 16
    
    inflator.onComplete = _ => (target.out.data = inflator.result, resolve(target))
    inflator.onError = (code, message) => reject(new Error(`Inflator exception ${code}: "${message}"`))
    for(let offset = 0; offset < rawDataLength; offset += maxChunkSize)
        taskManager.schedule(inflator.consume.bind(inflator, new Uint8Array(rawData.buffer, rawData.byteOffset + offset, Math.min(maxChunkSize, rawDataLength - offset)), offset + maxChunkSize >= rawDataLength))
})

//TODO keep the same data format
PNGDecoder.toRGBA8 = target => Signal((resolve, reject) => {
    const width = target.out.width,
          height = target.out.height,
          area = width*height,
          pixelByteSize = target.channels * target.out.depth,
          bytesPerPixel = pixelByteSize,
          bytesPerLine = Math.ceil(width * bytesPerPixel/8),
          stream = PNGDecoder.stream,
          bin = PNGDecoder.bin,
          taskManager = target.taskManager,
          chunkMaxSize = 1024 * 16 * 16 * 10,
          
          buffer = new Uint8Array(area * 4),
          uint32View = new Uint32Array(buffer.buffer),
          src = target.out.data,
          colorType = target.out.colorType,
          depth = target.out.depth
    let processor, totalArea = area
    
    if(colorType === 6){
        totalArea = area << 2
        if(depth === 8) processor = stream.copy.bind(null, buffer, 0, src, 0)
        else if(depth === 16) processor = stream.iterateChunk.bind(null, i => buffer[i] = src[i++ << 1]) 
    }else if(colorType === 2){
        let trns = target.out.transparency,
            tR = trns ? trns[0] : -1, tG = trns ? trns[1] : -1, tB = trns ? trns[2] : -1
        if(depth === 8) processor = stream.iterateChunk.bind(null, i => {
            const qi = i << 2, i3 = i * 3
            buffer[qi] = src[i3]
            buffer[qi+1]=src[i3+1]
            buffer[qi+2]=src[i3+2]
            buffer[qi+3] = (trns && src[i3] === tR && src[i3+1] === tG && src[i3+2] === tB) ? 0 : 0xFF
        })
        else if(depth === 16) processor = stream.iterateChunk.bind(null, i => {
            const qi = i << 2, i6 = i * 6
            buffer[qi] = src[i6]
            buffer[qi+1]=src[i6+2]
            buffer[qi+2]=src[i6+4]
            buffer[qi+3] = (trns && bin.readShort(src, i6) === tR && bin.readShort(src, i6+2) === tG && bin.readShort(src, i6+4) === tB) ? 0 : 0xFF
        })
    }else if(colorType === 3){
        const palette = target.out.palette,
              alpha = target.out.transparency,
              trns = alpha ? alpha.length : 0
        
        if(depth === 8) processor = stream.iterateChunk.bind(null, i => {
            const qi = i << 2,
                  c = src[i],
                  p = 3 * c
            buffer[qi] = palette[p]
            buffer[qi+1] = palette[p+1]
            buffer[qi+2] = palette[p+2]
            buffer[qi+3] = c < trns ? alpha[c] : 0xFF
        })
    }else if(colorType === 4){
        if(depth === 8) processor = stream.iterateChunk.bind(null, i => {
            const qi = i << 2,
                  ii = i << 1,
                  grey = src[ii]
            buffer[qi] = buffer[qi+1] = buffer[qi+2] = grey
            buffer[qi+3]=src[ii+1]
        })
        else if(depth === 16) processor = stream.iterateChunk.bind(null, i => {
            const qi = i << 2,
                  grey = src[qi]
            buffer[qi] = buffer[qi+1] = buffer[qi+2] = grey
            buffer[qi+3]=src[ii+2]
        })
    }else if(colorType === 0){
        const trns = target.out.transparency || -1
        if(depth === 1) processor = stream.iterateChunk.bind(null, i => {
            const grey = 0xFF * ((src[i >> 3] >> (0x07 - ((i & 0x07)))) & 0x01),
                  alpha = grey === trns * 0xFF ? 0 : 0xFF
            uint32View[i] = (alpha << 24) | (grey << 16) | (grey << 8) | grey
        })
        else if(depth === 2) processor = stream.iterateChunk.bind(null, i => {
            const grey = 0x55 * ((src[i >> 2] >> (0x06 - ((i & 0x03) << 1))) & 0x03),
                  alpha = grey === trns * 0x55 ? 0 : 0xFF
            uint32View[i] = (alpha << 24) | (grey << 16) | (grey << 8) | grey
        })
        else if(depth === 4) processor = stream.iterateChunk.bind(null, i => {
            const grey = 0x11 * ((src[i >> 1] >> (0x04 - ((i & 0x01) << 2))) & 0x0F),
                  alpha = grey === trns * 0x11 ? 0 : 0xFF
            uint32View[i] = (alpha << 24) | (grey << 16) | (grey << 8) | grey
        })
        else if(depth === 8) processor = stream.iterateChunk.bind(null, i => {
            const grey = src[i],
                  alpha = grey === trns ? 0 : 0xFF
            uint32View[i] = (alpha << 24) | (grey << 16) | (grey << 8) | grey
        })
        else if(depth === 16) processor = stream.iterateChunk.bind(null, i => {
            const grey = src[i << 1],
                  alpha = bin.readUshort(src, i << 1) === trns ? 0 : 0xFF
            uint32View[i] = (alpha << 24) | (grey << 16) | (grey << 8) | grey
        })
    }
    
    for(let execOffset = 0; execOffset < totalArea; execOffset += chunkMaxSize)
        taskManager.schedule(stream.processChunk.bind(null, processor, Math.min(chunkMaxSize, totalArea - execOffset), execOffset))
    taskManager.schedule(_ => (target.out.data = buffer, resolve(target)))
})


PNGDecoder.decode = (buffer, taskManager) => Signal((resolve, reject) => {
    const data = new Uint8Array(buffer),
          bitmapData = new Uint8Array(data.length),
          out = { data: bitmapData },
          bin = PNGDecoder.binary,
          stream = PNGDecoder.stream,
          readChunkMaxSize = 1024 * 8
    let offset = 8,
        bitmapOffset = 0
	
	const parseChunk = {
		'IHDR': o => {
			out.width = bin.readUint(data, o); o += 4
			out.height = bin.readUint(data, o); o += 4
			out.depth     = data[o++]
			out.colorType = data[o++]
			out.compress  = data[o++]
			out.filter    = data[o++]
			out.interlace = data[o++]
		},
		'IDAT': (o, l) => {
            const processor = stream.copy.bind(null, bitmapData, bitmapOffset, data, o)
            for(let readOffset = 0; readOffset < l; readOffset += readChunkMaxSize)
                taskManager.schedule(stream.processChunk.bind(null, processor, Math.min(readChunkMaxSize, l - readOffset), readOffset))
            bitmapOffset += l
        },
		'pHYs': o => out.pixelDimensions = { x: bin.readUint(data, o), y: bin.readUint(data, o+4), unit: data[o+8] },
		'cHRM': o => out.chromaticies = Array(4).fill().map((_, i) => ({x: bin.readUint(data, o + i*4)/100000.0, y: bin.readUint(data, o + i*4 + 4)/100000.0})),
		'tEXt': (o, l) => {
            //out.text = out.text || Object.create(null)
            //const separator = bin.nextByte(data, o)
            //out.text[bin.readASCII(data, o, separator-o)] = bin.readASCII(data, separator+1, o+l-separator-1)
        },
		'iTXt': (o, l) => {
            //out.iText = out.iText || Object.create(null)
            //let separator = 0, initialOffset = o
            
            //separator = bin.nextByte(data, o)
            //let keyword = bin.readASCII(data, o, separator-o),
            //    cFlag = data[separator+1],
            //    cMethod = data[separator+2]
            //separator = bin.nextByte(data, o = separator+3)
            //let language = bin.readASCII(data, o, separator-o)
            //separator = bin.nextByte(data, o = separator+1)
            //let translated = bin.readUTF8(data, o, separator-o),
            //    text = bin.readUTF8(data, o = separator+1, l-(o-initialOffset))
            
            //out.iText[keyword] = text
        },
		'PLTE': (o, l) => out.palette = bin.readBytes(data, o, l),
		'hIST': o => out.paletteHistogram = Array(Math.floor(out.palette.length/3)).fill().map((_, i) => bin.readUshort(data, o + i*2)),
		'tRNS': (o, l) => out.transparency = 
        (out.colorType === 3 && bin.readBytes(data, o, l)) || 
        (out.colorType === 2 && [bin.readUshort(data, o), bin.readUshort(data, o+2), bin.readUshort(data, o+4)]) || 
        (out.colorType === 0 && bin.readUshort(data, o)) || null,
		'gAMA': o => out.colorGamma = bin.readUint(data, o)/100000.0,
		'sRGB': o => out.rgbColorSpace = data[o],
		'bKGD': o => out.backgrounColor = 
        ((out.colorType === 0 || out.colorType === 4) && [bin.readUshort(data, o)]) || 
        ((out.colorType === 2 || out.colorType === 6) && [bin.readUshort(data, o), bin.readUshort(data, o+2), bin.readUshort(data, o+4)]) || 
        (out.colorType === 3 && data[o]),
		'IEND': _ => {
            if(out.compress !== 0) reject(new Error('Unsupported compression method'))
            if(out.filter !== 0) reject(new Error('Unsupported filter method'))
            return 'END'
        },
        default: (_, length, type) => null
	}
	const read = _ => {
		const length = bin.readUint(data, offset); offset += 4
		const type = bin.readASCII(data, offset, 4);  offset += 4
		const end = (parseChunk[type] || parseChunk.default)(offset, length, type) === 'END'
		offset += length
		const crc = bin.readUint(data, offset);  offset += 4
        !end ? taskManager.schedule(read) : 
        
        resolve({
            taskManager, out,
            get alpha(){ return out.colorType === 4 || out.colorType === 6 },
            get channels(){ return [1,null,3,1,2,null,4][out.colorType] }
        })
	}
    taskManager.schedule(read)
})

PNGDecoder.readInterlace = (target) => Signal((resolve, reject) => {
    const buffer = target.out.data,
          width = target.out.width,
          height = target.out.height,
          pixelByteSize = target.channels * target.out.depth,
          interlace = target.out.interlace,
          stream = PNGDecoder.stream,
          taskManager = target.taskManager,
          chunkMaxSize = 1024 * 8
    
    if(interlace === 0) 
        return PNGDecoder.filterZero(buffer, 0, width, height, pixelByteSize, taskManager)
        .pipe(data => (target.out.data = data, resolve(target)))
    
    const bytesPerPixel = pixelByteSize,
          colorBytesPerPixel = bytesPerPixel >> 3,
          bytesPerLine = Math.ceil(width * bytesPerPixel/8),
          outputBuffer = new Uint8Array(height * bytesPerLine),
          rowBegin = [0, 0, 4, 0, 2, 0, 1],
          colBegin = [0, 4, 0, 2, 0, 1, 0],
          rowStep  = [8, 8, 8, 4, 4, 2, 2],
          colStep  = [8, 8, 4, 4, 2, 2, 1]
    let inputOffset = 0
    
    const writeInterlace = (bytesPerPixel === 1 && ((row, col, ci) => 
                outputBuffer[row * bytesPerLine + (col >> 3)] |= (((buffer[ci >> 3] >> (0x07 - (ci & 0x07))) & 0x01) << (0x07 - ((col & 0x03) << 0)))
        )) || (bytesPerPixel === 2 && ((row, col, ci) => 
                outputBuffer[row * bytesPerLine + (col >> 2)] |= (((buffer[ci >> 3] >> (0x06 - (ci & 0x07))) & 0x03) << (0x06 - ((col & 0x03) << 1)))
        )) || (bytesPerPixel === 4 && ((row, col, ci) => 
                outputBuffer[row * bytesPerLine + (col >> 1)] |= (((buffer[ci >> 3] >> (0x04 - (ci & 0x07))) & 0x0F) << (0x04 - ((col & 0x01) << 2)))
        )) || (bytesPerPixel >= 8 && ((row, col, ci) => {
                const wOffset = row * bytesPerLine + col * colorBytesPerPixel
                for(let i = 0; i < colorBytesPerPixel; outputBuffer[wOffset + i] = buffer[(ci >> 3) + i++]);
        }))
    
    const processInterlace = (write, subWidth, subHeight, rb, cb, rs, cs, bytesPerSubLine, offset, i) => {
        const r = Math.floor(i / subWidth),
              c = i % subWidth,
              row = rb + r * rs,
              col = cb + c * cs,
              ci = ((offset + r * bytesPerSubLine) << 3) + c * bytesPerPixel
        write(row, col, ci)
    }
    
    const interlacePass = pass => {
        const rs = rowStep[pass], cs = colStep[pass],
              rb = rowBegin[pass], cb = colBegin[pass],
              subWidth = Math.ceil((width - cb) / cs),
              subHeight = Math.ceil((height - rb) / rs),
              subArea = subWidth * subHeight,
              bytesPerSubLine = Math.ceil(subWidth * bytesPerPixel / 8),
              processor = stream.iterateChunk.bind(null, processInterlace.bind(null, writeInterlace, subWidth, subHeight, rb, cb, rs, cs, bytesPerSubLine, inputOffset))
        PNGDecoder.decode.filterZero(buffer, inputOffset, subWidth, subHeight, pixelByteSize, taskManager)
        
        for(let execOffset = 0; execOffset < subArea; execOffset += chunkMaxSize)
            taskManager.schedule(stream.processChunk.bind(null, processor, Math.min(chunkMaxSize, subArea - execOffset), execOffset))
        inputOffset += subArea !== 0 ? subHeight * (1 + bytesPerSubLine) : 0
    }
    for(let i = 0; i < 7; taskManager.schedule(interlacePass.bind(null, i++)));
    
    taskManager.schedule(_ => (target.out.data = outputBuffer, resolve(target)))
})

PNGDecoder.filterZero = (buffer, offset, width, height, pixelByteSize, taskManager) => Signal((resolve, reject) => {
    const bytesPerLine = Math.ceil(width * pixelByteSize/8),
          bytesPerPixel = Math.ceil(pixelByteSize/8),
          bytesHalfLine = bytesPerLine - bytesPerPixel,
          chunkMaxSize = 1024 * 8,
          stream = PNGDecoder.stream
    
    const processRow = row => {
        const outputOffset = offset + row*bytesPerLine,
              inputOffset = outputOffset + row + 1,
              type = buffer[inputOffset - 1]
        let exec0 = null, exec1 = null
        
        if(type === 0) exec0 = stream.copy.bind(null, buffer, outputOffset, buffer, inputOffset)
        else if(type === 1){
            exec0 = stream.copy.bind(null, buffer, outputOffset, buffer, inputOffset)
            exec1 = stream.merge.bind(null, buffer, outputOffset + bytesPerPixel, buffer, inputOffset + bytesPerPixel, outputOffset, NaN, 0)
        }else if(row === 0){
            exec0 = stream.copy.bind(null, buffer, outputOffset, buffer, inputOffset)
            if(type === 2) exec1 = stream.copy.bind(null, buffer, outputOffset + bytesPerPixel, buffer, inputOffset + bytesPerPixel)
            else if(type === 3) exec1 = stream.merge.bind(null, buffer, outputOffset + bytesPerPixel, buffer, inputOffset + bytesPerPixel, outputOffset, NaN, 1)
            else if(type === 4) exec1 = stream.paeth.bind(null, buffer, outputOffset + bytesPerPixel, buffer, outputOffset, NaN, NaN)
        }else{
            if(type === 2) exec0 = stream.merge.bind(null, buffer, outputOffset, buffer, inputOffset, outputOffset - bytesPerLine, NaN, 0)
            else if(type === 3){
                exec0 = stream.merge.bind(null, buffer, outputOffset, buffer, inputOffset, outputOffset - bytesPerLine, NaN, 1)
                exec1 = stream.merge.bind(null, buffer, outputOffset + bytesPerPixel, 
                                                     buffer, inputOffset + bytesPerPixel, outputOffset + bytesPerPixel - bytesPerLine, outputOffset, 1)
            }else if(type === 4){
                exec0 = stream.paeth.bind(null, buffer, outputOffset, buffer, inputOffset, NaN, outputOffset - bytesPerLine, NaN)
                exec1 = stream.paeth.bind(null, buffer, outputOffset + bytesPerPixel, 
                                                     buffer, inputOffset + bytesPerPixel, outputOffset, outputOffset + bytesPerPixel - bytesPerLine, outputOffset - bytesPerLine)
            }
        }
        const exec0Length = exec1 ? bytesPerPixel : bytesPerLine,
              exec1Length = exec1 ? bytesHalfLine : 0
        for(let execOffset = 0; execOffset < exec0Length; execOffset += chunkMaxSize)
            taskManager.schedule(stream.processChunk.bind(null, exec0, Math.min(chunkMaxSize, exec0Length - execOffset), execOffset))
        if(exec1)
            for(let execOffset = 0; execOffset < exec1Length; execOffset += chunkMaxSize)
                taskManager.schedule(stream.processChunk.bind(null, exec1, Math.min(chunkMaxSize, exec1Length - execOffset), execOffset))
        if(row === height - 1) taskManager.schedule(_ => resolve(buffer))
    }
    for(let r = 0; r < height; taskManager.schedule(processRow.bind(null, r++)));
})

PNGDecoder.decode.paeth = (a, b, c) => {
    const p = a+b-c, pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c)
    return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
}

PNGDecoder.stream = {
    copy: (output, outputOffset, input, inputOffset, length, offset = 0) => {
        for(let i = offset; i < length; output[outputOffset + i] = input[inputOffset + i++] & 0xFF);
    },
    merge: (output, outputOffset, input, inputOffset1, inputOffset2, inputOffset3, shift, length, offset = 0) => {
        if(!isNaN(inputOffset3))
            for(let i = offset; i < length; output[outputOffset + i] = (input[inputOffset1 + i] + ((input[inputOffset2 + i] + input[inputOffset3 + i++]) >> shift)) & 0xFF);
        else if(shift)
            for(let i = offset; i < length; output[outputOffset + i] = (input[inputOffset1 + i] + (input[inputOffset2 + i++] >> shift)) & 0xFF);
        else
            for(let i = offset; i < length; output[outputOffset + i] = (input[inputOffset1 + i] + input[inputOffset2 + i++]) & 0xFF);
    },
    paeth: (output, outputOffset, input, inputOffset1, paethInOffset1, paethInOffset2, paethInOffset3, length, offset = 0) => {
        const paeth = PNGDecoder.decode.paeth
        if(isNaN(paethInOffset1))
            for(let i = offset; i < length; output[outputOffset + i] = (input[inputOffset1 + i] + paeth(0, input[paethInOffset2 + i++], 0)) & 0xFF);
        else if(isNaN(paethInOffset2))
            for(let i = offset; i < length; output[outputOffset + i] = (input[inputOffset1 + i] + paeth(input[paethInOffset1 + i++], 0, 0)) & 0xFF);
        else
            for(let i = offset; i < length; output[outputOffset + i] = (input[inputOffset1 + i] + paeth(input[paethInOffset1 + i], input[paethInOffset2 + i], input[paethInOffset3 + i++])) & 0xFF);
    },
    processChunk: (processor, length, offset = 0) => processor(offset + length, offset),
    iterateChunk: (processor, length, offset) => { for(let i = offset; i < length; processor(i++)); }
}

PNGDecoder.binary = {
	readUint: (buffer, offset) => (buffer[offset] << 24) | (buffer[offset+1] << 16) | (buffer[offset+2] << 8) | buffer[offset+3],
    readUshort: (buffer, offset) => (buffer[offset] << 8) | buffer[offset+1],
	readASCII: (buffer, offset, length, out = '') => { for(let i = 0; i < length; out += String.fromCharCode(buffer[offset + i++ ])); return out },
    readBytes: (buffer, offset, length, out = []) => { for(let i = 0; i < length; out.push(buffer[offset + i++])); return out },
    nextByte: (buffer, offset, byte = 0) => { while(buffer[offset++] != byte); return offset-1 },
    pad: (n, minLength = 2) => (Array(minLength).fill('0').join('') + n).substr(n.length+minLength - Math.max(n.length, minLength)),
    readUTF8: (buffer, offset, length, out = '') => {
        let str = '';
        for(let i = 0; i < length; str += '%' + PNGDecoder.binary.pad(buffer[offset + i++].toString(16)));
        try{ return window.decodeURIComponent(str) }catch(e){ return PNGDecoder.binary.readASCII(buffer, offset, length) }
    },
    writeUshort: (buffer, offset, value) => {
        buffer[offset] = (value >> 8) & 0xFF
        buffer[offset+1] = value & 0xFF
    },
    writeUint: (buffer, offset, value) => {
        buffer[offset] = (value >> 24) & 0xFF
        buffer[offset+1] = (value >> 16) & 0xFF
        buffer[offset+2] = (value >> 8) & 0xFF
        buffer[offset+3] = value & 0xFF
    },
    writeASCII: (buffer, offset, str) => { for(let i = 0; i < str.length; buffer[offset+i] = str.charCodeAt(i++)); }
}

export {PNGDecoder}
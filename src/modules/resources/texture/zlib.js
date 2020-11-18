const zlib = Object.create(null)

const MAXBITS = 0XF
const ENOUGH_LENS = 852
const ENOUGH_DISTS = 592
const CODES = 0;
const LENS = 1;
const DISTS = 2;

const lbase = [ 
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
]

const lext = [
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
]

const dbase = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
]

const dext = [
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
]

const utf8lenTable = (array => {
    for(let q = 0; q < 256; q++)
        array[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1)
    array[254] = array[254] = 1
    
    return array
})(new Uint8Array(256))

const crcTable = (array => {
    let c = 0
    for(let c, n = 0; n < 256; (array[n] = c, c = ++n))
        for(let k = 0; k < 8; k++)
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
    return array
})([])

const fixedtables = (_ => {
    let lenfix = null, distfix = null
    return state => {
        if(!lenfix || !distfix){
            lenfix = new Int32Array(512)
            distfix = new Int32Array(32)
            let sym = 0
            for(; sym < 144; state.lens[sym++] = 8);
            for(; sym < 256; state.lens[sym++] = 9);
            for(; sym < 280; state.lens[sym++] = 7);
            for(; sym < 288; state.lens[sym++] = 8);
            inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, {bits: 9})
            for(sym = 0; sym < 32; state.lens[sym++] = 5);
            inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, {bits: 5})
        }
        state.lencode = lenfix
        state.lenbits = 9
        state.distcode = distfix
        state.distbiys = 5
    }
})()

const    HEAD = 1
const    FLAGS = 2
const    TIME = 3
const    OS = 4
const    EXLEN = 5
const    EXTRA = 6
const    NAME = 7
const    COMMENT = 8
const    HCRC = 9
const    DICTID = 10
const    DICT = 11
const        TYPE = 12
const        TYPEDO = 13
const        STORED = 14
const        COPY_ = 15
const        COPY = 16
const        TABLE = 17
const        LENLENS = 18
const        CODELENS = 19
const            LEN_ = 20
const            LEN = 21
const            LENEXT = 22
const            DIST = 23
const            DISTEXT = 24
const            MATCH = 25
const            LIT = 26
const    CHECK = 27
const    LENGTH = 28
const    DONE = 29
const    BAD = 30
const    MEM = 31
const    SYNC = 32

const Z_NO_FLUSH = 0
const Z_PARTIAL_FLUSH = 1
const Z_SYNC_FLUSH = 2
const Z_FULL_FLUSH = 3
const Z_FINISH = 4
const Z_BLOCK = 5
const Z_TREES = 6
const Z_OK = 0
const Z_STREAM_END = 1
const Z_NEED_DICT = 2
const Z_ERRNO = -1
const Z_STREAM_ERROR = -2
const Z_DATA_ERROR = -3
const Z_MEM_ERROR = -4
const Z_BUF_ERROR = -5
const Z_NO_COMPRESSION = 0
const Z_BEST_SPEED = 1
const Z_BEST_COMPRESSION = 9
const Z_DEFAULT_COMPRESSION = -1
const Z_FILTERED = 1
const Z_HUFFMAN_ONLY = 2
const Z_RLE = 3
const Z_FIXED = 4
const Z_DEFAULT_STRATEGY = 0
const Z_BINARY = 0
const Z_TEXT = 1
const Z_UNKNOWN = 2
const Z_DEFLATED = 8

zlib.flattenChunks = chunks => {
    let idx = chunks.length,
        bufferLength = 0,
        offset = 0
    while(idx--) bufferLength += chunks[idx].length
    const buffer = new Uint8Array(bufferLength)
    for(let i = 0; i < chunks.length; i++){
        let chunk = chunks[i]
        buffer.set(chunk, offset)
        offset += chunk.length
    }
    return buffer
}
zlib.stringToBuffer = string => {
    let idx = string.length
    const buffer = new Uint8Array(idx)
    while(idx--) buffer[idx] = string.charCodeAt(idx)
    return buffer
}
zlib.arraySet = (output, src, src_offset, length, output_offset) => {
    if(src.subarray && output.subarray) return output.set(src.subarray(src_offset, src_offset + length), output_offset)
    for(let i = 0; i < length; output[output_offset + i] = src[input_offset + i++]);
    return output
}
zlib.adler32 = (adler, buffer, length, offset) => {
    let s1 = (adler & 0xFFFF) | 0,
        s2 = ((adler >>> 16) & 0xFFFF) | 0,
        n = 0
    while(length !== 0){
        n = length > 2000 ? 2000 : length
        length -= n
        do{
            s1 = (s1 + buffer[offset++]) | 0
            s2 = (s2 + s1) | 0
        }while(--n)
        s1 %= 0xFFF1
        s2 %= 0xFFF1
    }
    return (s1 | (s2 << 16)) | 0
}
zlib.crc32 = (crc, buffer, length, offset) => {
    const t = crcTable,
          end = offset + length
    crc ^= -1
    for(let i = offset; i < end; i++)
        crc = (crc >>> 8) ^ t[(crc ^ buffer[i]) & 0xFF]
    return (crc ^ (-1))
}
zlib.shrinkBuffer = (buffer, size) => {
    if(buffer.length === size) return buffer
    if(buffer.subarray) return buffer.subarray(0, size)
    return (buffer.length = size, buffer)
}
zlib.utf8border = (buffer, max) => {
    max = Math.min(max || buffer.length, buffer.length)
    let offset = max - 1
    while(offset >= 0 && (buffer[offset--] & 0xC0) === 0x80);
    if(offset <= 0) return max
    return (offset + utf8lenTable[buffer[offset]] > max) ? offset : max
}
zlib.zswap32 = q => (((q >>> 24) & 0xff) + ((q >>> 8) & 0xff00) + ((q & 0xff00) << 8) + ((q & 0xff) << 24))


const Inflator = function(options){
    const target = Object.create(null)
    options = Object.assign({
        chunkSize: 0x4000,
        windowBits: 0,
        to: ''
    }, options || {})
    
    if(options.raw && options.windowBits >= 0 && options.windowBits < 0x10)
        options.windowBits = options.windowBits ? -options.windowBits : -0x0F
    else if(!options.windowBits) options.windowBits += 0x20
    if(options.windowBits > 0x0F && options.windowBits < 0x30 && options.windowBits & 0x0F === 0)
        options.windowBits |= 0x0F
    
    const stream = ZStream(),
          state = InflateState(),
          header = GZHeader(),
          chunks = []
    
    stream.state = state
    state.head = header
    state.wrap = options.windowBits < 0 ? 0 : (options.windowBits >> 4) + 1
    state.wbits = options.windowBits < 0 ? -options.windowBits : options.windowBits < 0x30 ? options.windowBits & 0x0F : options.windowBits
    
    if(state.wbits && (state.wbits < 8 || state.wbits > 15)) throw new Error('Invalid stream window bit size')
    if(state.wrap & 0x02 === 0) throw new Error('Invalid wrap mode')
    
    stream.adler = state.wrap ? state.wrap & 0x01 : 0
    state.mode = HEAD
    state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS)
    state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS)
    
    return Object.assign(target, {
        options, chunks, header, stream,
        onComplete: _ => null,
        onError: _ => null,
        done: false,
        onData: chunk => chunks.push(chunk),
        onEnd: (status, done = false) => {
            target.done = done
            if(status === Z_OK) target.onComplete(target.result = zlib.flattenChunks(chunks))
            else target.onError(status, stream.msg)
            chunks.length = 0
        },
        consume: Inflator.consume.bind(target, target)
    })
}

Inflator.consume = function (target, data, mode) {
    const stream = target.stream,
          chunkSize = target.options.chunkSize,
          dictionary = target.options.dictionary
    let status, next_out_utf8, tail, utf8str, allowBufError = false
    
    if(target.done) return false
    mode = (mode === ~~mode) ? mode : (mode ? Z_FINISH : Z_NO_FLUSH)
    
    stream.input = (typeof data === 'string' && zlib.stringToBuffer(data)) || (toString.call(data) === '[object ArrayBuffer]' && new Uint8Array(data)) || data
    stream.next_in = 0
    stream.avail_in = stream.input.length
    
    do{
        if(!stream.avail_out){
            stream.output = new Uint8Array(chunkSize)
            stream.next_out = 0
            stream.avail_out = chunkSize
        }
        
        status = zlib.inflate(stream, Z_NO_FLUSH)
        if(status === Z_NEED_DICT && dictionary) console.warn('inflate from dictionary not implemented')
        if(status === Z_BUF_ERROR && allowBufError) status = (allowBufError = false, Z_OK)  
        if(status !== Z_STREAM_END && status !== Z_OK) return (target.onEnd(status, true), false)
        
        if(stream.next_out && (!stream.avail_out || status === Z_STREAM_END || (!stream.avail_in && (mode === Z_FINISH || mode === Z_SYNC_FLUSH))))
            target.onData(zlib.shrinkBuffer(stream.output, stream.next_out))
        if(!stream.avail_in && !stream.avail_out)
            allowBufError = true
    }while((stream.avail_in > 0 || !stream.avail_out) && status !== Z_STREAM_END);
    
    if(mode === Z_FINISH || status === Z_STREAM_END){
        stream.state = null
        return (target.onEnd(Z_OK, true), true)
    }else if(mode === Z_SYNC_FLUSH){
        target.onEnd(Z_OK)
        stream.avail_out = 0
    }
    return true
}

const ZStream = _ => ({
    input: null,
    next_in: 0,
    avail_in: 0,
    total_in: 0,
    output: null,
    next_out: 0,
    avail_out: 0,
    total_out: 0,
    msg: '',
    state: null,
    data_type: 2,
    adler: 0
})
const GZHeader = _ => ({
    text: 0,
    time: 0,
    xflags: 0,
    os: 0,
    extra: null,
    extra_len: 0,
    name: '',
    comment: '',
    hcrc: 0,
    done: false
})
const InflateState = _ => ({
    mode: 0,
    last: 0,
    wrap: 0,
    havedict: 0,
    flags: 0,
    dmax: 32768,
    check: 0,
    total: 0,
    head: null,
    wbits: 0,
    wsize: 0,
    whave: 0,
    wnext: 0,
    window: null,
    hold: 0,
    bits: 0,
    length: 0,
    offset: 0,
    extra: 0,
    lencode: null,
    distcode: null,
    lenbits: 0,
    distbits: 0,
    ncode: 0,
    nlen: 0,
    ndist: 0,
    have: 0,
    next: null,
    lens: new Uint16Array(320),
    work: new Uint16Array(288),
    lendyn: null,
    distdyn: null,
    sane: 1,
    back: -1,
    was: 0
})

zlib.inflate = (stream, flush) => {
    let state = stream.state,
        input = stream.input,
        output = stream.output,
        put = stream.next_out,
        left = stream.avail_out,
        next = stream.next_in,
        have = stream.avail_in,
        hold = state.hold,
        bits = state.bits,
        order = [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ],
        hbuf = new Uint8Array(4),
        here = 0,
        _in = have,
        _out = left,
        ret = Z_OK,
        copy, from, from_source, here_bits, here_op, here_val, last_bits, last_op, last_val, len, opts, n;
    
    if(!stream || !stream.state || !stream.output || (!stream.input && stream.avail_in !== 0)) return Z_STREAM_ERROR
    if(state.mode === TYPE) state.mode = TYPEDO
    
    inf_leave: while(1){
        switch(state.mode) {
            case HEAD: if(!state.wrap){ state.mode = TYPEDO; break }
                while(bits < 16){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                if((state.wrap & 2) && hold === 0x8b1f){
                    state.check = 0
                    hbuf[0] = hold & 0xff
                    hbuf[1] = (hold >>> 8) & 0xff
                    state.check = zlib.crc32(state.check, hbuf, 2, 0)
                    hold = 0
                    bits = 0
                    state.mode = FLAGS
                    break
                }
                state.flags = 0
                if(state.head) state.head.done = false
                if(!(state.wrap & 1) || (((hold & 0xff) << 8) + (hold >> 8)) % 31){ stream.msg = 'incorrect header check'; state.mode = BAD; break }
                if((hold & 0x0f) !== Z_DEFLATED){ stream.msg = 'unknown compression method'; state.mode = BAD; break }
                hold >>>= 4
                bits -= 4
                len = (hold & 0x0f) + 8
                if(state.wbits === 0) state.wbits = len
                else if(len > state.wbits){ stream.msg = 'invalid window size'; state.mode = BAD; break }
                state.dmax = 1 << len
                stream.adler = state.check = 1
                state.mode = hold & 0x200 ? DICTID : TYPE
                hold = 0
                bits = 0
                break
            case FLAGS:
                while (bits < 16){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                state.flags = hold
                if((state.flags & 0xff) !== Z_DEFLATED){ stream.msg = 'unknown compression method'; state.mode = BAD; break }
                if(state.flags & 0xe000){ stream.msg = 'unknown header flags set'; state.mode = BAD; break }
                if(state.head) state.head.text = ((hold >> 8) & 1)
                if(state.flags & 0x0200){
                    hbuf[0] = hold & 0xff
                    hbuf[1] = (hold >>> 8) & 0xff
                    state.check = zlib.crc32(state.check, hbuf, 2, 0)
                }
                hold = 0
                bits = 0
                state.mode = TIME
            case TIME:
                while(bits < 32){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                if(state.head) state.head.time = hold
                if(state.flags & 0x0200){
                    hbuf[0] = hold & 0xff
                    hbuf[1] = (hold >>> 8) & 0xff
                    hbuf[2] = (hold >>> 16) & 0xff
                    hbuf[3] = (hold >>> 24) & 0xff
                    state.check = zlib.crc32(state.check, hbuf, 4, 0)
                }
                hold = 0
                bits = 0
                state.mode = OS
            case OS:
                while(bits < 16){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                if(state.head){
                    state.head.xflags = (hold & 0xff)
                    state.head.os = (hold >> 8)
                }
                if(state.flags & 0x0200){
                    hbuf[0] = hold & 0xff
                    hbuf[1] = (hold >>> 8) & 0xff
                    state.check = crc32(state.check, hbuf, 2, 0)
                }
                hold = 0
                bits = 0
                state.mode = EXLEN
            case EXLEN:
                if(state.flags & 0x0400){
                    while(bits < 16){
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    state.length = hold
                    if(state.head) state.head.extra_len = hold
                    if(state.flags & 0x0200){
                        hbuf[0] = hold & 0xff
                        hbuf[1] = (hold >>> 8) & 0xff
                        state.check = zlib.crc32(state.check, hbuf, 2, 0)
                    }
                    hold = 0
                    bits = 0
                }else if(state.head) state.head.extra = null
                state.mode = EXTRA
            case EXTRA:
                if(state.flags & 0x0400){
                    copy = state.length
                    if(copy > have) copy = have
                    if(copy){
                        if(state.head){
                            len = state.head.extra_len - state.length
                            if(!state.head.extra) state.head.extra = new Array(state.head.extra_len)
                            zlib.arraySet(state.head.extra, input, next, copy, len)
                        }
                        if(state.flags & 0x0200) state.check = zlib.crc32(state.check, input, copy, next)
                        have -= copy
                        next += copy
                        state.length -= copy
                    }
                    if(state.length) break inf_leave
                }
                state.length = 0
                state.mode = NAME
            case NAME:
                if(state.flags & 0x0800){
                    if(have === 0) break inf_leave
                    copy = 0
                    do{
                        len = input[next + copy++];
                        if(state.head && len && (state.length < 65536 )) state.head.name += String.fromCharCode(len)
                    }while(len && copy < have);
                    if(state.flags & 0x0200) state.check = zlib.crc32(state.check, input, copy, next)
                    have -= copy
                    next += copy
                    if(len) break inf_leave
                }else if(state.head) state.head.name = null
                state.length = 0
                state.mode = COMMENT
            case COMMENT:
                if(state.flags & 0x1000){
                    if(have === 0) break inf_leave
                    copy = 0
                    do{
                        len = input[next + copy++]
                        if(state.head && len && (state.length < 65536)) state.head.comment += String.fromCharCode(len)
                    }while(len && copy < have);
                    if(state.flags & 0x0200) state.check = zlib.crc32(state.check, input, copy, next)
                    have -= copy
                    next += copy
                    if(len) break inf_leave
                }else if(state.head) state.head.comment = null
                state.mode = HCRC
            case HCRC:
                if(state.flags & 0x0200){
                    while(bits < 16){
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    if(hold !== (state.check & 0xffff)){ stream.msg = 'header crc mismatch'; state.mode = BAD; break }
                    hold = 0
                    bits = 0
                }
                if(state.head){
                    state.head.hcrc = ((state.flags >> 9) & 1)
                    state.head.done = true
                }
                stream.adler = state.check = 0
                state.mode = TYPE
                break
            case DICTID:
                while(bits < 32){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                stream.adler = state.check = zlib.zswap32(hold)
                hold = 0
                bits = 0
                state.mode = DICT
            case DICT:
                if(state.havedict === 0){
                    stream.next_out = put
                    stream.avail_out = left
                    stream.next_in = next
                    stream.avail_in = have
                    state.hold = hold
                    state.bits = bits
                    return Z_NEED_DICT
                }
                stream.adler = state.check = 1
                state.mode = TYPE
            case TYPE: if(flush === Z_BLOCK || flush === Z_TREES) break inf_leave
            case TYPEDO:
                if(state.last){
                    hold >>>= bits & 7
                    bits -= bits & 7
                    state.mode = CHECK
                    break
                }
                while(bits < 3){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                state.last = (hold & 0x01)
                hold >>>= 1
                bits -= 1
                switch ((hold & 0x03)){
                    case 0: state.mode = STORED; break
                    case 1: fixedtables(state)
                        state.mode = LEN_
                        if(flush === Z_TREES){
                            hold >>>= 2
                            bits -= 2
                            break inf_leave
                        }
                        break
                    case 2: state.mode = TABLE; break
                    case 3: stream.msg = 'invalid block type'; state.mode = BAD
                }
                hold >>>= 2
                bits -= 2
                break
            case STORED:
                hold >>>= bits & 7
                bits -= bits & 7
                while(bits < 32){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                if((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)){ stream.msg = 'invalid stored block lengths'; state.mode = BAD; break }
                state.length = hold & 0xffff
                hold = 0
                bits = 0
                state.mode = COPY_
                if(flush === Z_TREES) break inf_leave
            case COPY_: state.mode = COPY
            case COPY:
                copy = state.length
                if(copy){
                    if(copy > have) copy = have
                    if(copy > left) copy = left
                    if(copy === 0) break inf_leave
                    zlib.arraySet(output, input, next, copy, put)
                    have -= copy
                    next += copy
                    left -= copy
                    put += copy
                    state.length -= copy
                    break
                }
                state.mode = TYPE
                break
            case TABLE:
                while(bits < 14){
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                state.nlen = (hold & 0x1f) + 257
                hold >>>= 5
                bits -= 5
                state.ndist = (hold & 0x1f) + 1
                hold >>>= 5
                bits -= 5
                state.ncode = (hold & 0x0f) + 4
                hold >>>= 4
                bits -= 4
                if(state.nlen > 286 || state.ndist > 30){ stream.msg = 'too many length or distance symbols'; state.mode = BAD; break }
                state.have = 0
                state.mode = LENLENS
            case LENLENS:
                while(state.have < state.ncode){
                    while(bits < 3){
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    state.lens[order[state.have++]] = (hold & 0x07)
                    hold >>>= 3
                    bits -= 3
                }
                while(state.have < 19) state.lens[order[state.have++]] = 0
                state.lencode = state.lendyn
                state.lenbits = 7
                opts = { bits: state.lenbits }
                ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts)
                state.lenbits = opts.bits
                if(ret){ stream.msg = 'invalid code lengths set'; state.mode = BAD; break }
                state.have = 0
                state.mode = CODELENS
            case CODELENS:
                while(state.have < state.nlen + state.ndist){
                    while(1){
                        here = state.lencode[hold & ((1 << state.lenbits) - 1)]
                        here_bits = here >>> 24
                        here_op = (here >>> 16) & 0xff
                        here_val = here & 0xffff
                        if((here_bits) <= bits) break
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    if(here_val < 16){
                        hold >>>= here_bits
                        bits -= here_bits
                        state.lens[state.have++] = here_val
                    }else{
                        if(here_val === 16){
                            n = here_bits + 2
                            while(bits < n){
                                if(have === 0) break inf_leave
                                have--
                                hold += input[next++] << bits
                                bits += 8
                            }
                            hold >>>= here_bits
                            bits -= here_bits
                            if(state.have === 0){ stream.msg = 'invalid bit length repeat'; state.mode = BAD; break }
                            len = state.lens[state.have - 1]
                            copy = 3 + (hold & 0x03)
                            hold >>>= 2
                            bits -= 2
                        }else if(here_val === 17){
                            n = here_bits + 3
                            while(bits < n){
                                if(have === 0) break inf_leave
                                have--
                                hold += input[next++] << bits
                                bits += 8
                            }
                            hold >>>= here_bits
                            bits -= here_bits
                            len = 0
                            copy = 3 + (hold & 0x07)
                            hold >>>= 3
                            bits -= 3
                        }else{
                            n = here_bits + 7
                            while(bits < n){
                                if(have === 0) break inf_leave
                                have--
                                hold += input[next++] << bits
                                bits += 8
                            }
                            hold >>>= here_bits
                            bits -= here_bits
                            len = 0
                            copy = 11 + (hold & 0x7f)
                            hold >>>= 7
                            bits -= 7
                        }
                        if(state.have + copy > state.nlen + state.ndist){ stream.msg = 'invalid bit length repeat'; state.mode = BAD; break }
                        while(copy--) state.lens[state.have++] = len
                    }
                }
                if(state.mode === BAD) break
                if(state.lens[256] === 0){ stream.msg = 'invalid code -- missing end-of-block'; state.mode = BAD; break }
                state.lenbits = 9
                opts = { bits: state.lenbits }
                ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts)
                state.lenbits = opts.bits
                if(ret){ stream.msg = 'invalid literal/lengths set'; state.mode = BAD; break }
                state.distbits = 6
                state.distcode = state.distdyn
                opts = { bits: state.distbits }
                ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts)
                state.distbits = opts.bits
                if(ret){ stream.msg = 'invalid distances set'; state.mode = BAD; break }
                state.mode = LEN_
                if(flush === Z_TREES) break inf_leave
            case LEN_: state.mode = LEN
            case LEN:
                if(have >= 6 && left >= 258){
                    stream.next_out = put
                    stream.avail_out = left
                    stream.next_in = next
                    stream.avail_in = have
                    state.hold = hold
                    state.bits = bits
                    
                    inflate_fast(stream, _out)
                    
                    put = stream.next_out
                    output = stream.output
                    left = stream.avail_out
                    next = stream.next_in
                    input = stream.input
                    have = stream.avail_in
                    hold = state.hold
                    bits = state.bits

                    if(state.mode === TYPE) state.back = -1
                    break
                }
                state.back = 0
                while(1){
                    here = state.lencode[hold & ((1 << state.lenbits) - 1)]
                    here_bits = here >>> 24
                    here_op = (here >>> 16) & 0xFF
                    here_val = here & 0xFFFF
                    if(here_bits <= bits) break
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                if(here_op && (here_op & 0xf0) === 0){
                    last_bits = here_bits
                    last_op = here_op
                    last_val = here_val
                    while(1){
                        here = state.lencode[last_val + ((hold & ((1 << (last_bits + last_op)) - 1)) >> last_bits)]
                        here_bits = here >>> 24
                        here_op = (here >>> 16) & 0xFF
                        here_val = here & 0xFFFF
                        if((last_bits + here_bits) <= bits) break
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    hold >>>= last_bits
                    bits -= last_bits
                    state.back += last_bits
                }
                hold >>>= here_bits
                bits -= here_bits
                state.back += here_bits
                state.length = here_val
                if(here_op === 0){ state.mode = LIT; break }
                if(here_op & 32){ state.back = -1; state.mode = TYPE; break }
                if(here_op & 64){ stream.msg = 'invalid literal/length code'; state.mode = BAD; break }
                state.extra = here_op & 15
                state.mode = LENEXT
            case LENEXT:
                if(state.extra){
                    n = state.extra
                    while(bits < n){
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    state.length += hold & ((1 << state.extra) - 1)
                    hold >>>= state.extra
                    bits -= state.extra
                    state.back += state.extra
                }
                state.was = state.length
                state.mode = DIST
            case DIST:
                while(1){
                    here = state.distcode[hold & ((1 << state.distbits) - 1)]
                    here_bits = here >>> 24
                    here_op = (here >>> 16) & 0xff
                    here_val = here & 0xffff
                    if((here_bits) <= bits) break
                    if(have === 0) break inf_leave
                    have--
                    hold += input[next++] << bits
                    bits += 8
                }
                if((here_op & 0xf0) === 0){
                    last_bits = here_bits
                    last_op = here_op
                    last_val = here_val
                    while(1){
                        here = state.distcode[last_val + ((hold & ((1 << (last_bits + last_op)) - 1)) >> last_bits)]
                        here_bits = here >>> 24
                        here_op = (here >>> 16) & 0xff
                        here_val = here & 0xffff
                        if((last_bits + here_bits) <= bits) break
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    hold >>>= last_bits
                    bits -= last_bits
                    state.back += last_bits
                }
                hold >>>= here_bits
                bits -= here_bits
                state.back += here_bits
                if(here_op & 64){ stream.msg = 'invalid distance code'; state.mode = BAD; break }
                state.offset = here_val
                state.extra = (here_op) & 15
                state.mode = DISTEXT
            case DISTEXT:
                if(state.extra){
                    n = state.extra;
                    while(bits < n){
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    state.offset += hold & ((1 << state.extra) - 1)
                    hold >>>= state.extra
                    bits -= state.extra
                    state.back += state.extra
                }
                if(state.offset > state.dmax){ stream.msg = 'invalid distance too far back'; state.mode = BAD; break }
                state.mode = MATCH
            case MATCH:
                if(left === 0) break inf_leave
                copy = _out - left
                if(state.offset > copy){
                    copy = state.offset - copy
                    if(copy > state.whave && state.sane){ stream.msg = 'invalid distance too far back'; state.mode = BAD; break }
                    if(copy > state.wnext){
                        copy -= state.wnext
                        from = state.wsize - copy
                    }else from = state.wnext - copy
                    if(copy > state.length) copy = state.length
                    from_source = state.window
                }else{
                    from_source = output
                    from = put - state.offset
                    copy = state.length
                }
                if(copy > left) copy = left
                left -= copy
                state.length -= copy
                do{ output[put++] = from_source[from++] }while(--copy);
                if(state.length === 0) state.mode = LEN
                break
            case LIT:
                if(left === 0) break inf_leave
                output[put++] = state.length
                left--
                state.mode = LEN
                break
            case CHECK:
                if(state.wrap){
                    while(bits < 32){
                        if(have === 0) break inf_leave
                        have--
                        hold |= input[next++] << bits
                        bits += 8
                    }
                    _out -= left
                    stream.total_out += _out
                    state.total += _out
                    if(_out) stream.adler = state.check = (state.flags ? zlib.crc32(state.check, output, _out, put - _out) : zlib.adler32(state.check, output, _out, put - _out))
                    _out = left
                    if((state.flags ? hold : zlib.zswap32(hold)) !== state.check){ stream.msg = 'incorrect data check'; state.mode = BAD; break }
                    hold = 0
                    bits = 0
                }
                state.mode = LENGTH
            case LENGTH:
                if(state.wrap && state.flags){
                    while (bits < 32){
                        if(have === 0) break inf_leave
                        have--
                        hold += input[next++] << bits
                        bits += 8
                    }
                    if(hold !== (state.total & 0xffffffff)){ stream.msg = 'incorrect length check'; state.mode = BAD; break }
                    hold = 0
                    bits = 0
                }
                state.mode = DONE
            case DONE: ret = Z_STREAM_END; break inf_leave
            case BAD: ret = Z_DATA_ERROR; break inf_leave
            case MEM: return Z_MEM_ERROR
            case SYNC:
            default: return Z_STREAM_ERROR
        }
    }

    stream.next_out = put
    stream.avail_out = left
    stream.next_in = next
    stream.avail_in = have
    state.hold = hold
    state.bits = bits
    if(state.wsize || (_out !== stream.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)))
    if(updatewindow(stream, stream.output, stream.next_out, _out - stream.avail_out)) return (state.mode = MEM, Z_MEM_ERROR)
    _in -= stream.avail_in
    _out -= stream.avail_out
    stream.total_in += _in
    stream.total_out += _out
    state.total += _out
    if(state.wrap && _out){
    stream.adler = state.check = (state.flags ? zlib.crc32(state.check, output, _out, stream.next_out - _out) : zlib.adler32(state.check, output, _out, stream.next_out - _out))
    }
    stream.data_type = state.bits + (state.last ? 64 : 0) +
        (state.mode === TYPE ? 128 : 0) +
        (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0)
    if(((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) return Z_BUF_ERROR
    return ret
}




const inflate_table = (type, lens, lens_index, codes, table, table_index, work, options) => {
    let bits = options.bits,
        len = 0,
        sym = 0,
        min = 0, max = 0,
        curr = 0,
        drop = 0,
        left = 1,
        used = 0,
        huff = 0,
        incr, fill, low, mask, next,
        base = null,
        base_index = 0,
        end,
        count = new Uint16Array(MAXBITS + 1),
        offs = new Uint16Array(MAXBITS + 1),
        extra = null,
        extra_index = 0,
        here_bits, here_op, here_val;
    
    for(len = 0; len <= MAXBITS; count[len++] = 0);
    for(sym = 0; sym < codes; count[lens[lens_index + sym++]]++);
    for(max = MAXBITS; max >= 0; max--) if(count[max] !== 0) break;
    if(max === 0){
        table[table_index++] = (1 << 24) | (64 << 16) | 0
        table[table_index++] = (1 << 24) | (64 << 16) | 0
        options.bits = 1
        return 0
    }
    for(min = 1; min < max; min++) if(count[min] !== 0) break;
    let root = Math.max(Math.min(bits, max), min)
    for(len = 1; len <= MAXBITS; len++) if((left = (left << 1) - count[len]) < 0) return -1
    if(left > 0 && (type === CODES || max !== 1)) return -1
    offs[1] = 0
    for(len = 1; len < MAXBITS; offs[len + 1] = offs[len] + count[len++]);
    for(sym = 0; sym < codes; sym++) if(lens[lens_index + sym] !== 0) work[offs[lens[lens_index + sym]]++] = sym
    if(type === CODES){
        base = extra = work
        end = 19
    }else if(type === LENS){
        base = lbase
        base_index -= 257
        extra = lext
        extra_index -=257
        end = 256
    }else{
        base = dbase
        extra = dext
        end = -1
    }
    sym = 0
    len = min
    next = table_index
    curr = root
    low = -1
    used = 1 << root
    mask = used -1
    if((type === LENS && used > ENOUGH_LENS) || (type === DISTS && used > ENOUGH_DISTS)) return 1
    
    while(1){
        here_bits = len - drop
        if(work[sym] < end){
            here_op = 0
            here_val = work[sym]
        }else if(work[sym] > end){
            here_op = extra[extra_index + work[sym]]
            here_val = base[base_index + work[sym]]
        }else{
            here_op = 32 + 64
            here_val = 0
        }
        incr = 1 << (len - drop)
        fill = 1 << curr
        min = fill
        do{
            fill -=incr
            table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val | 0
        }while(fill);
        
        incr = 1 << (len - 1)
        while(huff & incr) incr >>= 1
        huff = incr !== 0 ? (huff & (incr - 1)) + incr : 0
        sym++
        if(--count[len] === 0){
            if(len === max) break;
            len = lens[lens_index + work[sym]]
        }
        if(len > root && (huff & mask) !== low){
            drop = drop || root
            next += min
            curr = len - drop
            left = 1 << curr
            while(curr + drop < max){
                left -= count[curr + drop]
                if(left <= 0) break;
                curr++
                left <<= 1
            }
            used += 1 << curr
            if((type === LENS && used > ENOUGH_LENS) || (type === DISTS && used > ENOUGH_DISTS)) return 1
            low = huff & mask
            table[low] = (root << 24) | (curr << 16) | (next - table_index) | 0
        }
    }
    if(huff)
        table[next + huff] = ((len - drop) << 24) | (64 << 16) | 0
    options.bits = root
    return 0
}















const inflate_fast = (stream, start) => {
    let state = stream.state,
        _in = stream.next_in,
        input = stream.input,
        last = _in + (stream.avail_in - 5),
        _out = stream.next_out,
        output = stream.output,
        beg = _out - (start - stream.avail_out),
        end = _out + (stream.avail_out - 257),
        dmax = state.dmax,
        wsize = state.wsize,
        whave = state.whave,
        wnext = state.wnext,
        s_window = state.window,
        hold = state.hold,
        bits = state.bits,
        lcode = state.lencode,
        dcode = state.distcode,
        lmask = (1 << state.lenbits) - 1,
        dmask = (1 << state.distbits) - 1,
        here, op, len, dist, from, from_source;
    top: do{
        if(bits < 15){
            hold += input[_in++] << bits; bits += 8
            hold += input[_in++] << bits; bits += 8
        }
        here = lcode[hold & lmask]
        dolen: while(1){
            op = here >>> 24; hold >>>= op; bits -= op;
            op = (here >>> 16) & 0xFF
            if(op === 0) output[_out++] = here & 0xFFFF
            else if(op & 16){
                len = here & 0xFFFF
                op &= 15
                if(op){
                    if(bits < op){ hold += input[_in++] << bits; bits += 8 }
                    len += hold & ((1 << op) - 1); hold >>>= op; bits -= op
                }
                if(bits < 15){
                    hold += input[_in++] << bits; bits += 8
                    hold += input[_in++] << bits; bits += 8
                }
                here = dcode[hold & dmask]
                dodist: while(1){
                    op = here >>> 24; hold >>>= op; bits -= op
                    op = (here >>> 16) & 0xFF
                    if(op & 16){
                        dist = here & 0xFFFF
                        op &= 15
                        if(bits < op){
                            hold += input[_in++] << bits; bits += 8
                            if(bits < op){ hold += input[_in++] << bits; bits += 8 }
                        }
                        dist += hold & ((1 << op) - 1)
                        if(dist > dmax){
                            stream.msg = 'invalid distance too far back'
                            state.mode = BAD
                            break top
                        }
                        hold >>>= op; bits -= op
                        op = _out - beg
                        if(dist > op){
                            op = dist - op
                            if(op > whave && state.sane){
                                stream.msg = 'invalid distance too far back'
                                state.mode = BAD
                                break top
                            }
                            from = 0
                            from_source = s_window
                            if(wnext === 0){
                                from += wsize - op
                                if(op < len){
                                    len -= op
                                    do{ output[_out++] = s_window[from++] }while(--op);
                                    from = _out - dist
                                    from_source = output
                                }
                            }else if(wnext < op){
                                from += wsize + wnext - op
                                op -= wnext
                                if(op < len){
                                    len -= op
                                    do{ output[_out++] = s_window[from++] }while(--op);
                                    from = 0
                                    if(wnext < len){
                                        op = wnext
                                        len -= op
                                        do{ output[_out++] = s_window[from++] }while(--op);
                                        from = _out - dist
                                        from_source = output
                                    }
                                }
                            }else{
                                from += wnext - op
                                if(op < len){
                                    len -= op
                                    do{ output[_out++] = s_window[from++] }while(--op);
                                    from = _out - dist
                                    from_source = output
                                }
                            }
                            while(len > 2){
                                output[_out++] = from_source[from++]
                                output[_out++] = from_source[from++]
                                output[_out++] = from_source[from++]
                                len -= 3
                            }
                            if(len){
                                output[_out++] = from_source[from++]
                                if(len > 1) output[_out++] = from_source[from++]
                            }
                        }else{
                            from = _out - dist
                            do{
                                output[_out++] = output[from++]
                                output[_out++] = output[from++]
                                output[_out++] = output[from++]
                                len -= 3
                            }while(len > 2);
                            if(len){
                                output[_out++] = output[from++]
                                if(len > 1) output[_out++] = output[from++]
                            }
                        }
                    }else if((op & 64) === 0){
                        here = dcode[(here & 0xffff) + (hold & ((1 << op) - 1))]
                        continue dodist
                    }else{
                        stream.msg = 'invalid distance code'
                        state.mode = BAD
                        break top
                    }
                    break;
                }
            }else if((op & 64) === 0){
                here = lcode[(here & 0xffff) + (hold & ((1 << op) - 1))]
                continue dolen
            }else if(op & 32){
                state.mode = TYPE
                break top
            }else{
                stream.msg = 'invalid literal/length code'
                state.mode = BAD
                break top
            }
            break;
        }
    }while(_in < last && _out < end);
    len = bits >> 3
    _in -= len
    bits -= len << 3
    hold &= (1 << bits) - 1
    
    stream.next_in = _in
    stream.next_out = _out
    stream.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last))
    stream.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end))
    state.hold = hold
    state.bits = bits
}


const updatewindow = (stream, src, end, copy) => {
    const state = stream.state
    if(state.window === null){
        state.wsize = 1 << state.wbits
        state.wnext = 0
        state.whave = 0
        state.window = new Uint8Array(state.wsize)
    }
    if(copy >= state.wsize){
        zlib.arraySet(state.window, src, end - state.wsize, state.wsize, 0)
        state.wnext = 0
        state.whave = state.wsize
    }else{
        let dist = state.wsize - state.wnext
        if(dist > copy) dist = copy
        zlib.arraySet(state.window, src, end - copy, dist, state.wnext)
        copy -= dist
        if(copy){
            zlib.arraySet(state.window, src, end - copy, copy, 0)
            state.wnext = copy
            state.whave = state.wsize
        }else{
            state.wnext += dist
            if(state.wnext === state.wsize) state.wnext = 0
            if(state.whave < state.wsize) state.whave += dist
        }
    }
    return 0
}

zlib.Inflator = Inflator

export {zlib}
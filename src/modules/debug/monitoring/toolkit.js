import {tie} from '../../util'

const defaultColors = ['#FFF', '#F77', '#7FF', '#7F0']

const DomElement = tagName => {
	const dom = window.document.createElement(tagName)
	
	return {
		get dom(){ return dom },
		add: element => dom.appendChild(element.dom || element),
		set visible(value){ value ? dom.style.removeProperty('display') : dom.style.setProperty('display', 'none') },
		set text(value){ dom.innerHTML = value }
	}
}

const Canvas = _ => {
	const element = DomElement('canvas'),
          canvas = element.dom,
          context = canvas.getContext('2d'),
          dpr = Math.round(window.devicePixelRatio || 1)
	
	context.imageSmoothingEnabled = false
	
	return Object.assign(element, {
		get context(){ return context },
		resize: (width, height) => {
			canvas.width = width * dpr
			canvas.height = height * dpr
			canvas.style.width = width + 'px'
			canvas.style.height = height + 'px'
		},
		clear: _ => context.clearRect(0, 0, canvas.width, canvas.height),
		fill: (offsetX, offsetY, width, height, color) => {
			context.globalCompositeOperation =  'source-over'
			context.fillStyle = color
			context.fillRect(offsetX * dpr, offsetY * dpr, width * dpr, height * dpr)
		},
		blit: (sourceOffsetX, sourceOffsetY, sourceWidth, sourceHeight,
               offsetX, offsetY, width, height) => {
			context.globalCompositeOperation = 'copy'
			context.drawImage(canvas, 
                              sourceOffsetX * dpr, sourceOffsetY * dpr, sourceWidth * dpr, sourceHeight * dpr,
                              offsetX * dpr, offsetY * dpr, width * dpr, height * dpr)
		}
	})
}

const Graph = ({
    label = '',
	colors = defaultColors,
	width = 72,
	height = 36,
	range = 64,
    precision = 0
} = {}) => {
	const element = DomElement('div'),
          header = DomElement('div'),
          canvas = Canvas()
	element.add(header)
	element.add(canvas)
	
	canvas.dom.style.cssText = `
	margin: auto;
	outline: 1px solid ${ colors[0] };
    outline-offset: -1px;`
	
	element.dom.style.cssText = `
	color: ${ colors[0] };
	padding: 4px;
	font-size: ${ Math.floor(height/4) }px;
	display: inline-block;
	width: ${ width }px;`
	
	canvas.resize(width, height)
	header.text = label

	const step = Math.round(width/range) || 1,
          heights = new Float32Array(range)
	let max = 0, cursor = 0
	
	return Object.assign(element, {
		update: (values, maxScale) => {
			if(!(values instanceof Array)) values = [values]
			const value = values.reduce((sum, v) => sum + v, 0)
			
			cursor = (cursor || range) - 1
			heights[cursor] = value
			for(let i = 1; i < range; i++){
				let ii = (cursor + i) % range
				if(heights[ii] > value) break
				heights[ii] = value
			}
			let edgeMax = maxScale || heights[(cursor || range) - 1]
			let scaleY = max / edgeMax || 1
			max = edgeMax
			
			canvas.blit(step, 0, width, height,
			0, (1 - scaleY) * height, width, height * scaleY)
			
			for(let offset = 0, i = 0; i < values.length; i++){
				let y = Math.ceil(values[i]/max * height * 0.8)
				canvas.fill(width - step, height - y - offset, step, y, colors[i % colors.length])
				offset += y
			}
			
			header.text = `${label} ${ value.toFixed(precision) }/${ max.toFixed(precision) }`
		}
	})
}

const Indicator = ({
	label = '',
	colors = defaultColors,
	width = 72,
	height = 36,
    precision = 0
} = {}) => {
	const element = DomElement('div'),
          header = DomElement('div'),
          canvas = Canvas()
	element.add(header)
	element.add(canvas)
	
	canvas.dom.style.cssText = `
	outline: 1px solid ${ colors[0] };
    outline-offset: -1px;`
	
	element.dom.style.cssText = `
	color: ${ colors[0] };
	padding: 4px;
	font-size: ${ Math.floor(height/4) }px;
	display: inline-block;
	width: ${ width }px;`
	
	canvas.resize(width, height)
	header.text = label
	
	return Object.assign(element, {
		update: (values, threshold) => {
			
			canvas.context.globalAlpha = 0.96
			canvas.blit(0, 0, width, height, 0, 0, width, height)
			canvas.context.globalAlpha = 1
			
			for(let barWidth = height / values.length, i = 0; i < values.length; i++){
				let x = Math.ceil(values[i]/threshold * width * 0.9)
				canvas.fill(width - x, height - barWidth*(i+1), x, barWidth, colors[i % colors.length])
			}
			
			header.text = `${label} ${ values.reduce((acc, v) => acc + v, 0).toFixed(precision) }`
		}
	})
}

const Display = ({
	background = 'rgba(0, 0, 0, 0.5)'
} = {}) => {
	const element = DomElement('div')
	element.dom.style.cssText = `
	background-color: ${ background };
	position:fixed;
	top:0;
	left:0;
	overflow: hidden;
	white-space: nowrap;
	cursor: default;
	user-select: none;
	font-weight: bold;
	font-family: Verdana, Geneva, sans-serif;
	z-index:10000';`
	
	element.dom.addEventListener('click', event => {
		event.preventDefault()
	}, false)
	
	return Object.assign(element, {
	})
}

const MonitoringToolkit = options => {
	const display = Display()
	
	const fpsDisplay = Graph({ label: 'FPS', range: 32 }),
          msDisplay = Graph({ label: 'MS', precision: 1 }),
          memoryDisplay = Graph({ label: 'MB' }),
          queueDisplay = Graph({ label: 'TASKS', range: 32 }),
          drawCallDisplay = Indicator({ label: 'DRAWS' })
	
	display.add(fpsDisplay)
	display.add(msDisplay)
	display.add(queueDisplay)
    display.add(drawCallDisplay)
	display.add(memoryDisplay)
	
	let prevTimestamp = performance.now(),
        frameCounter = 0
	
	window.document.body.appendChild(display.dom)
	return {
		captureFrame: ({
            drawCalls,
            tasks,
            ms
        }) => {
			let timestamp = performance.now(),
			deltaTime = timestamp - prevTimestamp
			frameCounter++
            
            drawCallDisplay.update(drawCalls, 100)
            queueDisplay.update(tasks)
			
			msDisplay.update(ms)
			
			if(deltaTime >= 1000){
				fpsDisplay.update(frameCounter * 1000 / deltaTime, 60)
				prevTimestamp = timestamp
				frameCounter = 0
				if(performance.memory)
                    memoryDisplay.update(performance.memory.usedJSHeapSize / 1048576, performance.memory.jsHeapSizeLimit / 1048576)
			}
		}
	}
}

export {Display, Indicator, Graph, MonitoringToolkit}
import {WebGLShader} from './helpers/WebGLShader.js';
import { WebGLCanvas } from './helpers/WebGLCanvas.js';
import {Camera} from './helpers/Camera.js';
import {Coord} from './shapes/Coord.js';

/**
 * Klassen representerer en enkel WebGL-app.
 */
export class BaseApp {
	constructor(drawCoord=true) {
		// Oppretter WebGL-kontekst for tegning:
		this.canvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
		this.gl = this.canvas.gl;
		this.drawCoord = drawCoord;

		this.textureShaderInfo = undefined;

		this.initShaders();
		this.initKeyPress();

		// Brukes til å beregne og vise FPS (Frames Per Seconds):
		this.fpsData = {
			frameCount: 0,
			lastTimeStamp: 0
		};
		this.lastTime = 0;

		// For tastetrykk/brukerinput:
		this.currentlyPressedKeys = [];

		// Kamera:
		this.camera = new Camera(this.gl, this.currentlyPressedKeys);
		this.camera.set();

		// Koord:
		if (this.drawCoord) {
			this.coord = new Coord(this);
			this.coord.initBuffers();
		}
	}

	/**
	 * Enkelt shaderpar med posisjon og farge-attributter.
	 * NB! Shaderkode og baseShaderInfo-objektet henger sammen.
	 * SHADERE leses IKKE fra html-fila.
	 */
	initShaders() {
		// SHADERPAR1: Standard/enkel shader (posisjon og farge):
		const vertexShaderSourceBase =`
			attribute vec4 aVertexPosition;
		    attribute vec4 aVertexColor;
		    uniform mat4 uModelViewMatrix;
		    uniform mat4 uProjectionMatrix;
		    varying lowp vec4 vColor;
		    void main(void) {
		        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		        vColor = aVertexColor;
		        gl_PointSize = 10.0;    //Merk: Kun i bruk når man tegner POINTS
		    }
			`;
		const fragmentShaderSourceBase = `
			varying lowp vec4 vColor;
		    void main(void) {
		        gl_FragColor = vColor;
		    }
		`;
		// Initialiserer  & kompilerer shader-programmene;
		const glslBaseShader = new WebGLShader(this.gl, vertexShaderSourceBase, fragmentShaderSourceBase);
		// Samler all base-shader-info i et JS-objekt.
		this.baseShaderInfo = {
			program: glslBaseShader.shaderProgram,
			attribLocations: {
				vertexPosition: this.gl.getAttribLocation(glslBaseShader.shaderProgram, 'aVertexPosition'),
				vertexColor: this.gl.getAttribLocation(glslBaseShader.shaderProgram, 'aVertexColor'),
			},
			uniformLocations: {
				projectionMatrix: this.gl.getUniformLocation(glslBaseShader.shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: this.gl.getUniformLocation(glslBaseShader.shaderProgram, 'uModelViewMatrix'),
			},
		};
	}

	/**
	 * Eventmetode.
	 */
	handleKeyUp(event) {
		this.currentlyPressedKeys[event.code] = false;
	}

	/**
	 * Eventmetode.
	 */
	handleKeyDown(event) {
		this.currentlyPressedKeys[event.code] = true;
	}

	/**
	 * Knytter tastatur-evnents til funksjoner (handleKeyUp() og handleKeyDown())
	 */
	initKeyPress() {
		//NB! Legg merke til .bind(this)
		document.addEventListener('keyup', this.handleKeyUp.bind(this), false);
		document.addEventListener('keydown', this.handleKeyDown.bind(this), false);
	}

	/**
	 * Klargjør canvaset.
	 */
	clearCanvas() {
		this.gl.clearColor(0.9, 0.9, 0.9, 1);  // Clear screen farge.
		this.gl.clearDepth(1.0);
		this.gl.enable(this.gl.DEPTH_TEST);           // Enable "depth testing".
		this.gl.depthFunc(this.gl.LEQUAL);            // Nære objekter dekker fjerne objekter.
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	/**
	 * Håndter brukerinput.
	 */
	handleKeys(elapsed) {
		// Kameraet kontrollerer seg selv.
		this.camera.handleKeys(elapsed);
	}

	//NB! Denne overstyres av subklasser.
	draw(elapsed) {
		// Tegner koordinatsystem:
		if (this.drawCoord)
			this.coord.draw(this.baseShaderInfo,  elapsed);
	}

	// Animation loop
	animate(currentTime) {
		// Sørger for at animate kalles på nytt, for animasjon (60fps):
		window.requestAnimationFrame(this.animate.bind(this)); //Merk bind()
		// Beregn og vis FPS:
		let elapsed = this.calculateFps(currentTime);
		// Klargjør canvaset:
		this.clearCanvas();
		// Brukerinput;
		this.handleKeys(elapsed);
		// Kaller subklassens draw()
		this.draw(elapsed);
		// Øk antall frames med en:
		this.fpsData.frameCount++;
	}

	calculateFps(currentTime) {
		// Beregner FPS:
		if (currentTime === undefined)
			currentTime = 0; 	//Udefinert første gang.

		// Beregner og viser FPS:
		if (currentTime - this.fpsData.lastTimeStamp >= 1000) { //dvs. et sekund har forløpt...
			//Viser FPS i .html ("fps" er definert i .html fila):
			document.getElementById('fps').innerHTML = this.fpsData.frameCount;
			this.fpsData.frameCount = 0;
			this.fpsData.lastTimeStamp = currentTime; //Brukes for å finne ut om det har gått 1 sekund - i så fall beregnes FPS på nytt.
		}
		// Tar høyde for varierende frame rate:
		let elapsed = 0.0;			// Forløpt tid siden siste kalle på draw().
		if (this.lastTime !== 0.0)		// Først gang er lastTime = 0.0.
			elapsed = (currentTime - this.lastTime)/1000; // Deler på 1000 for å operere med sekunder.
		this.lastTime = currentTime;						// Setter lastTime til currentTime.

		return elapsed;
	}
}

import {WebGLCanvas} from '../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../base/helpers/WebGLShader.js';
import {Camera} from '../base/helpers/Camera.js';
import {ImageLoader} from '../base/helpers/ImageLoader.js';
import {isPowerOfTwo1} from '../base/lib/utility-functions.js';

export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, window.innerWidth, window.innerHeight);

	// Starter med å laste teksturer:
	let imageLoader = new ImageLoader();
	let textureUrls = ['../../base/textures/dice1.png'];
		imageLoader.load((textureImages) => {
			const textureImage = textureImages[0];
			if (isPowerOfTwo1(textureImage.width) && isPowerOfTwo1(textureImage.height)) {
				// Fortsetter:

				// Hjelpeobjekt som holder på objekter som trengs for rendring:
				const renderInfo = {
					gl: webGLCanvas.gl,
					baseShader: initBaseShaders(webGLCanvas.gl),
					textureShader: initTextureShaders(webGLCanvas.gl),
					coordBuffers: initCoordBuffers(webGLCanvas.gl),
					diceBuffers: initDiceTextureAndBuffers(webGLCanvas.gl, textureImage),
					gridBuffers: initGridBuffers(webGLCanvas.gl, 20),
					currentlyPressedKeys: [],
					lastTime: 0,
					fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
						frameCount: 0,
						lastTimeStamp: 0
					}
				};

				initKeyPress(renderInfo);
				const camera = new Camera(renderInfo.gl, renderInfo.currentlyPressedKeys);
				camera.camPosX = 5;
				camera.camPosY = 8;
				camera.camPosZ = 5;
				document.getElementById("reset").onclick = ()=>{
					camera.camPosX = 5;
					camera.camPosY = 8;
					camera.camPosZ = 5;
				}
				animate( 0, renderInfo, camera);
			}
	}, textureUrls);
}

function connectPositionAttribute(gl, baseShader, positionBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(
		baseShader.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShader.attribLocations.vertexPosition);
}

function connectTextureAttribute(gl, textureShader, textureBuffer, textureObject) {
	const numComponents = 2;    //NB!
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	//Bind til teksturkoordinatparameter i shader:
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(
		textureShader.attribLocations.vertexTextureCoordinate,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(textureShader.attribLocations.vertexTextureCoordinate);

	//Aktiver teksturenhet (0):
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureObject);
	//Send inn verdi som indikerer hvilken teksturenhet som skal brukes (her 0):
	let samplerLoc = gl.getUniformLocation(textureShader.program, textureShader.uniformLocations.sampler);
	gl.uniform1i(samplerLoc, 0);
}

function connectColorAttribute(gl, baseShader, colorBuffer) {
	const numComponents = 4;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(
		baseShader.attribLocations.vertexColor,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShader.attribLocations.vertexColor);
}

function initKeyPress(renderInfo) {
	document.addEventListener('keyup', (event) => {
		renderInfo.currentlyPressedKeys[event.code] = false;
	}, false);
	document.addEventListener('keydown', (event) => {
		renderInfo.currentlyPressedKeys[event.code] = true;
	}, false);
}

function initBaseShaders(gl) {
	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = document.getElementById('base-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('base-fragment-shader').innerHTML;

	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexColor: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexColor'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
		},
	};
}

function initTextureShaders(gl) {
	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = document.getElementById('texture-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('texture-fragment-shader').innerHTML;

	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexColor: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexColor'),
			vertexTextureCoordinate: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexTextureCoordinate'),
		},
		uniformLocations: {
			sampler: gl.getUniformLocation(glslShader.shaderProgram, 'uSampler'),
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
		},
	};
}

// Transparency
function drawTransparentObjects(renderInfo, camera) {
	let modelMatrix = new Matrix4();

	// Liste med ønskede posisjoner for transparente objekter:
	let positions = [];
	positions.push(
		{x: 0, y: 1, z: 0},		//Kuben
		{x: 0, y: 0, z: -10},	//Sfæren/kula
	);
	// Liste som inneholder kubenes posisjon (pos), avstand til kamera (dist) og hvilken draw-funksjon som skal kalles (func):
	let objectsToDraw = [];
	objectsToDraw.push(
		{pos: positions[0], dist: distanceFromCamera(camera, positions[0]), func: (renderInfo, camera, modelMatrix)=> drawDice(renderInfo, camera, modelMatrix)}
	);

	// Sorterer transparente objekter basert på avstanden fra kamera.
	// Merk: Bruker sentrum av objektet, som ikke nødvendigvis alltid blir helt korrekt.
	objectsToDraw.sort((distFromCam1, distFromCam2) => compare(distFromCam1.dist, distFromCam2.dist));

	// Tegner de sorterte objektene i rekkefølge, innerst til ytterst:
	for (let i = 0; i < objectsToDraw.length; i++) {
		modelMatrix.setIdentity();
		modelMatrix.translate(objectsToDraw[i].pos.x, objectsToDraw[i].pos.y, objectsToDraw[i].pos.z);
		//Merk bruk av func(...)!
		objectsToDraw[i].func(renderInfo, camera, modelMatrix);
	}
}

// Grid setup
function initGridBuffers(gl, squares) {
	const extent =  squares*2;
	var grids = [];
	var color = [];
	for (var i = -extent+1; i < extent; i+=2) {
		grids.push(
			-extent, 0, i,
			extent, 0, i,
			i, 0, -extent,
			i, 0, extent
		)
		color.push(
			0,0,0,1,   //R G B A
			0,0,0,1,   //R G B A
			0,0,0,1,   //R G B A
			0,0,0,1,   //R G B A
		)
	}
	console.log(grids)
	const positions = new Float32Array(grids);

	const colors = new Float32Array(color);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3
	};
}
// Coord funksjonen
function drawGrid(renderInfo, camera) {

	renderInfo.gl.useProgram(renderInfo.baseShader.program);

	let modelMatrix = new Matrix4();
	let viewMatrix = new Matrix4(camera.viewMatrix);
	let modelviewMatrix = viewMatrix.multiply(modelMatrix);

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	connectPositionAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.gridBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.gridBuffers.color);

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	renderInfo.gl.drawArrays(renderInfo.gl.LINES, 0, renderInfo.gridBuffers.vertexCount);
}
// Coord call
function Grid(renderInfo, camera, modelMatrix) {

	modelMatrix.setIdentity();
	drawGrid(renderInfo, camera, modelMatrix);
}

// Coord setup
function initCoordBuffers(gl) {
	const extent =  100;

	const positions = new Float32Array([
		-extent, 0, 0,
		extent, 0, 0,
		0, -extent, 0,
		0, extent, 0,
		0, 0, -extent,
		0, 0, extent
	]);

	const colors = new Float32Array([
		1,0,0,1,   //R G B A
		1,0,0,1,   //R G B A
		0,1,0,1,   //R G B A
		0,1,0,1,   //R G B A
		0,0,1,1,   //R G B A
		0,0,1,1,   //R G B A
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3
	};
}
// Coord funksjonen
function drawCoord(renderInfo, camera) {

	renderInfo.gl.useProgram(renderInfo.baseShader.program);

	let modelMatrix = new Matrix4();
	let viewMatrix = new Matrix4(camera.viewMatrix);
	let modelviewMatrix = viewMatrix.multiply(modelMatrix);

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	connectPositionAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coordBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coordBuffers.color);

	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	renderInfo.gl.drawArrays(renderInfo.gl.LINES, 0, renderInfo.coordBuffers.vertexCount);
}
// Coord call
function coord(renderInfo, camera, modelMatrix) {

	modelMatrix.setIdentity();
	drawCoord(renderInfo, camera, modelMatrix);
}

// Dice setup
function initDiceTextureAndBuffers(gl, textureImage) {
	let positions = [
		//Forsiden (pos):
		-1, 1, 1,
		-1,-1, 1,
		1,-1, 1,

		-1,1,1,
		1, -1, 1,
		1,1,1,

		//H�yre side:
		1,1,1,
		1,-1,1,
		1,-1,-1,

		1,1,1,
		1,-1,-1,
		1,1,-1,

		//Baksiden (pos):
		1, -1, -1,
		-1, -1, -1,
		1, 1, -1,

		-1, -1, -1,
		-1, 1, -1,
		1, 1, -1,

		//Venstre side:
		-1,-1,-1,
		-1,1,1,
		-1,1,-1,

		-1,-1,1,
		-1,1,1,
		-1,-1,-1,

		//Topp:
		-1,1,1,
		1,1,1,
		-1,1,-1,

		-1,1,-1,
		1,1,1,
		1,1,-1,

		//Bunn:
		-1,-1,-1,
		1,-1,1,
		-1,-1,1,

		-1,-1,-1,
		1,-1,-1,
		1,-1,1,
	];

	let color = {red: 1.0, green: 0.45, blue: 0.9, alpha: 0.6}
	let colors = [
		//Forsiden:
		1.0, 0.0, 0.0, 0.3,
		1.0, 0.0, 0.0, 0.3,
		1.0, 0.0, 0.0, 0.3,

		1.0, 0.0, 0.0, 0.3,
		1.0, 0.0, 0.0, 0.3,
		1.0, 0.0, 0.0, 0.3,

		//H�yre side:
		0.0, 1.0, 0.0, 0.3,
		0.0, 1.0, 0.0, 0.3,
		0.0, 1.0, 0.0, 0.3,

		0.0, 1.0, 0.0, 0.3,
		0.0, 1.0, 0.0, 0.3,
		0.0, 1.0, 0.0, 0.3,

		//Baksiden:
		1.0, 0, 0.0, 0.3,
		1.0, 0, 0.0, 0.3,
		1.0, 0, 0.0, 0.3,

		1.0, 0, 0.0, 0.3,
		1.0, 0, 0.0, 0.3,
		1.0, 0, 0.0, 0.3,

		//Venstre side:
		0.0, 0.0, 1.0, 0.3,
		0.0, 0.0, 1.0, 0.3,
		0.0, 0.0, 1.0, 0.3,

		0.0, 0.0, 1.0, 0.3,
		0.0, 0.0, 1.0, 0.3,
		0.0, 0.0, 1.0, 0.3,

		//Topp
		0.0, 0.0, 1, 0.3,
		0.0, 0.0, 1, 0.3,
		0.0, 0.0, 1, 0.3,

		0.0, 0.0, 1, 0.3,
		0.0, 0.0, 1, 0.3,
		0.0, 0.0, 1, 0.3,

		//Bunn:
		0.5, 0.7, 0.3, 0.3,
		0.5, 0.7, 0.3, 0.3,
		0.5, 0.7, 0.3, 0.3,

		0.5, 0.7, 0.3, 0.3,
		0.5, 0.7, 0.3, 0.3,
		0.5, 0.7, 0.3, 0.3
	];
	//for (let i = 0; i < colors.length; i+=4) {
		//colors[i] = 0.6;
	//}
	//Samme farge på alle sider:
	//for (let i = 0; i < 36; i++) {
	//	colors.push(color.red, color.green, color.blue, color.alpha);
	//}

	// Teksturkoordinater / UV-koordinater:
	//Setter uv-koordinater for hver enkelt side av terningen vha. en enkel tekstur.
	//Teksturen / .png-fila må se slik ut, dvs. 2 linjer og 3 kolonner, der hver celle
	//inneholder et "bilde" av et tall (1-6).
	// -------------
	// | 1 | 2 | 3 |
	// |-----------|
	// | 4 | 5 | 6 |
	// -------------

	//Holder etter hvert p� alle uv-koordinater for terningen.
	let textureCoordinates = [];
	//Front (1-tallet):
	let tl1=[0,1];
	let bl1=[0,0.5];
	let tr1=[0.33333,1];
	let br1=[0.33333,0.5];
	textureCoordinates = textureCoordinates.concat(tl1, bl1, br1, tl1, br1, tr1);

	//Høyre side (2-tallet):
	let tl2=[0.33333,1];
	let bl2=[0.33333,0.5];
	let tr2=[0.66666,1];
	let br2=[0.66666,0.5];
	textureCoordinates = textureCoordinates.concat(tl2, bl2, br2, tl2, br2, tr2);

	//Baksiden (6-tallet):
	let tl3=[0.66666,0.5];
	let bl3=[0.66666,0];
	let tr3=[1,0.5];
	let br3=[1,0];
	textureCoordinates = textureCoordinates.concat(bl3, br3, tl3, br3, tr3, tl3);

	//Venstre (5-tallet):
	let tl4=[0.33333,0.5];
	let bl4=[0.33333,0];
	let tr4=[0.66666,0.5];
	let br4=[0.66666,0];
	textureCoordinates = textureCoordinates.concat(bl4, tr4, tl4, br4, tr4, bl4);

	//Toppen (3-tallet):
	let tl5=[0.66666,1];
	let bl5=[0.66666,0.5];
	let tr5=[1,1];
	let br5=[1,0.5];
	textureCoordinates = textureCoordinates.concat(bl5, br5, tl5, tl5, br5, tr5);

	//Bunnen (4-tallet):
	let tl6=[0,0.5];
	let bl6=[0,0];
	let tr6=[0.33333,0.5];
	let br6=[0.33333,0];
	textureCoordinates = textureCoordinates.concat(tr6, bl6, br6,tr6,tl6, bl6);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	//Texture:
	const rectangleTexture = gl.createTexture();
	//Teksturbildet er nå lastet fra server, send til GPU:
	gl.bindTexture(gl.TEXTURE_2D, rectangleTexture);
	//Unngaa at bildet kommer opp-ned:
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);   //NB! FOR GJENNOMSIKTIG BAKGRUNN!! Sett også gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//Laster teksturbildet til GPU/shader:
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
	//Teksturparametre:
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	gl.bindTexture(gl.TEXTURE_2D, null);

	const textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		texture: textureBuffer,
		textureObject: rectangleTexture,
		vertexCount: positions.length/3,
	};
}
// Dice funksjonen
function drawDice(renderInfo, camera, modelMatrix) {

	renderInfo.gl.useProgram(renderInfo.textureShader.program);

	let viewMatrix = new Matrix4(camera.viewMatrix);
	let modelviewMatrix = viewMatrix.multiply(modelMatrix);

	connectPositionAttribute(renderInfo.gl, renderInfo.textureShader, renderInfo.diceBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.textureShader, renderInfo.diceBuffers.color);
	connectTextureAttribute(renderInfo.gl, renderInfo.textureShader, renderInfo.diceBuffers.texture, renderInfo.diceBuffers.textureObject);

	renderInfo.gl.uniformMatrix4fv(renderInfo.textureShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.textureShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	// Bruker culling for korrekt blending:
	renderInfo.gl.frontFace(renderInfo.gl.CCW);	    	// Angir vertekser CCW.
	renderInfo.gl.enable(renderInfo.gl.CULL_FACE);	    // Aktiverer culling.

	//Tegner baksidene først:
	renderInfo.gl.cullFace(renderInfo.gl.FRONT);	    	// Skjuler forsider.
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.diceBuffers.vertexCount);
	//Tegner deretter forsidene:
	renderInfo.gl.cullFace(renderInfo.gl.BACK);	    	    // Skjuler baksider.
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.diceBuffers.vertexCount);
}
// Dice call
function Dice(renderInfo, camera, modelMatrix) {

	// +X
	modelMatrix.setIdentity();
	modelMatrix.translate(2,1, 0);
	drawDice(renderInfo, camera, modelMatrix);

	// -X
	modelMatrix.setIdentity();
	modelMatrix.translate(-2,1, 0);
	drawDice(renderInfo, camera, modelMatrix);

	// -Z
	modelMatrix.setIdentity();
	modelMatrix.translate(0,1, 2);
	drawDice(renderInfo, camera, modelMatrix);

	// +Z
	modelMatrix.setIdentity();
	modelMatrix.translate(0,1, -2);
	drawDice(renderInfo, camera, modelMatrix);

	// +Y
	modelMatrix.setIdentity();
	modelMatrix.translate(0,3, 0);
	drawDice(renderInfo, camera, modelMatrix);

	// -Y
	modelMatrix.setIdentity();
	modelMatrix.translate(0,-1, 0);
	drawDice(renderInfo, camera, modelMatrix);
}

// Everything
function draw(currentTime, renderInfo, camera) {
	clearCanvas(renderInfo.gl);
	let modelMatrix = new Matrix4();
	// Tegner koordinatsystemet
	coord(renderInfo, camera, modelMatrix);
	// Tegner Transparent Objekt
	drawTransparentObjects(renderInfo, camera);
	// Tegner Dice
	Dice(renderInfo, camera, modelMatrix);
	// Tegner Grid
	Grid(renderInfo, camera, modelMatrix);

	renderInfo.gl.enable(renderInfo.gl.BLEND);
	renderInfo.gl.blendFunc(renderInfo.gl.SRC_ALPHA, renderInfo.gl.ONE_MINUS_SRC_ALPHA);
	//* Slår AV depthMask (endrer dermed ikke DEPTH-BUFFER):
	renderInfo.gl.depthMask(false);
	//* Tegner:
	renderInfo.gl.depthMask(true);
}
function clearCanvas(gl) {
	gl.clearColor(0.9, 0.9, 0.9, 1);  // Clear screen farge.
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);           // Enable "depth testing".
	gl.depthFunc(gl.LEQUAL);            // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function animate(currentTime, renderInfo, camera) {
	window.requestAnimationFrame((currentTime) => {
		animate(currentTime, renderInfo, camera);
	});

	// Finner tid siden siste kall på draw().
	let elapsed = getElapsed(currentTime, renderInfo);
	calculateFps(currentTime, renderInfo.fpsInfo);
	camera.handleKeys(elapsed);
	draw(currentTime, renderInfo, camera);
}

function getElapsed(currentTime, renderInfo) {
	let elapsed = 0.0;
	if (renderInfo.lastTime !== 0.0)	// Først gang er lastTime = 0.0.
		elapsed = (currentTime - renderInfo.lastTime)/1000; // Deler på 1000 for å operere med sekunder.
	renderInfo.lastTime = currentTime;						// Setter lastTime til currentTime.
	return elapsed;
}

function calculateFps(currentTime, fpsInfo) {
	if (!currentTime) currentTime = 0;
	// Sjekker om  ET sekund har forløpt...
	if (currentTime - fpsInfo.lastTimeStamp >= 1000) {
		// Viser FPS i .html ("fps" er definert i .html fila):
		document.getElementById('fps').innerHTML = fpsInfo.frameCount;
		// Nullstiller fps-teller:
		fpsInfo.frameCount = 0;
		//Brukes for å finne ut om det har gått 1 sekund - i så fall beregnes FPS på nytt.
		fpsInfo.lastTimeStamp = currentTime;
	}
	// Øker antall frames per sekund:
	fpsInfo.frameCount++;
}

function compare( dist1, dist2 ) {
	if (dist1 < dist2 ){
		return 1;
	}
	if ( dist1 > dist2 ){
		return -1;
	}
	return 0;
}

function distanceFromCamera(camera, positions) {
	let x = positions.x;
	let y = positions.y;
	let z = positions.z;
	return Math.sqrt((camera.camPosX - x) ** 2 + (camera.camPosY - y) ** 2 + (camera.camPosZ - z) ** 2);
}


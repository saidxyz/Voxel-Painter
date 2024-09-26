import {WebGLCanvas} from '../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../base/helpers/WebGLShader.js';
import {Camera} from '../base/helpers/Camera.js';
import {ImageLoader} from '../base/helpers/ImageLoader.js';
import {isPowerOfTwo1} from '../base/lib/utility-functions.js';

export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, window.innerWidth, window.innerHeight);
	let voxels = []


	let playerPositon = {
		x:0,
		y:0,
		z:0,
	}
	document.getElementById('zdec').onclick = () => {
		tryToDrawWhileMove(voxels)
		document.getElementById('z').value--
		playerPositon.z = 2 * (+document.getElementById('z').value)
	}
	document.getElementById('zinc').onclick = () => {
		tryToDrawWhileMove(voxels)
		document.getElementById('z').value++
		playerPositon.z = 2 * (+document.getElementById('z').value)
	}
	document.getElementById('xdec').onclick = () => {
		tryToDrawWhileMove(voxels)
		document.getElementById('x').value--
		playerPositon.x = 2 * (+document.getElementById('x').value)
	}
	document.getElementById('xinc').onclick = () => {
		tryToDrawWhileMove(voxels)
		document.getElementById('x').value++
		playerPositon.x = 2 * (+document.getElementById('x').value)
	}
	document.getElementById('yinc').onclick = () => {
		tryToDrawWhileMove(voxels)
		document.getElementById('y').value++
		playerPositon.y = 2 *(+document.getElementById('y').value)
	}
	document.getElementById('ydec').onclick = () => {
		tryToDrawWhileMove(voxels)
		document.getElementById('y').value--
		playerPositon.y = 2 * (+document.getElementById('y').value)
	}
	document.getElementById('build').onclick = () => {
		let position = {
			x: +document.getElementById('x').value,
			y: +document.getElementById('y').value,
			z: +document.getElementById('z').value
		}
		voxels.push(new Voxel(position,	document.getElementById("randomcolor").checked))
		console.log(voxels)
	}

	document.getElementById('x').onchange = () => {playerPositon.x = +document.getElementById('x').value }
	document.getElementById('y').onchange = () => {playerPositon.y = +document.getElementById('y').value }
	document.getElementById('z').onchange = () => {playerPositon.z = +document.getElementById('z').value }



	// Starter med å laste teksturer:
	let imageLoader = new ImageLoader();
	let textureUrls = ['../../base/textures/dice1.png'];
		imageLoader.load((textureImages) => {
			const textureImage = textureImages[0];
			if (isPowerOfTwo1(textureImage.width) && isPowerOfTwo1(textureImage.height)) {
				// Fortsetter:
				// Hjelpeobjekt som holder på objekter som trengs for rendring:
				const renderInfo = {
					position: playerPositon,
					gl: webGLCanvas.gl,
					diffuseLightTextureShader: initDiffuseLightTextureShader(webGLCanvas.gl, true),
					xzplaneBuffers: initXZPlaneBuffers(webGLCanvas.gl, textureImage),
					baseShader: initBaseShaders(webGLCanvas.gl),
					textureShader: initTextureShaders(webGLCanvas.gl),
					coordBuffers: initCoordBuffers(webGLCanvas.gl),
					diceBuffers: initDiceTextureAndBuffers(webGLCanvas.gl, textureImage),
					gridBuffers: initGridBuffers(webGLCanvas.gl, 20),
					playerBuffer:initPlayerBuffers(webGLCanvas.gl, textureImage),
					coneBuffer:initCone(webGLCanvas.gl),
					currentlyPressedKeys: [],
					lastTime: 0,
					fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
						frameCount: 0,
						lastTimeStamp: 0
					},
					voxels: voxels,
					light: {
						lightPosition: {x: 3, y:3, z:3},
						diffuseLightColor: {r: 0.1, g: 0.8, b:0.3},
						ambientLightColor: {r: 0.2, g: 0.2, b:0.2},
					},
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
				document.onwheel = (e ) => {
					if (e.deltaY > 0) {
						let camPosVec = vec3.fromValues(camera.camPosX, camera.camPosY, camera.camPosZ);
						vec3.scale(camPosVec, camPosVec, 1.10);
						camera.camPosX = camPosVec[0];
						camera.camPosY = camPosVec[1];
						camera.camPosZ = camPosVec[2];
						camera.set();
					}
					if (e.deltaY < 0) {
						let camPosVec = vec3.fromValues(camera.camPosX, camera.camPosY, camera.camPosZ);
						vec3.scale(camPosVec, camPosVec, 0.90);
						camera.camPosX = camPosVec[0];
						camera.camPosY = camPosVec[1];
						camera.camPosZ = camPosVec[2];
						camera.set();
					}
				}
				animate( 0, renderInfo, camera);
			}
	}, textureUrls);
}

class Voxel {
	constructor(position, random, color = [0.5,0.5,0.5,0.7]){
		this.x = position.x*2
		this.y = position.y*2 + 1
		this.z = position.z*2
		this.color = color
		if(random){
			this.color[0] = Math.random()
			this.color[1] = Math.random()
			this.color[2] = Math.random()
		}
		this.color[3] = 0.7
	}
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

function tryToDrawWhileMove(voxels){
	if(document.getElementById('draw').checked){
		voxels.push(new Voxel({
				x: document.getElementById('x').value,
				y: document.getElementById('y').value,
				z: document.getElementById('z').value
			},document.getElementById('randomcolor').checked)
		)
	}
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
	let colors = [];
	for(let i = 0; i < renderInfo.voxels.length;i++) {
		positions.push(
			{
				x: renderInfo.voxels[i].x,
				y: renderInfo.voxels[i].y,
				z: renderInfo.voxels[i].z
			}
		);
		colors.push(
			renderInfo.voxels[i].color
		)
	}
	console.log(positions)
	console.log(renderInfo.voxels)
	// Liste som inneholder kubenes posisjon (pos), avstand til kamera (dist) og hvilken draw-funksjon som skal kalles (func):
	let objectsToDraw = [];
	for (let i = 0; i < positions.length;i++) {
		objectsToDraw.push(
			{
				pos: positions[i],
				dist: distanceFromCamera(camera, positions[i]),
				func: (renderInfo, camera, modelMatrix)=> drawDice(renderInfo, camera, modelMatrix, colors[i])
			}
		);
	}

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

	let normals = [
		//Forsiden:
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		//H�yre side:
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		//Baksiden:
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		//Venstre side:
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		//Topp
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		//Bunn:
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
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

	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
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
		normal: normalBuffer,
		color: colorBuffer,
		texture: textureBuffer,
		textureObject: rectangleTexture,
		vertexCount: positions.length/3,
	};
}
// Dice funksjonen
function drawDice(renderInfo, camera, modelMatrix, colors = [0.5,0.5,0.5,0.7]) {

	renderInfo.gl.useProgram(renderInfo.diffuseLightTextureShader.program);

	let colorTemp = []
	for(let i = 0; i < renderInfo.diceBuffers.vertexCount;i++){
		colorTemp[i] = colors
	}
	colorTemp = colorTemp.flat()

	let colorBuffer = renderInfo.gl.createBuffer();
	renderInfo.gl.bindBuffer(renderInfo.gl.ARRAY_BUFFER, colorBuffer);
	renderInfo.gl.bufferData(renderInfo.gl.ARRAY_BUFFER, new Float32Array(colorTemp), renderInfo.gl.STATIC_DRAW);
	renderInfo.gl.bindBuffer(renderInfo.gl.ARRAY_BUFFER, null);

	connectPositionAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.diceBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, colorBuffer);
	connectNormalAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.diceBuffers.normal);

	connectAmbientUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.ambientLightColor);
	connectDiffuseUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.diffuseLightColor);
	connectLightPositionUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.lightPosition);

	connectTextureAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.diceBuffers.texture, renderInfo.diceBuffers.textureObject);

	// Send MODELLmatrisa til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelMatrix, false, modelMatrix.elements);

	// Lager en kopi for å ikke påvirke kameramatrisene:
	let viewMatrix = new Matrix4(camera.viewMatrix);
	let modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!


	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	// Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
	let normalMatrix = mat3.create();
	mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js

	// Send normalmatrisa til shaderen (merk: 3x3):
	renderInfo.gl.uniformMatrix3fv(renderInfo.diffuseLightTextureShader.uniformLocations.normalMatrix, false, normalMatrix);

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
	renderInfo.gl.enable(renderInfo.gl.BLEND);
	renderInfo.gl.blendFunc(renderInfo.gl.SRC_ALPHA, renderInfo.gl.ONE_MINUS_SRC_ALPHA);
	//* Slår AV depthMask (endrer dermed ikke DEPTH-BUFFER):
	renderInfo.gl.depthMask(false);
	//* Tegner voxels:
	renderInfo.gl.depthMask(true);

	for(let voxel in renderInfo.voxels.length){
		modelMatrix.setIdentity();
		modelMatrix.translate(
			voxel.position.x,
			voxel.position.y,
			voxel.position.z
		);
		drawDice(renderInfo, camera, modelMatrix);
	}

}
// Update position variables when buttons are clicked

// Player setup
function initPlayerBuffers(gl, textureImage) {
	let positions = [
		//Forsiden (pos):
		-1.1, 1.1, 1.1,
		-1.1,-1.1, 1.1,
		1.1,-1.1, 1.1,

		-1.1,1.1,1.1,
		1.1, -1.1, 1.1,
		1.1,1.1,1.1,

		//H�yre side:
		1.1,1.1,1.1,
		1.1,-1.1,1.1,
		1.1,-1.1,-1.1,

		1.1,1.1,1.1,
		1.1,-1.1,-1.1,
		1.1,1.1,-1.1,

		//Baksiden (pos):
		1.1, -1.1, -1.1,
		-1.1, -1.1, -1.1,
		1.1, 1.1, -1.1,

		-1.1, -1.1, -1.1,
		-1.1, 1.1, -1.1,
		1.1, 1.1, -1.1,

		//Venstre side:
		-1.1,-1.1,-1.1,
		-1.1,1.1,1.1,
		-1.1,1.1,-1.1,

		-1.1,-1.1,1.1,
		-1.1,1.1,1.1,
		-1.1,-1.1,-1.1,

		//Topp:
		-1.1,1.1,1.1,
		1.1,1.1,1.1,
		-1.1,1.1,-1.1,

		-1.1,1.1,-1.1,
		1.1,1.1,1.1,
		1.1,1.1,-1.1,

		//Bunn:
		-1.1,-1.1,-1.1,
		1.1,-1.1,1.1,
		-1.1,-1.1,1.1,

		-1.1,-1.1,-1.1,
		1.1,-1.1,-1.1,
		1.1,-1.1,1.1,
	];
	let colors = [
		//Forsiden:
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		//H�yre side:
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		//Baksiden:
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		//Venstre side:
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		//Topp
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		//Bunn:
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,

		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
		1.0, 1.0, 1.0, 1,
	];

	let normals = [
		//Forsiden:
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		//H�yre side:
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		//Baksiden:
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		//Venstre side:
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		//Topp
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		//Bunn:
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
	];

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

	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
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
		normal: normalBuffer,
		color: colorBuffer,
		texture: textureBuffer,
		textureObject: rectangleTexture,
		vertexCount: positions.length/3,
	};
}
// Player funksjonen
function drawPlayer(renderInfo, camera, modelMatrix) {

	renderInfo.gl.useProgram(renderInfo.diffuseLightTextureShader.program);

	connectPositionAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.playerBuffer.position);
	connectColorAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.playerBuffer.color);
	connectNormalAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.playerBuffer.normal);

	connectAmbientUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.ambientLightColor);
	connectDiffuseUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.diffuseLightColor);
	connectLightPositionUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.lightPosition);

	connectTextureAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.playerBuffer.texture, renderInfo.playerBuffer.textureObject);

	// Send MODELLmatrisa til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelMatrix, false, modelMatrix.elements);

	// Lager en kopi for å ikke påvirke kameramatrisene:
	let viewMatrix = new Matrix4(camera.viewMatrix);
	let modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!


	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	// Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
	let normalMatrix = mat3.create();
	mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js

	// Send normalmatrisa til shaderen (merk: 3x3):
	renderInfo.gl.uniformMatrix3fv(renderInfo.diffuseLightTextureShader.uniformLocations.normalMatrix, false, normalMatrix);

	// Bruker culling for korrekt blending:
	renderInfo.gl.frontFace(renderInfo.gl.CCW);	    	// Angir vertekser CCW.
	renderInfo.gl.enable(renderInfo.gl.CULL_FACE);	    // Aktiverer culling.

	//Tegner baksidene først:
	renderInfo.gl.cullFace(renderInfo.gl.FRONT);	    	// Skjuler forsider.
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.playerBuffer.vertexCount);

	//Tegner deretter forsidene:
	renderInfo.gl.cullFace(renderInfo.gl.BACK);	    	    // Skjuler baksider.
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.playerBuffer.vertexCount);
}
// Player call
function player(renderInfo, camera, modelMatrix) {

	modelMatrix.setIdentity();
	modelMatrix.translate(renderInfo.position.x,renderInfo.position.y+1,renderInfo.position.z);
	drawPlayer(renderInfo, camera, modelMatrix);
}

// Cone setup
function initCone(gl) {
	let positions = [];
	let colors = [];

	let sectors = 12;
	let stepGrader = 360 / sectors;
	let step = (Math.PI / 180) * stepGrader;
	let r =0 , g = 0, b = 1, a = 1; // Fargeverdier.

	// Startpunkt (toppen av kjegla):
	let x = 0, y = 2, z = 0;
	positions = positions.concat(x, y, z);
	colors = colors.concat(r, g, b, a);

	let phi = 0.0;
	for (let sector = 1; sector <= sectors + 1; sector++) {
		x = Math.cos(phi);
		y = 0;
		z = Math.sin(phi);

		positions = positions.concat(x, y, z);
		g += 0.1; // Endrer litt på fargen for hver verteks.
		colors = colors.concat(r, g, b, a);

		phi += step;
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length / 3,
	};
}
// Cone funksjonen
function drawCone(renderInfo, camera, modelMatrix) {

	renderInfo.gl.useProgram(renderInfo.textureShader.program);

	let viewMatrix = new Matrix4(camera.viewMatrix);
	let modelviewMatrix = viewMatrix.multiply(modelMatrix);

	renderInfo.gl.uniformMatrix4fv(renderInfo.textureShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.textureShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	connectPositionAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coneBuffer.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coneBuffer.color);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLE_FAN, 0, renderInfo.coneBuffer.vertexCount);
}
// Cone call
function Cone(renderInfo, camera, modelMatrix) {

	modelMatrix.setIdentity();
	modelMatrix.translate(0,5,0);
	modelMatrix.scale(0.2,0.2,0.2);
	drawCone(renderInfo, camera, modelMatrix);

	modelMatrix.setIdentity();
	modelMatrix.translate(0,-5,0);
	modelMatrix.scale(0.2,0.2,0.2);
	drawCone(renderInfo, camera, modelMatrix);

	modelMatrix.setIdentity();
	modelMatrix.translate(5,0,0);
	modelMatrix.rotate(270,0.0,0.0);
	modelMatrix.scale(0.2,0.2,0.2);

	drawCone(renderInfo, camera, modelMatrix);

	modelMatrix.setIdentity();
	modelMatrix.translate(-5,0,0);
	modelMatrix.rotate(270,0.0,0.0);
	modelMatrix.scale(0.2,0.2,0.2);
	drawCone(renderInfo, camera, modelMatrix);

	modelMatrix.setIdentity();
	modelMatrix.translate(0,0,5);
	modelMatrix.rotate(0,0.0,0.0);
	modelMatrix.scale(0.2,0.2,0.2);
	drawCone(renderInfo, camera, modelMatrix);

	modelMatrix.setIdentity();
	modelMatrix.translate(0,0,-5);
	modelMatrix.rotate(90,0.0,0.0);
	modelMatrix.scale(0.2,0.2,0.2);
	drawCone(renderInfo, camera, modelMatrix);
}

// LightShader setup
function initDiffuseLightTextureShader(gl, usePhongShading=false) {

	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = undefined;
	let fragmentShaderSource = undefined;

	vertexShaderSource = document.getElementById('diffuse-pointlight-phong-vertex-shader').innerHTML;
	fragmentShaderSource = document.getElementById('diffuse-pointlight-phong-fragment-shader').innerHTML;

	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexNormal: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexNormal'),
			vertexColor: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexColor'),
			vertexTextureCoordinate: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexTextureCoordinate'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
			modelMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelMatrix'),
			normalMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uNormalMatrix'),

			lightPosition: gl.getUniformLocation(glslShader.shaderProgram, 'uLightPosition'),
			ambientLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uAmbientLightColor'),
			diffuseLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uDiffuseLightColor'),

			sampler: gl.getUniformLocation(glslShader.shaderProgram, 'uSampler'),
		},
	};
}

function initXZPlaneBuffers(gl, textureImage) {
	const XZPLANE_SIZE=100;
	let positions = [
		-XZPLANE_SIZE/2, 0, XZPLANE_SIZE/2,
		XZPLANE_SIZE/2, 0, XZPLANE_SIZE/2,
		-XZPLANE_SIZE/2, 0, -XZPLANE_SIZE/2,
		-XZPLANE_SIZE/2, 0, -XZPLANE_SIZE/2,
		XZPLANE_SIZE/2, 0, XZPLANE_SIZE/2,
		XZPLANE_SIZE/2, 0, -XZPLANE_SIZE/2,
	];
	let normals = [
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
	];
	let textureCoordinates = [
		0, 0,
		1, 0,
		0, 1,
		0, 1,
		1, 0,
		1, 1
	];

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

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		normal: normalBuffer,
		texture: textureBuffer,
		textureObject: rectangleTexture,
		vertexCount: positions.length/3,
	};
}

function drawXZPlane(renderInfo, camera, modelMatrix) {
	// Aktiver shader:
	renderInfo.gl.useProgram(renderInfo.diffuseLightTextureShader.program);

	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.xzplaneBuffers.position);
	connectNormalAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.xzplaneBuffers.normal);

	connectAmbientUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.ambientLightColor);
	connectDiffuseUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.diffuseLightColor);
	connectLightPositionUniform(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.light.lightPosition);

	connectTextureAttribute(renderInfo.gl, renderInfo.diffuseLightTextureShader, renderInfo.xzplaneBuffers.texture, renderInfo.xzplaneBuffers.textureObject);

	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	modelMatrix.translate(0,0,0);
	modelMatrix.scale(0.5,0.5, 0.5);

	// Send MODELLmatrisa til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelMatrix, false, modelMatrix.elements);

	// Lager en kopi for å ikke påvirke kameramatrisene:
	let viewMatrix = new Matrix4(camera.viewMatrix);
	let modelviewMatrix = viewMatrix.multiply(modelMatrix); // NB! rekkefølge!

	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightTextureShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	// Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
	let normalMatrix = mat3.create();
	mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js
	// Send normalmatrisa til shaderen (merk: 3x3):
	renderInfo.gl.uniformMatrix3fv(renderInfo.diffuseLightTextureShader.uniformLocations.normalMatrix, false, normalMatrix);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.xzplaneBuffers.vertexCount);
}


function connectNormalAttribute(gl, shader, normalBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(
		shader.attribLocations.vertexNormal,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
}

function connectAmbientUniform(gl, shader, color) {
	gl.uniform3f(shader.uniformLocations.ambientLightColor, color.r,color.g,color.b);
}

function connectDiffuseUniform(gl, shader,color) {
	gl.uniform3f(shader.uniformLocations.diffuseLightColor, color.r,color.g,color.b);
}

function connectLightPositionUniform(gl, shader, position) {
	gl.uniform3f(shader.uniformLocations.lightPosition, position.x,position.y,position.z);
}


// Everything
function draw(currentTime, renderInfo, camera) {
	clearCanvas(renderInfo.gl);


	let modelMatrix = new Matrix4();
	// Draw koordinatsystemet
	coord(renderInfo, camera, modelMatrix);
	// Draw Dice
	Dice(renderInfo, camera, modelMatrix);
	// Draw Transparent Objekt
	drawTransparentObjects(renderInfo, camera);
	// Draw Dice
	Dice(renderInfo, camera, modelMatrix);
	// Draw Grid
	Grid(renderInfo, camera, modelMatrix);
	// Draw Player
	player(renderInfo, camera, modelMatrix);
	// Draw Cone
	//Cone(renderInfo, camera, modelMatrix);
	//drawXZPlane(renderInfo, camera, modelMatrix);
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


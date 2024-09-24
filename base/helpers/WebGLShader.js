export class WebGLShader {
	constructor(gl, vsSource, fsSource) {
		this.shaderProgram = null;

		// Compile shaders:
		const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vsSource);
		const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

		// Attach compiled shaders to shaderProgram:
		this.shaderProgram = gl.createProgram();
		gl.attachShader(this.shaderProgram, vertexShader);
		gl.attachShader(this.shaderProgram, fragmentShader);
		// Link shaderProgram:
		gl.linkProgram(this.shaderProgram);
		// Sjekker ev. feil:
		if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
			alert('Feil ved kompilering og/eller linking av shaderprogrammene: ' + gl.getProgramInfoLog(this.shaderProgram));
		}
		// gl-objektet inneholder nå verteks- og fragmentshaderne via shaderProgram.
	}

	compileShader(gl, type, source) {
		const shader = gl.createShader(type);
		// Send the source to the shader object
		gl.shaderSource(shader, source);
		// Compile the shader program
		gl.compileShader(shader);
		// Check for compile errors:
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert('En feil oppsto ved kompilering av shaderne: ' + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}
}

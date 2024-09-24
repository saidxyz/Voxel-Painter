/**
 * Lager et <div> element som inneholder et <canvas> element.
 * <div> elementet gis en id.
 */
export class WebGLCanvas {
	constructor(id, parent, width, height) {
		let divWrapper = document.createElement('div');
		this.canvasElem = document.createElement('canvas');
		parent.appendChild(divWrapper);
		divWrapper.appendChild(this.canvasElem);
		divWrapper.id = id;
		this.canvasElem.width = width;
		this.canvasElem.height = height;
		this.gl = this.canvasElem.getContext('webgl2', {stencil: true} );
		if (!this.gl)
			alert('En feil oppsto ved lesing av WebGL-konteksten.');
	}
}

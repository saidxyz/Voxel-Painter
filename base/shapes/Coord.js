'use strict';
import {BaseShape} from './BaseShape.js';

/**
 * Setter this.positions & this.colors for koordinatsystemet:
 * Tegnes vha. gl.LINES
 */
export class Coord extends BaseShape {

	constructor(app) {
		super(app);
		this.COORD_BOUNDARY = 1000;
	}

	createVertices() {
		super.createVertices();

		this.positions = [
			//x-aksen
			-this.COORD_BOUNDARY, 0.0, 0.0,
			this.COORD_BOUNDARY, 0.0, 0.0,

			//y-aksen:
			0.0, this.COORD_BOUNDARY, 0.0,
			0.0, -this.COORD_BOUNDARY, 0.0,

			//z-aksen:
			0.0, 0.0, this.COORD_BOUNDARY,
			0.0, 0.0, -this.COORD_BOUNDARY,
		];

		this.colors = [
			//ax-aksen:
			1.0, 0.0, 0.0, 1,
			1.0, 0.0, 0.0, 1,
			//y-aksen:
			0.0, 1.0, 0.0, 1,
			0.0, 1.0, 0.0, 1,
			//z-aksen:
			0.0, 0.0, 1.0, 1,
			0.0, 0.0, 1.0, 1
		];
	}

	draw(shaderInfo, elapsed, modelMatrix = new Matrix4()) {
		modelMatrix.setIdentity();
		super.draw(shaderInfo, elapsed, modelMatrix);
		this.gl.drawArrays(this.gl.LINES, 0, this.vertexCount);
	}
}



'use strict';
/**
 * Setter this.positions, this.colors for et rektangel i XZ-planet.
 * Tegnes vha. gl.TRIANGLE_STRIP
 */
import {BaseShape} from './BaseShape.js';

export class XZPlane extends BaseShape {

    constructor(app, width= 40, height= 40, textureUrls=[]) {
        super(app);
        this.width = width;
        this.height = height;
        this.textureUrls = textureUrls;
    }

    createVertices() {
        super.createVertices();

        let width = this.width;
        let height = this.height;

        this.positions = [
            -width / 2, 0, height / 2,
            width / 2, 0, height / 2,
            -width / 2, 0, -height / 2,
            width / 2, 0, -height / 2
        ];

        this.colors = [
            0.3, 0.5, 0.2, 1,
            0.3, 0.5, 0.2, 1,
            0.3, 0.5, 0.2, 1,
            0.3, 0.5, 0.2, 1
        ];

        this.textureCoordinates = [
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ];
    }

    handleKeys(elapsed) {
        // implementeres ved behov
    }

    draw(shaderInfo, elapsed, modelMatrix = (new Matrix4()).setIdentity()) {
        super.draw(shaderInfo, elapsed, modelMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexCount);
    }
}



'use strict';
import {BaseShape} from './BaseShape.js';

/**
 * Setter this.positions, this.colors for en kube.
 * Tegnes vha. gl.LINE_STRIP eller gl.TRIANGLES.
 */
export class Cube extends BaseShape {
    constructor(app, color = {red:0.8, green:0.0, blue:0.6, alpha:1}, wireFrame=false) {
        super(app);
        this.color = color;
        this.wireFrame = wireFrame;
    }

    setPositions() {
        //36 stk posisjoner:
        this.positions = [
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
            1,-1,-1,
            -1,-1,-1,
            1, 1,-1,

            -1,-1,-1,
            -1,1,-1,
            1,1,-1,

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
        this.vertexCount = this.positions/3;
    }

    setColors() {
        //Samme farge på alle sider:
        for (let i = 0; i < 36; i++) {
            this.colors.push(this.color.red, this.color.green, this.color.blue, this.color.alpha);
        }
    }

    handleKeys(elapsed) {
        // implementeres ved behov
    }

    draw(shaderInfo, elapsed, modelMatrix = (new Matrix4()).setIdentity()) {
        super.draw(shaderInfo, elapsed, modelMatrix);
        if (this.wireFrame) {
            this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.vertexCount);
        } else {
            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);
        }
    }
}

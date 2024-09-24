'use strict';
import {BaseShape} from './BaseShape.js';
/**
 * Setter this.positions & this.colors.
 * Tegnes vha. gl.TRIANGLE_FAN
 */
export class Cone extends BaseShape {
    constructor(app, color = {red:0.8, green:0.1, blue:0.6, alpha:1}, sectors=36) {
        super(app);
        this.color = color;
        this.sectors = sectors;
    }

    createVertices() {
        super.createVertices();

        let toPI = 2*Math.PI;
        this.positions = [];	//Tegnes vha. TRIANGLE_FAN
        this.colors = [];
        let stepGrader = 360 / this.sectors;
        let step = (Math.PI / 180) * stepGrader;
        let r=1, g=0, b=0, a=1;

        // Startpunkt:
        let x=0, y=2, z=0;
        this.positions = this.positions.concat(x,y,z); //NB! bruk av concat!!
        this.colors = this.colors.concat(r,g,b,a);
        for (let phi = 0.0; phi <= toPI; phi += step)
        {
            x = Math.cos(phi);
            y = 0;
            z = Math.sin(phi);

            this.positions = this.positions.concat(x,y,z);
            g+=0.1;
            this.colors = this.colors.concat(r,g,b,a);
        }
        this.positions = this.positions.concat(1,0,0); //NB! bruk av concat!!
        this.colors = this.colors.concat(r,g,b,a);
    }

    draw(shaderInfo, elapsed, modelMatrix = (new Matrix4()).setIdentity()) {
        super.draw(shaderInfo, elapsed, modelMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.vertexCount);
    }
}



import m4 from "../resources/m4";
import myMath from "../resources/myMath";
import webglUtils from "../resources/webgl-utils";

const vertex_shader_3d = `
attribute vec4 a_position;
attribute vec4 color;
attribute mat4 matrix;

varying vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = matrix * a_position;

  // Pass the vertex color to the fragment shader.
  v_color = color;
}`;

const fragment_shader_3d = `
precision mediump float;

// Passed in from the vertex shader.
varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}`;

export default function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas: HTMLCanvasElement = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
        return alert('need ANGLE_instanced_arrays');  // eslint-disable-line
    }

    // setup GLSL programs
    // compiles shaders, links program
    const program = webglUtils.createProgramFromStrings(
        gl, [vertex_shader_3d, fragment_shader_3d]);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'color');
    const matrixLoc = gl.getAttribLocation(program, 'matrix');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.1, 0.4,
        -0.1, -0.4,
        0.1, -0.4,
        0.1, -0.4,
        -0.1, 0.4,
        0.1, 0.4,
        0.4, -0.1,
        -0.4, -0.1,
        -0.4, 0.1,
        -0.4, 0.1,
        0.4, -0.1,
        0.4, 0.1,
    ]), gl.STATIC_DRAW);
    const numVertices = 12;

    // setup matrices, one per instance
    const numInstances = 5;
    // make a typed array with one view per matrix
    const matrixData = new Float32Array(numInstances * 16);
    const matrices = [];
    for (let i = 0; i < numInstances; i++) {
        const byteOffsetToMatrix = i * 16 * 4;
        const numFloatsForView = 16;
        matrices.push(new Float32Array(
            matrixData.buffer,
            byteOffsetToMatrix,
            numFloatsForView
        ));
    }

    const matrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);

    // setup colors, one per instance
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([
            1, 0, 0, 1,  // red
            0, 1, 0, 1,  // green
            0, 0, 1, 1,  // blue
            1, 0, 1, 1,  // magenta
            0, 1, 1, 1,  // cyan
        ]),
        gl.STATIC_DRAW);

    function render(time) {
        time *= 0.001; // seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(program);

        // setup the position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(
            positionLoc,  // location
            2,            // size (num values to pull from buffer per iteration)
            gl.FLOAT,     // type of data in buffer
            false,        // normalize
            0,            // stride (0 = compute from size and type above)
            0,            // offset in buffer
        );

        // update all the matrices
        matrices.forEach((mat, ndx) => {
            m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
            m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);
        });

        // upload the new matrix data
        gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

        // set all 4 attributes for matrix
        const bytesPerMatrix = 4 * 16;
        for (let i = 0; i < 4; ++i) {
            const loc = matrixLoc + i;
            gl.enableVertexAttribArray(loc);
            // note the stride and offset
            const offset = i * 16;  // 4 floats per row, 4 bytes per float
            gl.vertexAttribPointer(
                loc,              // location
                4,                // size (num values to pull from buffer per iteration)
                gl.FLOAT,         // type of data in buffer
                false,            // normalize
                bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
                offset,           // offset in buffer
            );
            // this line says this attribute only changes for each 1 instance
            ext.vertexAttribDivisorANGLE(loc, 1);
        }

        // set attribute for color
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
        // this line says this attribute only changes for each 1 instance
        ext.vertexAttribDivisorANGLE(colorLoc, 1);

        ext.drawArraysInstancedANGLE(
            gl.TRIANGLES,
            0,             // offset
            numVertices,   // num vertices per instance
            numInstances,  // num instances
        );

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
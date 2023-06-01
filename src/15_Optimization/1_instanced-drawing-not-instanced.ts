import m4 from "../resources/m4";
import myMath from "../resources/myMath";
import webglUtils from "../resources/webgl-utils";

const vertex_shader_3d = `
attribute vec4 a_position;
uniform mat4 matrix;

void main() {
  // Multiply the position by the matrix.
  gl_Position = matrix * a_position;
}`;

const fragment_shader_3d = `
precision mediump float;

uniform vec4 color;

void main() {
  gl_FragColor = color;
}`;

export default function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
  
    // setup GLSL programs
    // compiles shaders, links program
    const program = webglUtils.createProgramFromStrings(
        gl, [vertex_shader_3d, fragment_shader_3d]);
  
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getUniformLocation(program, 'color');
    const matrixLoc = gl.getUniformLocation(program, 'matrix');
  
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
  
    const numInstances = 5;
    const matrices = [
        m4.identity(),
        m4.identity(),
        m4.identity(),
        m4.identity(),
        m4.identity(),
    ];
  
    const colors = [
        [1, 0, 0, 1,],  // red
        [0, 1, 0, 1,],  // green
        [0, 0, 1, 1,],  // blue
        [1, 0, 1, 1,],  // magenta
        [0, 1, 1, 1,],  // cyan
    ];
  
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
  
        matrices.forEach((mat, ndx) => {
            m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
            m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);
  
            const color = colors[ndx];
  
            gl.uniform4fv(colorLoc, color);
            gl.uniformMatrix4fv(matrixLoc, false, mat);
  
            gl.drawArrays(
                gl.TRIANGLES,
                0,             // offset
                numVertices,   // num vertices per instance
            );
        });
  
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
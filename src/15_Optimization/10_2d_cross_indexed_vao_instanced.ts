import m4 from "../resources/m4";
import myMath from "../resources/myMath";
import webglUtils from "../resources/webgl-utils";

const vertex_shader_2d = `
attribute vec4 a_position;
attribute vec4 a_color;
attribute mat4 a_matrix;

varying vec4 v_color;

// uniform vec2 u_resolution;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
//    vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
//    vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
//    vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = a_matrix * a_position;
   v_color = a_color;
}`;

const fragment_shader_2d = `
precision mediump float;

varying vec4 v_color;

void main() {
   gl_FragColor = v_color;
}`;

export default function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas: HTMLCanvasElement = document.querySelector('#canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const ext_vao = gl.getExtension('OES_vertex_array_object');
    if (!ext_vao) {
        return alert('need OES_vertex_array_object');  // eslint-disable-line
    }

    const ext_instanced = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext_instanced) {
        return alert('need ANGLE_instanced_arrays');  // eslint-disable-line
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromStrings(gl, [vertex_shader_2d, fragment_shader_2d]);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var matrixAttributeLocation = gl.getAttribLocation(program, "a_matrix");
    var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

    const vao = ext_vao.createVertexArrayOES();
    ext_vao.bindVertexArrayOES(vao);

    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.1,  0.4,
        -0.1, -0.4,
         0.1, -0.4,
         0.1,  0.4,
         0.4, -0.1,
        -0.4, -0.1,
        -0.4,  0.1,
         0.4,  0.1,
    ]), gl.STATIC_DRAW);

    // create the buffer
    const indexBuffer = gl.createBuffer();

    // make this buffer the current 'ELEMENT_ARRAY_BUFFER'
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Fill the current element array buffer with data
    const indices = [
        0, 1, 2,
        0, 2, 3,
        4, 6, 5,
        4, 7, 6

        // 0, 1, 2,   // first triangle
        // 2, 1, 3,   // second triangle
    ];
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );

    // code above this line is initialization code
    // --------------------------------
    // code below this line is rendering code

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    // bind the buffer containing the indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // setup matrixes, one per instance
    const numInstances = 5;
    // make a typed array with one view per matrix
    const matrixData = new Float32Array(numInstances * 16);
    const matrices = [];
    for (let i = 0; i < numInstances; ++i) {
        const byteOffsetToMatrix = i * 16 * 4;
        const numFloatsForView = 16;
        matrices.push(new Float32Array(
            matrixData.buffer,
            byteOffsetToMatrix,
            numFloatsForView));
    }

    const matrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.STATIC_DRAW);
    // set all 4 attributes for matrix
    const bytesPerMatrix = 4 * 16;//这里的4是每个float4字节，16是16个数
    for (let i = 0; i < 4; ++i) {//4行
        const loc = matrixAttributeLocation + i;
        gl.enableVertexAttribArray(loc);
        // note the stride and offset
        const offset = i * 4 * 4;  // 4 floats per row, 4 bytes per float
        gl.vertexAttribPointer(
            loc,              // location
            4,                // size (num values to pull from buffer per iteration)
            gl.FLOAT,         // type of data in buffer
            false,            // normalize
            bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
            offset,           // offset in buffer
        );
        // this line says this attribute only changes for each 1 instance
        ext_instanced.vertexAttribDivisorANGLE(loc, 1);
    }
    matrices.forEach((mat, ndx) => {
        m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
    });

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

    // set attribute for color
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
    // this line says this attribute only changes for each 1 instance
    ext_instanced.vertexAttribDivisorANGLE(colorAttributeLocation, 1);

    ext_vao.bindVertexArrayOES(vao);

    // upload the new matrix data
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

    // Draw the rectangle.
    const numVertices = 12;
    ext_instanced.drawElementsInstancedANGLE(
        gl.TRIANGLES,
        numVertices,
        gl.UNSIGNED_SHORT,
        0,
        numInstances
    )
}
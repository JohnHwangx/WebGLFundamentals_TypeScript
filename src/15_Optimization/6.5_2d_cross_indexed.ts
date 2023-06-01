import m4 from "../resources/m4";
import myMath from "../resources/myMath";
import webglUtils from "../resources/webgl-utils";

const vertex_shader_2d = `
attribute vec2 a_position;

// uniform vec2 u_resolution;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
//    vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
//    vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
//    vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(a_position, 0, 1);
}`;

const fragment_shader_2d = `
precision mediump float;

uniform vec4 u_color;

void main() {
   gl_FragColor = u_color;
}`;

export default function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas: HTMLCanvasElement = document.querySelector('#canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromStrings(gl, [vertex_shader_2d, fragment_shader_2d]);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // look up uniform locations
    // var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    var colorUniformLocation = gl.getUniformLocation(program, "u_color");

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

    // set the resolution
    // gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // draw 50 random rectangles in random colors
    // for (var ii = 0; ii < 50; ++ii) {
    //     // Setup a random rectangle
    //     // This will write to positionBuffer because
    //     // its the last thing we bound on the ARRAY_BUFFER
    //     // bind point
    //     setRectangle(
    //         gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

    //     // Set a random color.
    //     gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

    //     // Draw the rectangle.
    //     var primitiveType = gl.TRIANGLES;
    //     var offset = 0;
    //     var count = 6;
    //     var indexType = gl.UNSIGNED_SHORT;
    //     gl.drawElements(primitiveType, count, indexType, offset);
    // }

    // Set a random color.
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 12;
    var indexType = gl.UNSIGNED_SHORT;
    gl.drawElements(primitiveType, count, indexType, offset);
}

// Returns a random integer from 0 to range - 1.
function randomInt(range: number) {
    return Math.floor(Math.random() * range);
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x2, y2,
    ]), gl.STATIC_DRAW);
}
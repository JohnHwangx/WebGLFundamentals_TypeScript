import webglUtils from "../resources/webgl-utils";

const vertex_shader_2d = `
attribute vec2 a_position;
uniform vec2 u_resolution;

void main(){
    vec2 zeroToOne=a_position/u_resolution;
    vec2 zeroToTwo = zeroToOne*2.0;
    vec2 clipSpace = zeroToTwo -1.0;

    gl_Position = vec4(clipSpace * vec2(1,-1), 0, 1);
}`
const fragment_shader_2d = `
precision mediump float;

uniform vec4 u_color;
void main(){
    gl_FragColor = u_color;
}`

export default function main(){
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
    let program = webglUtils.createProgramFromStrings(gl, [vertex_shader_2d, fragment_shader_2d]);
    let positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    let resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    let colorUniformLocation = gl.getUniformLocation(program, 'u_color');

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    for (var ii = 0; ii < 50; ii++){
        
        setRectangle(gl, randomInt(300), randomInt(300), randomInt(400), randomInt(400));

        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1)
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

function randomInt(range: number) {
    return Math.floor(Math.random() * range);
}

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    /*x1y2 x1y2----x2y2
        | \          |
        |    \       |
      x1y1----x2y1 x2y1*/
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}
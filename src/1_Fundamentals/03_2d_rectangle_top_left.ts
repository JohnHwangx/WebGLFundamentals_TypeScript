import webglUtils from "../resources/webgl-utils";

const vertex_shader_2d = `
attribute vec4 a_position;

uniform vec2 u_resolution;

void main(){
    vec2 zeroToOne = a_position.xy / u_resolution;
    vec2 zeroToTwo = zeroToOne*2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    // 翻转y轴, 使起点在左上角
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}`;
const fragment_shader_2d = `
precision mediump float;

void main(){
    gl_FragColor = vec4(1.0, 0, 0.5, 1);
}`

export default function main(){
    let canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
    let program = webglUtils.createProgramFromStrings(gl, [vertex_shader_2d, fragment_shader_2d]);
    let positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    let resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');

    let positionbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
    var positions = [
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionbuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
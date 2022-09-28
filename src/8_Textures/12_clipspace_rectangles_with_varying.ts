import webglUtils from "../resources/webgl-utils";

const vertexShader2d = `
attribute vec4 a_position;
attribute float a_brightness;

varying float v_brightness;

void main(){
    gl_Position = a_position;
    v_brightness = a_brightness;
}`;

const fragmentShader2d = `
precision mediump float;

varying float v_brightness;

void main(){
    gl_FragColor = vec4(v_brightness, 0, 0, 1);
}`;

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
    const program = webglUtils.createProgramFromStrings(gl, [vertexShader2d, fragmentShader2d]);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const brightnessLocation = gl.getAttribLocation(program, 'a_brightness');
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    let positions = [
        -.8, .2, 0, 1,  // 1nd rect 1st triangle
        .8, .2, 0, 1,
        -.8, .8, 0, 1,
        -.8, .8, 0, 1,  // 1nd rect 2nd triangle
        .8, .2, 0, 1,
        .8, .8, 0, 1,

        -.8, -.8, 0, 1,  // 2st rect 1st triangle
        .8, -.8, 0, 1,
        -.8, -.2, 0, 1,
        -.8, -.2, 0, 1,  // 2st rect 2nd triangle
        .8, -.8, 0, 1,
        .8, -.2, 0, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    let brightnessBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);
    let brightness = [
        0, 1, 0,// 第一个矩形的第一个三角形
        0, 1, 1,// 第一个矩形的第二个三角形
        0, 1, 0,// 第二个矩形的第一个三角形
        0, 1, 1,// 第二个矩形的第二个三角形
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brightness), gl.STATIC_DRAW);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(brightnessLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);
    gl.vertexAttribPointer(brightnessLocation, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 4 * 3);
}
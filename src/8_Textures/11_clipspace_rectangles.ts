import webglUtils from "../resources/webgl-utils";

const vertexShader2d = `
attribute vec4 a_position;

void main(){
    gl_Position = a_position;
}`;

const fragmentShader3d = `
precision mediump float;

void main(){
    gl_FragColor = vec4(1, 0, 0.5, 1);
}`;

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const program = webglUtils.createProgramFromStrings(gl, [vertexShader2d, fragmentShader3d]);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    let positions = [
        -.8, .8, 0, 1,  // 第一个矩形的第一个三角形
        .8, .8, 0, 1,
        -.8, .2, 0, 1,
        -.8, .2, 0, 1,  // 第一个矩形的第二个三角形
        .8, .8, 0, 1,
        .8, .2, 0, 1,
  
        -.8, -.2, 0, 1,  // 第二个矩形的第一个三角形
        .8, -.2, 0, 1,
        -.8, -.8, 0, 1,
        -.8, -.8, 0, 1,  // 第二个矩形的第二个三角形
        .8, -.2, 0, 1,
        .8, -.8, 0, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 4 * 3);
}
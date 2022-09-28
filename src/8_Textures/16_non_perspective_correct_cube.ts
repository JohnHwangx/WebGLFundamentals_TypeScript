import m4 from "../resources/m4";
import myMath from "../resources/myMath";
import webglUtils from "../resources/webgl-utils";

const vertexShader3d = `
attribute vec4 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_matrix;

varying vec2 v_texCoord;

void main(){
    gl_Position = u_matrix * a_position;

    gl_Position /= gl_Position.w;

    v_texCoord = a_texCoord;
}`;

const fragmentShader3d = `
precision mediump float;

varying vec2 v_texCoord;

uniform sampler2D u_texture;

void main(){
    gl_FragColor = texture2D(u_texture, v_texCoord);
}`

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const program = webglUtils.createProgramFromStrings(gl, [vertexShader3d, fragmentShader3d]);
    let positionLocation = gl.getAttribLocation(program, 'a_position');
    let texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    let texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    setTexCoords(gl);

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 4, 4, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([
        255, 128, 255, 128,
        128, 255, 128, 255,
        255, 128, 255, 128,
        128, 255, 128, 255,
    ]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    let fieldOfViewRadians = myMath.degToRad(60);
    let modelXRotationRadians = myMath.degToRad(0);
    let modelYRotationRadians = myMath.degToRad(0);

    let matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    let textureLocation = gl.getUniformLocation(program, 'u_texture');

    let then = 0;

    requestAnimationFrame(drawScene);

    function drawScene(time: number) {
        time *= 0.001;
        let deltaTime = time - then;
        then = time;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        modelXRotationRadians += 0.7 * deltaTime;
        modelYRotationRadians += -0.4 * deltaTime;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        let cameraPosition = [0, 0, 2];
        let up = [0, 1, 0];
        let target = [0, 0, 0];

        let cameraMatrix = m4.lookAt(cameraPosition, target, up);
        let viewMatrix = m4.inverse(cameraMatrix);

        let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
        let matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
        matrix = m4.yRotate(matrix, modelYRotationRadians);

        gl.uniformMatrix4fv(matrixLocation,false,matrix);
        gl.uniform1i(textureLocation, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);

        requestAnimationFrame(drawScene);
    }
}

function setGeometry(gl:WebGLRenderingContext) {
    let positons = new Float32Array([
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,

        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,

        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,

        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positons, gl.STATIC_DRAW);
}

function setTexCoords(gl: WebGLRenderingContext) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            0, 1,
            1, 1,
            1, 0,

            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,

            0, 0,
            0, 1,
            1, 0,
            0, 1,
            1, 1,
            1, 0,

            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,

            0, 0,
            0, 1,
            1, 0,
            0, 1,
            1, 1,
            1, 0,

            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ]),
        gl.STATIC_DRAW);
}
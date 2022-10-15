import { webgl_08_01_3d_textures } from "../index";
import m4 from "../resources/m4";
import myMath from "../resources/myMath";
import webglUtils from "../resources/webgl-utils";

const vertex_shader_3d = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;
varying vec2 v_texcoord;

void main(){
    gl_Position =u_matrix * a_position;

    v_texcoord  =a_texcoord;
}`;

const fragment_shader_3d = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform vec4 u_colorMult;

void main(){
    gl_FragColor = texture2D(u_texture, v_texcoord)* u_colorMult;
}`;

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    let program = webglUtils.createProgramFromStrings(gl, [vertex_shader_3d, fragment_shader_3d]);

    let positionLocation = gl.getAttribLocation(program, 'a_position');
    let texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');
    let matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    let textureLocation = gl.getUniformLocation(program, 'u_texture');
    let colorMultLocation = gl.getUniformLocation(program, 'u_colorMult');

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    let texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    setTexcoords(gl);

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 3, 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE,
            new Uint8Array([
                128, 64, 128,
                0, 192, 0
            ]));
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    const targetTextureWidth = 256;
    const targetTextureHeight = 256;
    const targettexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targettexture);

    {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, targetTextureWidth, targetTextureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
    }
    
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targettexture, 0);

    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    let fieldOfViewRadians = myMath.degToRad(60);
    let modelXRotationRadians = myMath.degToRad(0);
    let modelYRotationRadians = myMath.degToRad(0);

    let then = 0;

    requestAnimationFrame(drawScene);

    function drawCube(aspect: number) {
        gl.useProgram(program);

        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        let cameraPostion = [0, 0, 2];
        let up = [0, 1, 0];
        let target = [0, 0, 0];

        let cameraMatrix = m4.lookAt(cameraPostion, target, up);
        let viewMatrix = m4.inverse(cameraMatrix);

        let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        for (let x = -1; x <= 1; ++x){
            let matrix = m4.translate(viewProjectionMatrix, x * .9, 0, 0);
            matrix = m4.xRotate(matrix, modelXRotationRadians*x);
            matrix = m4.yRotate(matrix, modelYRotationRadians*x);

            gl.uniformMatrix4fv(matrixLocation, false, matrix);
            gl.uniform1i(textureLocation, 0);

            const c = x * .5 + .5;// 0 / 0.5 /1
            gl.uniform4fv(colorMultLocation, [c, 1, 1 - c, 1]);

            gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
        }

    }

    function drawScene(time: number) {
        time *= 0.001;
        let deltaTime = time - then;
        then = time;

        modelXRotationRadians += -0.7 * deltaTime;
        modelYRotationRadians += -0.4 * deltaTime;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

            gl.clearColor(.5, .7, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const aspect = targetTextureWidth / targetTextureHeight;
            drawCube(aspect);
        }

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, targettexture);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
            drawCube(aspect);
        }

        requestAnimationFrame(drawScene);
    }
}

function setGeometry(gl:WebGLRenderingContext) {
    var positions = new Float32Array(
        [
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
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with texture coordinates the cube.
function setTexcoords(gl:WebGLRenderingContext) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(
            [
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
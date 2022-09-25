import { webgl_01_fundamental } from "../index";
import m4 from "../resources/m4";
import webglUtils from "../resources/webgl-utils";

const vertexShader3d = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main(){
    gl_Position = u_matrix * a_position;

    v_texcoord = a_texcoord;
}`;

const fragmentVertex3d = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main(){
    gl_FragColor = texture2D(u_texture,v_texcoord);
}`;

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const program = webglUtils.createProgramFromStrings(gl, [vertexShader3d, fragmentVertex3d]);

    const positionLocation = gl.getAttribLocation(program,'a_position');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    const textureLocation = gl.getUniformLocation(program, 'u_texture');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    setTexcoord(gl);

    let allocateFBTexture = true;
    let framebufferWidth;
    let framebufferheight;
    let framebuffer = gl.createFramebuffer();
    let fbTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fbTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture, 0);

    let textrue = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textrue);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    let image = new Image();
    image.src = './resources/images/mip-low-res-example.png';
    image.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, textrue);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    })

    let isPowerOf2 = (value:number) => {
        return (value & (value - 1)) === 0;
    }

    let radToDeg = (r: number) => {
        return r * 180 / Math.PI;
    }
    let degToRad = (d: number) => {
        return d * Math.PI / 180;
    }

    let fieldOfViewRadians = degToRad(60);
    let modelXRotationRadians = degToRad(0);
    let modelYRotationRadians = degToRad(0);

    requestAnimationFrame(drawScene);

    function drawScene(time:number) {
        time *= 0.001;

        if (webglUtils.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio) || allocateFBTexture) {
            allocateFBTexture = false;
            framebufferWidth = gl.canvas.clientWidth / 4;
            framebufferheight = gl.canvas.clientHeight / 4;
            gl.bindTexture(gl.TEXTURE_2D, fbTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebufferWidth, framebufferheight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, framebufferWidth, framebufferheight);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let zNear = 1;
        let zFar = 2000;
        let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        
        let cameraPosition = [0, 0, 3];
        let up = [0, 1, 0];
        let target = [0, 0, 0];

        let cameraMatrix = m4.lookAt(cameraPosition, target, up);
        let viewMatrix = m4.inverse(cameraMatrix);

        let settings = [
            { x: -1, y: -3, z: -30, filter: gl.NEAREST, },
            { x: 0, y: -3, z: -30, filter: gl.LINEAR, },
            { x: 1, y: -3, z: -30, filter: gl.NEAREST_MIPMAP_LINEAR, },
            { x: -1, y: -1, z: -10, filter: gl.NEAREST, },
            { x: 0, y: -1, z: -10, filter: gl.LINEAR, },
            { x: 1, y: -1, z: -10, filter: gl.NEAREST_MIPMAP_LINEAR, },
            { x: -1, y: 1, z: 0, filter: gl.NEAREST, },
            { x: 0, y: 1, z: 0, filter: gl.LINEAR, },
            { x: 1, y: 1, z: 0, filter: gl.LINEAR_MIPMAP_NEAREST, },
        ];

        let xSpacing = 1.2;
        let ySpacing = 0.7;
        let zDistance = 30;
        settings.forEach((s) => {
            let z = -5 + s.z;
            let r = Math.abs(z) * Math.sin(fieldOfViewRadians * 0.5);
            let x = Math.sin(time * 0.2) * r;
            let y = Math.cos(time * 0.2) * r * 0.5;
            let r2 = 1 + r * 0.2;

            gl.bindTexture(gl.TEXTURE_2D, textrue);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, s.filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            let matrixX = x + s.x * xSpacing * r2;
            let matrixY = y + s.y * ySpacing * r2;
            let matrix = m4.translate(projectionMatrix, matrixX, matrixY, z);

            gl.uniformMatrix4fv(matrixLocation, false, matrix);
            gl.uniform1i(textureLocation, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
        });


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture);
        gl.uniformMatrix4fv(matrixLocation, false, [
            2, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
        requestAnimationFrame(drawScene);
    }
}

function setGeometry(gl:WebGLRenderingContext) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
    ]), gl.STATIC_DRAW);
}

function setTexcoord(gl:WebGLRenderingContext) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
    ]), gl.STATIC_DRAW);
}
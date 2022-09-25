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
const fragmentShader3d = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main(){
    gl_FragColor = texture2D(u_texture, v_texcoord);
}`;

let zDepth = 50;

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const program = webglUtils.createProgramFromStrings(gl, [vertexShader3d, fragmentShader3d]);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    const textureLocation = gl.getUniformLocation(program, 'u_texture');

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    let texcoordBUffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBUffer);
    setTexcoord(gl);

    let mipTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, mipTexture);
    let c = document.createElement('canvas');
    let ctx = c.getContext('2d');
    let mips = [
        { size: 64, color: "rgb(128,0,255)", },
        { size: 32, color: "rgb(0,0,255)", },
        { size: 16, color: "rgb(255,0,0)", },
        { size: 8, color: "rgb(255,255,0)", },
        { size: 4, color: "rgb(0,255,0)", },
        { size: 2, color: "rgb(0,255,255)", },
        { size: 1, color: "rgb(255,0,255)", },
    ];
    mips.forEach((s, level) => {
        let size = s.size;
        c.width = size;
        c.height = size;
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = s.color;
        ctx.fillRect(0, 0, size / 2, size / 2);
        ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
        gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    });

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    let image = new Image();
    image.src = './resources/images/mip-low-res-example.png';
    image.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        drawScene();
    });

    let textures = [texture, mipTexture];
    let textureIndex = 0;

    document.body.addEventListener('click', () => {
        textureIndex = (textureIndex + 1) % textures.length;
        drawScene();
    })

    let isPowerOf2 = (value: number) => {
        return (value & (value - 1)) === 0;
    }
    let degToRad = (d: number) => {
        return d * Math.PI / 180;
    }

    let fieldOfViewRadians = degToRad(60);
    drawScene();

    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBUffer);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let zNear = 1;
        let zFar = 2000;
        let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        let cameraPosition = [0, 0, 2];
        let up = [0, 1, 0];
        let target = [0, 0, 0];

        let cameraMatrix = m4.lookAt(cameraPosition, target, up);
        let viewMatrix = m4.inverse(cameraMatrix);
        let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        let settings = [
            { x: -1, y: 1, zRot: 0, magFilter: gl.NEAREST, minFilter: gl.NEAREST, },
            { x: 0, y: 1, zRot: 0, magFilter: gl.LINEAR, minFilter: gl.LINEAR, },
            { x: 1, y: 1, zRot: 0, magFilter: gl.LINEAR, minFilter: gl.NEAREST_MIPMAP_NEAREST, },
            { x: -1, y: -1, zRot: 1, magFilter: gl.LINEAR, minFilter: gl.LINEAR_MIPMAP_NEAREST, },
            { x: 0, y: -1, zRot: 1, magFilter: gl.LINEAR, minFilter: gl.NEAREST_MIPMAP_LINEAR, },
            { x: 1, y: -1, zRot: 1, magFilter: gl.LINEAR, minFilter: gl.LINEAR_MIPMAP_LINEAR, },
        ];

        let xSpacing = 1.2;
        let ySpacing = 0.7;

        settings.forEach((s) => {
            gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, s.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, s.magFilter);

            let matrixX = s.x * xSpacing
            let matrixY = s.y * ySpacing;
            let matrixZ = -zDepth * 0.5;
            let matrix = m4.translate(viewProjectionMatrix, matrixX, matrixY, matrixZ);
            matrix = m4.zRotate(matrix, s.zRot * Math.PI);
            matrix = m4.scale(matrix, 1, 1, zDepth);

            gl.uniformMatrix4fv(matrixLocation, false, matrix);
            gl.uniform1i(textureLocation, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
        })
    }
}

function setTexcoord(gl: WebGLRenderingContext) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        1, 0,
        0, zDepth,
        0, zDepth,
        1, 0,
        1, zDepth,
    ]),gl.STATIC_DRAW);
}

function setGeometry(gl: WebGLRenderingContext) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
    ]), gl.STATIC_DRAW);
}
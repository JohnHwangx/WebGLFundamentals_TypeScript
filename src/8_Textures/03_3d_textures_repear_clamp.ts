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
}`

const fragmentShader3d = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main(){
    gl_FragColor = texture2D(u_texture, v_texcoord);
}`

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

    let texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    setTexcoords(gl);

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    let image = new Image();
    image.src = './resources/images/f-texture.png';
    image.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        drawScene();
    });

    let wrapS = gl.REPEAT;
    let wrapT = gl.REPEAT;

    document.querySelector('#wrap_s0').addEventListener('click', () => {
        wrapS = gl.REPEAT; drawScene();
    });
    document.querySelector('#wrap_s1').addEventListener('click', () => {
        wrapS = gl.CLAMP_TO_EDGE; drawScene();
    });
    document.querySelector('#wrap_s2').addEventListener('click', () => {
        wrapS = gl.MIRRORED_REPEAT; drawScene();
    });
    document.querySelector('#wrap_t0').addEventListener('click', () => {
        wrapT = gl.REPEAT; drawScene();
    });
    document.querySelector('#wrap_t1').addEventListener('click', () => {
        wrapT = gl.CLAMP_TO_EDGE; drawScene();
    });
    document.querySelector('#wrap_t2').addEventListener('click', () => {
        wrapT = gl.MIRRORED_REPEAT; drawScene();
    });

    let isPowerOf2 = (value: number) => {
        return (value & (value - 1)) === 0;
    }

    let degToRad=(d: number)=>{
        return d * Math.PI / 180;
    }
    let gridContainer = document.getElementById('gridContainer');

    let fieldOfViewInRadians = degToRad(60);
    drawScene();


    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        let scaleFactor = 2.5;
        let tsize = 80 * scaleFactor;
        let x = gl.canvas.clientWidth / 2 - tsize / 2;
        let y = gl.canvas.clientHeight / 2 - tsize - 60;

        gridContainer.style.left = (x - 50 * scaleFactor) + 'px';
        gridContainer.style.top = (y - 50 * scaleFactor) + 'px';
        gridContainer.style.width = (400 * scaleFactor) + 'px';
        gridContainer.style.height = (300 * scaleFactor) + 'px';

        gl.useProgram(program);
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        let projectionMatrix = m4.orthographic(0, gl.canvas.clientWidth, gl.canvas.height, 0, -1, 1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

        let matrix = m4.translate(projectionMatrix, x, y, 0);
        matrix = m4.scale(matrix, tsize, tsize, 1);
        matrix = m4.translate(matrix, 0.5, 0.5, 0);

        gl.uniformMatrix4fv(matrixLocation, false, matrix);
        gl.uniform1i(textureLocation, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
    }
}

function setGeometry(gl: WebGLRenderingContext) {
    let positions = new Float32Array([
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setTexcoords(gl: WebGLRenderingContext) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -3, -1,
        2, -1,
        -3, 4,
        -3, 4,
        2, -1,
        2, 4,
    ]), gl.STATIC_DRAW);
}
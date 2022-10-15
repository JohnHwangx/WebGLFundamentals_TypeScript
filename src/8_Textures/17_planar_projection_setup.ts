import primitives from "../resources/primitives";
import webglUtils from "../resources/webgl-utils";
import webglLessonsUI from '../resources/webgl-lessons-ui'
import m4, { Matrix4 } from "../resources/m4";
import myMath from "../resources/myMath";

const vertexShader3d = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec2 v_texcoord;

void main(){
    gl_Position= u_projection * u_view * u_world * a_position;
    v_texcoord = a_texcoord;
}`;

const fragmentShader3d = `
precision mediump float;

varying vec2 v_texcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;

void main(){
    gl_FragColor = texture2D(u_texture, v_texcoord) * u_colorMult;
}`

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const textureProgramInfo = webglUtils.createProgramInfo(gl, [vertexShader3d, fragmentShader3d]);
    const sphereBufferInfo = primitives.createSphereBufferInfo(
        gl,
        1,  // radius
        12, // subdivisions around
        6,  // subdivisions down
    );

    const planBufferInfo = primitives.createPlaneBufferInfo(
        gl,
        20,  // width
        20,  // height
        1,   // subdivisions across
        1,   // subdivisions down
    );

    const checkerboardTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
    ]));
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const setting = {
        cameraX: 2.75,
        cameraY: 5
    };

    webglLessonsUI.setupUI(document.querySelector('#ui'), setting, [
        { type: 'slider', key: 'cameraX', min: -10, max: 10, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'cameraY', min: 1, max: 20, change: render, precision: 2, step: 0.001, },
    ]);

    const fieldOfViewRadians = myMath.degToRad(60);

    const planeUniforms = {
        u_colorMult: [0.5, 0.5, 1, 1],
        u_texture: checkerboardTexture,
        u_world: m4.translation(0, 0, 0),
    }

    const sphereUniforms = {
        u_colorMult: [1, 0.5, 0.5, 1],
        u_texture: checkerboardTexture,
        u_world: m4.translation(2, 3, 4)
    };

    function drawScene(projectionMatrix: Matrix4, cameraMatrix: Matrix4) {
        const viewMatrix = m4.inverse(cameraMatrix);
        gl.useProgram(textureProgramInfo.program);

        webglUtils.setUniforms(textureProgramInfo, {
            u_view: viewMatrix,
            u_projection: projectionMatrix
        });

        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);
        webglUtils.setUniforms(textureProgramInfo, sphereUniforms);
        webglUtils.drawBufferInfo(gl, sphereBufferInfo);
        
        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planBufferInfo);
        webglUtils.setUniforms(textureProgramInfo, planeUniforms);
        webglUtils.drawBufferInfo(gl, planBufferInfo);
    }

    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        const cameraPosition = [setting.cameraX, setting.cameraY, 7];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        drawScene(projectionMatrix, cameraMatrix);
    }

    render();
}
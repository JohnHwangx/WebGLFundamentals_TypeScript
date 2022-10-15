import m4, { Matrix4 } from "../resources/m4";
import myMath from "../resources/myMath";
import primitives from "../resources/primitives";
import webglLessonsUi from "../resources/webgl-lessons-ui";
import webglUtils from "../resources/webgl-utils";

const vertexShader3d = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;

void main(){
    vec4 worldPosition = u_world * a_position;
    gl_Position = u_projection* u_view * worldPosition;

    v_texcoord = a_texcoord;

    v_projectedTexcoord = u_textureMatrix * worldPosition;
}`;

const fragmentShader3d = `
precision mediump float;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;

void main() {
    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    bool inRange = 
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x <= 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y <= 1.0;
    vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
    vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
    float projectedAmount  = inRange ? 1.0 : 0.0;
    gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}`;

const colorVertexShader = `
attribute vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main(){
    gl_Position = u_projection * u_view * u_world * a_position;
}`;

const colorFragmentShader = `
precision mediump float;

uniform vec4 u_color;

void main(){
    gl_FragColor = u_color;
}`;

export default function main() {
    const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const textureProgramInfo = webglUtils.createProgramInfo(gl, [vertexShader3d, fragmentShader3d]);
    const colorProgramInfo = webglUtils.createProgramInfo(gl, [colorVertexShader, colorFragmentShader]);

    const sphereBufferInfo = primitives.createSphereBufferInfo(gl, 1, 12, 6);
    const planeBufferInfo = primitives.createPlaneBufferInfo(gl, 20, 20, 1, 1);

    const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
        position: [
            0, 0, -1,
            1, 0, -1,
            0, 1, -1,
            1, 1, -1,
            0, 0, 1,
            1, 0, 1,
            0, 1, 1,
            1, 1, 1,
        ],
        indices: [
            0, 1,
            1, 3,
            3, 2,
            2, 0,

            4, 5,
            5, 7,
            7, 6,
            6, 4,

            0, 4,
            1, 5,
            3, 7,
            2, 6,
        ]
    });

    const checkerboardTexure = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkerboardTexure);
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

    function loadImageTexture(url: string) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));
        const image = new Image();
        image.src = url;
        image.addEventListener('load', () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            render();
        })
        return texture;
    }

    const imageTexture = loadImageTexture('../resources/images/f-texture.png');

    const settings = {
        cameraX: 2.75,
        cameraY: 5,
        posX: 3.5,
        posY: 4.4,
        posZ: 4.7,
        targetX: 0.8,
        targetY: 0,
        targetZ: 4.7,
        projWidth: 1,
        projHeight: 1,
        perspective: true,
        fieldOfView: 45
    };

    webglLessonsUi.setupUI(document.querySelector('#ui'), settings, [
        { type: 'slider', key: 'cameraX', min: -10, max: 10, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'cameraY', min: 1, max: 20, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'posX', min: -10, max: 10, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'posY', min: 1, max: 20, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'posZ', min: 1, max: 20, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'targetX', min: -10, max: 10, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'targetY', min: 0, max: 20, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'targetZ', min: -10, max: 20, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'projWidth', min: 0, max: 10, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'projHeight', min: 0, max: 10, change: render, precision: 2, step: 0.001, },
        { type: 'checkbox', key: 'perspective', change: render },
        { type: 'slider', key: 'fieldOfView', min: 1, max: 179, change: render, },
    ]);

    const fieldOfViewRadians = myMath.degToRad(60);

    const planeUniforms = {
        u_colorMult: [0.5, 0.5, 1, 1],
        u_texture: checkerboardTexure,
        u_world: m4.translation(0, 0, 0),
    };
    const sphereUniforms = {
        u_colorMult: [1, 0.5, 0.5, 1],
        u_texture: checkerboardTexure,
        u_world: m4.translation(2, 3, 4)
    };

    function drawScene(projectionMatrix: Matrix4, cameraMatrix: Matrix4) {
        const viewMatrix = m4.inverse(cameraMatrix);

        let textureWorldMatrix = m4.lookAt(
            [settings.posX, settings.posY, settings.posZ],
            [settings.targetX, settings.targetY, settings.targetZ],
            [0, 1, 0]
        );

        // textureWorldMatrix = m4.scale(
        //     textureWorldMatrix,
        //     settings.projWidth, settings.projHeight, 1
        // );

        const textureProjectionMatrix = settings.perspective
            ? m4.perspective(
                myMath.degToRad(settings.fieldOfView),
                settings.projWidth / settings.projHeight,
                0.1,
                200
            )
            : m4.orthographic(
                -settings.projWidth / 2,
                settings.projWidth / 2,
                -settings.projHeight / 2,
                settings.projHeight / 2,
                0.1,
                200
            );           

        // const textureMatrix = m4.inverse(textureWorldMatrix);
        const textureMatrix = m4.multiply(
            textureProjectionMatrix,
            m4.inverse(textureWorldMatrix));

        gl.useProgram(textureProgramInfo.program);

        webglUtils.setUniforms(textureProgramInfo, {
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_textureMatrix: textureMatrix,
            u_projectedTexture: imageTexture
        });

        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);
        webglUtils.setUniforms(textureProgramInfo, sphereUniforms);
        webglUtils.drawBufferInfo(gl, sphereBufferInfo);

        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);
        webglUtils.setUniforms(textureProgramInfo, planeUniforms);
        webglUtils.drawBufferInfo(gl, planeBufferInfo);

        gl.useProgram(colorProgramInfo.program);
        webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);
        // const mat = m4.scale(textureWorldMatrix, 1, 1, 1000);
        const mat = m4.multiply(
            textureWorldMatrix, m4.inverse(textureProjectionMatrix)
        );

        webglUtils.setUniforms(colorProgramInfo, {
            u_color: [0, 0, 0, 1],
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_world: mat
        });

        webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
    }

    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        const cameraPosition = [settings.cameraX, settings.cameraY, 7];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        drawScene(projectionMatrix, cameraMatrix);
    }

    render();
}
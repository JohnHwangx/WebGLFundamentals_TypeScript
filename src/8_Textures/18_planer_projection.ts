import primitives from "../resources/primitives";
import webglUtils from "../resources/webgl-utils";
import webglLessonsUI from '../resources/webgl-lessons-ui';
import myMath from '../resources/myMath';
import m4, { Matrix4 } from "../resources/m4";

const vertexShader3d = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectionTexcoord;

void main(){
    vec4 worldPostion = u_world * a_position;
    gl_Position = u_projection * u_view * worldPostion;

    v_texcoord = a_texcoord;
    v_projectionTexcoord = u_textureMatrix * worldPostion;
}`;

const fragmentShader3d = `
precision mediump float;

varying vec2 v_texcoord;
varying vec4 v_projectionTexcoord;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;

void main(){
    vec3 projectedtexCoord = v_projectionTexcoord.xyz /v_projectionTexcoord.w;

    bool inRange = 
        projectedtexCoord.x >= 0.0 &&
        projectedtexCoord.x <= 1.0 &&
        projectedtexCoord.y >= 0.0 &&
        projectedtexCoord.y <= 1.0;

    vec4 projectedTexColor = texture2D(u_projectedTexture, projectedtexCoord.xy);
    vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;

    float projectedAmout = inRange ? 1.0 : 0.0;
    gl_FragColor = mix(texColor, projectedTexColor, projectedAmout);
}`;

export default function main() {
    const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const sphereBufferInfo = primitives.createSphereBufferInfo(
        gl,
        1,  // radius
        12, // subdivisions around
        6,  // subdivisions down
    );
    const planeBufferInfo = primitives.createPlaneBufferInfo(
        gl,
        20,  // width
        20,  // height
        1,   // subdivisions across
        1,   // subdivisions down
    );

    const textureProgramInfo = webglUtils.createProgramInfo(gl, [vertexShader3d, fragmentShader3d]);
    
    const checkerboardTexure = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkerboardTexure);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,                // mip level
        gl.LUMINANCE,     // internal format
        8,                // width
        8,                // height
        0,                // border
        gl.LUMINANCE,     // format
        gl.UNSIGNED_BYTE, // type
        new Uint8Array([  // data
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
            0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        ])
    );
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
    };
    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
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
    ]);

    const fieldOfViewRadians = myMath.degToRad(60);

    const planeUniforms = {
        u_colorMult: [0.5, 0.5, 1, 1],
        u_texture: checkerboardTexure,
        u_world: m4.translation(0, 0, 0)
    };
    const sphereUniforms = {
        u_colorMult: [1, 0.5, 0.5, 1],
        u_texture: checkerboardTexure,
        u_world: m4.translation(2, 3, 4)
    };

    function drawScene(projectionMatrix:Matrix4, cameraMatrix:Matrix4) {
        const viewMatrix = m4.inverse(cameraMatrix);
        let textureWorldMatrix = m4.lookAt(
            [settings.posX, settings.posY, settings.posZ],
            [settings.targetX, settings.targetY, settings.targetZ],
            [0, 1, 0]
        );
        textureWorldMatrix = m4.scale(
            textureWorldMatrix,
            settings.projWidth, settings.projHeight, 1
        );

        const textureMatrix = m4.inverse(textureWorldMatrix);

        gl.useProgram(textureProgramInfo.program);
        webglUtils.setUniforms(textureProgramInfo, {
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_textureMatrix: textureMatrix,
            u_projectedTexture: imageTexture,
        });

        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);
        webglUtils.setUniforms(textureProgramInfo, sphereUniforms);
        webglUtils.drawBufferInfo(gl, sphereBufferInfo);

        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);
        webglUtils.setUniforms(textureProgramInfo, planeUniforms);
        webglUtils.drawBufferInfo(gl, planeBufferInfo);
    }

    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
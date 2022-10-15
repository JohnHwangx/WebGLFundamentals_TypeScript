import webglLessonsUI from '../resources/webgl-lessons-ui'
import primitives from "../resources/primitives";
import webglUtils, { ProgramInfo } from "../resources/webgl-utils";
import myMath from '../resources/myMath';
import m4, { Matrix4 } from '../resources/m4';

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
    gl_Position = u_projection * u_view * worldPosition;

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

void main(){
    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    bool inRange = 
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x <= 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y <= 1.0;
    // 'r' 通道内包含深度值
    vec4 projectedTexColor = vec4(texture2D(u_projectedTexture, projectedTexcoord.xy).rrr, 1);
    vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
    float projectedAmount = inRange ? 1.0 : 0.0;
    gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}`;

const vertexShaderColor = `
attribute vec4 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main(){
    gl_Position = u_projection * u_view * u_world * a_position;
}`;

const fragmentShaderColor = `
precision mediump float;

uniform vec4 u_color;
void main(){
    gl_FragColor = u_color;
}`;

export default function main() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const ext = gl.getExtension('WEBGL_depth_texture');
    if (!ext) {
      return alert('need WEBGL_depth_texture');  // eslint-disable-line
    }

    const textureProgramInfo = webglUtils.createProgramInfo(gl, [vertexShader3d, fragmentShader3d]);
    const colorProgramInfo = webglUtils.createProgramInfo(gl, [vertexShaderColor,fragmentShaderColor]);

    const sphereBufferInfo = primitives.createSphereBufferInfo(gl, 1, 32, 24);
    const planeBUfferInfo = primitives.createPlaneBufferInfo(gl, 20, 20, 1, 1);
    const cubeBufferInfo = primitives.createCubeBufferInfo(gl, 2);
    const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
        position: [
            -1, -1, -1,
            1, -1, -1,
            -1, 1, -1,
            1, 1, -1,
            -1, -1, 1,
            1, -1, 1,
            -1, 1, 1,
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
        ],
    });

    const checkerboardTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        8,
        8,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        new Uint8Array([  // data
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

    const depthTexture = gl.createTexture();
    const depthTextureSize = 512;
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.DEPTH_COMPONENT,
        depthTextureSize,
        depthTextureSize,
        0,
        gl.DEPTH_COMPONENT,
        gl.UNSIGNED_INT,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const depthFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        depthTexture,
        0
    );
    // 创建一个和深度纹理相同尺寸的颜色纹理
    const unusedTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        depthTextureSize,
        depthTextureSize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // 把它附加到该帧缓冲上
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        unusedTexture,
        0
    );

    const settings = {
        cameraX: 6,
        cameraY: 5,
        posX: 2.5,
        posY: 4.8,
        posZ: 4.3,
        targetX: 2.5,
        targetY: 0,
        targetZ: 3.5,
        projWidth: 1,
        projHeight: 1,
        perspective: true,
        fieldOfView: 120,
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
        { type: 'slider', key: 'projWidth', min: 0, max: 2, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'projHeight', min: 0, max: 2, change: render, precision: 2, step: 0.001, },
        { type: 'checkbox', key: 'perspective', change: render, },
        { type: 'slider', key: 'fieldOfView', min: 1, max: 179, change: render, },
      ]);
    
    const fieldOfViewRadians = myMath.degToRad(60);

    const planeUniforms = {
        u_colorMult: [0.5, 0.5, 1, 1],
        u_color: [1, 0, 0, 1],
        u_texture: checkerboardTexture,
        u_world: m4.translation(0, 0, 0),
    };

    const sphereUniforms = {
        u_colorMult: [1, 0.5, 0.5, 1],
        u_color: [0, 0, 1, 1],
        u_texture: checkerboardTexture,
        u_world: m4.translation(2, 3, 4)
    };

    const cubeUniforms = {
        u_colorMult: [0.5, 1, 0.5, 1],
        u_color: [0, 0, 1, 1],
        u_texture: checkerboardTexture,
        u_world: m4.translation(3, 1, 0)
    }
    
    function drawScene(projectionMatrix: Matrix4, cameraMatrix:Matrix4, textureMatrix: Matrix4, programInfo: ProgramInfo) {
        // 从相机矩阵中创建一个视图矩阵
        const viewMatrix = m4.inverse(cameraMatrix);

        gl.useProgram(programInfo.program);
        // 设置对于球体和平面都是一样的 uniforms
        // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
        webglUtils.setUniforms(programInfo, {
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_textureMatrix: textureMatrix,
            u_projectedTexture: depthTexture,
        });

        // ------ 绘制球体 --------
 
        // 设置所有需要的 attributes
        webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);
        webglUtils.setUniforms(programInfo, sphereUniforms);
        webglUtils.drawBufferInfo(gl, sphereBufferInfo);
        // ------ 绘制平面 --------
        webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
        webglUtils.setUniforms(programInfo, cubeUniforms);
        webglUtils.drawBufferInfo(gl, cubeBufferInfo);

        webglUtils.setBuffersAndAttributes(gl, programInfo, planeBUfferInfo);
        webglUtils.setUniforms(programInfo, planeUniforms);
        webglUtils.drawBufferInfo(gl, planeBUfferInfo);
    }

    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        // 首先从光源的视角绘制一次
        const lightWorldMatrix = m4.lookAt(
            [settings.posX, settings.posY, settings.posZ],
            [settings.targetX, settings.targetY, settings.targetZ],
            [0, 1, 0]
        );

        const lightProjectionMatrix = settings.perspective ?
            m4.perspective(
                myMath.degToRad(settings.fieldOfView),
                settings.projWidth / settings.projHeight,
                0.5,
                10
            ) :
            m4.orthographic(
                -settings.projWidth / 2,   // left
                settings.projWidth / 2,   // right
                -settings.projHeight / 2,  // bottom
                settings.projHeight / 2,  // top
                0.5,                      // near
                10
            );
        
        // 绘制到深度纹理
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer);
        gl.viewport(0, 0, depthTextureSize, depthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), colorProgramInfo);
        // 现在绘制场景到画布，把深度纹理投影到场景内
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let textureMatrix = m4.identity();
        textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
        // 使用该世界矩阵的逆矩阵来创建一个
        // 可以变换其他坐标为相对于这个世界空间
        // 的矩阵。
        textureMatrix = m4.multiply(
            textureMatrix,
            m4.inverse(lightWorldMatrix)
        );
        // 计算投影矩阵
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
        // 使用 look at 计算相机的矩阵
        const cameraPosition = [settings.cameraX, settings.cameraY, 7];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        drawScene(projectionMatrix, cameraMatrix, textureMatrix, textureProgramInfo);

        {
            const viewMatrix = m4.inverse(cameraMatrix);

            gl.useProgram(colorProgramInfo.program);

            webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

            const mat = m4.multiply(
                lightWorldMatrix,
                m4.inverse(lightProjectionMatrix)
            );

            webglUtils.setUniforms(colorProgramInfo, {
                u_color: [0, 0, 0, 1],
                u_view: viewMatrix,
                u_projection: projectionMatrix,
                u_world: mat
            });

            webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
        }
    }

    render();
}

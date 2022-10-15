import webglLessonsUI from '../resources/webgl-lessons-ui'
import primitives from "../resources/primitives";
import webglUtils, { ProgramInfo } from "../resources/webgl-utils";
import myMath from '../resources/myMath';
import m4, { Matrix4 } from '../resources/m4';

const vertexShader3d = `
attribute vec4 a_position;
attribute vec2 a_texcoord;
attribute vec3 a_normal;

// uniform vec3 u_lightWorldPosition;
// uniform vec3 u_viewWorldPosition;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
varying vec3 v_normal;

// varying vec3 v_surfaceToLight;
// varying vec3 v_surfaceToView;

void main(){
    vec4 worldPosition = u_world * a_position;
    gl_Position = u_projection * u_view * worldPosition;

    v_texcoord = a_texcoord;

    v_projectedTexcoord = u_textureMatrix * worldPosition;
    // 调整法线方位并传给片段着色器
    v_normal = mat3(u_world) * a_normal;
    // // 计算物体表面的世界坐标
    // vec3 surfaceWorldPosition = (u_world * a_position).xyz;
    // // 计算物体表面指向光源的向量
    // // 然后将它传给片段着色器
    // v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    // // 计算物体表面指向相机的向量
    // // 然后将它传给片段着色器
    // v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}`;

const fragmentShader3d = `
precision mediump float;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
varying vec3 v_normal;
// varying vec3 v_surfaceToLight;
// varying vec3 v_surfaceToView;

uniform vec4 u_colorMult;
uniform sampler2D u_texture;
uniform sampler2D u_projectedTexture;
uniform float u_bias; //偏差值
// uniform float u_shininess;
// uniform vec3 u_lightDirection;
// uniform float u_innerLimit;
// uniform float u_outerLimit;
uniform vec3 u_reverseLightDirection;

void main(){
    // 因为 v_normal 是一个 varying，它已经被插值了
    // 所以它不会是一个单位向量。对它进行归一化
    // 使其再次成为单位向量
    vec3 normal = normalize(v_normal);

    float light = dot(normal, u_reverseLightDirection);
 
    // vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    // vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    // vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    
    // float dotFromDirection = dot(surfaceToLightDirection, -u_lightDirection);
    // float limitRange = u_innerLimit - u_outerLimit;
    // float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
    // float light = inLight * dot(normal, surfaceToLightDirection);
    // float specular = inLight * pow(dot(normal, halfVector), u_shininess);

    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    float currentDepth = projectedTexcoord.z + u_bias;

    bool inRange = 
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x <= 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y <= 1.0;
        
    float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
    float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0;

    vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;    
    // gl_FragColor = vec4(texColor.rgb * shadowLight, texColor.a);
    gl_FragColor = vec4(
        // texColor.rgb * light * shadowLight + specular * shadowLight,
        texColor.rgb * light * shadowLight,
        texColor.a );
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
    
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        unusedTexture,
        0
    );

    const settings = {
        cameraX: 6,
        cameraY: 12,
        posX: 2.5,
        posY: 4.8,
        posZ: 7,
        targetX: 3.5,
        targetY: 0,
        targetZ: 3.5,
        projWidth: 10,
        projHeight: 10,
        perspective: false,
        fieldOfView: 120,
        bias: -0.006,
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
        { type: 'slider', key: 'projWidth', min: 0, max: 100, change: render, precision: 2, step: 0.001, },
        { type: 'slider', key: 'projHeight', min: 0, max: 100, change: render, precision: 2, step: 0.001, },
        { type: 'checkbox', key: 'perspective', change: render, },
        { type: 'slider', key: 'fieldOfView', min: 1, max: 179, change: render, },
        { type: 'slider', key: 'bias', min: -0.01, max: 0.00001, change: render, precision: 4, step: 0.0001, },
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
    
    function drawScene(projectionMatrix: Matrix4,
        cameraMatrix: Matrix4,
        textureMatrix: Matrix4,
        lightWorldMatrix: Matrix4,
        programInfo: ProgramInfo) {
        
        // 从相机矩阵中创建一个视图矩阵
        const viewMatrix = m4.inverse(cameraMatrix);

        gl.useProgram(programInfo.program);

        // 设置对于球体和平面都是一样的 uniforms
        // 注意：在着色器中，任何没有对应 uniform 的值都会被忽略。
        webglUtils.setUniforms(programInfo, {
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_bias: settings.bias,
            u_textureMatrix: textureMatrix,
            u_projectedTexture: depthTexture,
            // u_shininess: 150,
            // u_innerLimit: Math.cos(myMath.degToRad(settings.fieldOfView / 2 - 10)),
            // u_outerLimit: Math.cos(myMath.degToRad(settings.fieldOfView / 2)),
            // u_lightDirection: lightWorldMatrix.slice(8, 11).map((v: number) => -v),
            // u_lightWorldPosition: [settings.posX, settings.posY, settings.posZ],
            // u_viewWorldPosition: cameraMatrix.slice(12, 15)
            u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
        });

        webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);
        webglUtils.setUniforms(programInfo, sphereUniforms);
        webglUtils.drawBufferInfo(gl, sphereBufferInfo);
        
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
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer);
        gl.viewport(0, 0, depthTextureSize, depthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawScene(lightProjectionMatrix,
            lightWorldMatrix,
            m4.identity(),
            lightWorldMatrix,
            colorProgramInfo);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let textureMatrix = m4.identity();
        textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
        
        textureMatrix = m4.multiply(
            textureMatrix,
            m4.inverse(lightWorldMatrix)
        );
        
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
        
        const cameraPosition = [settings.cameraX, settings.cameraY, 15];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        drawScene(projectionMatrix,
            cameraMatrix,
            textureMatrix, 
            lightWorldMatrix,
            textureProgramInfo);

        {
            const viewMatrix = m4.inverse(cameraMatrix);

            gl.useProgram(colorProgramInfo.program);

            webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

            const mat = m4.multiply(
                lightWorldMatrix,
                m4.inverse(lightProjectionMatrix)
            );

            webglUtils.setUniforms(colorProgramInfo, {
                u_color: [1, 1, 1, 1],
                u_view: viewMatrix,
                u_projection: projectionMatrix,
                u_world: mat
            });

            webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
        }
    }

    render();
}

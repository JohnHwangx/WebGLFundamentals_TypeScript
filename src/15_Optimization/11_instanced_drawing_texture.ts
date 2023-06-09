import m4 from "../resources/m4";
import myMath from "../resources/myMath";
import webglUtils from "../resources/webgl-utils";

const vertexShader3d = `
attribute vec4 a_position;
attribute vec2 a_texcoord;
attribute mat4 a_matrix;

// uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main(){
    gl_Position = a_matrix * a_position;

    v_texcoord = a_texcoord;
}`

const fragmentShader3d = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
void main(){
    gl_FragColor = texture2D(u_texture,v_texcoord);
}`;

const FLOAT_SIZE = 4;

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const ext_vao = gl.getExtension('OES_vertex_array_object');
    if (!ext_vao) {
        return alert('need OES_vertex_array_object');  // eslint-disable-line
    }

    const ext_instanced = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext_instanced) {
        return alert('need ANGLE_instanced_arrays');  // eslint-disable-line
    }

    const program = webglUtils.createProgramFromStrings(gl, [vertexShader3d, fragmentShader3d]);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');
    const matrixLocation = gl.getAttribLocation(program, 'a_matrix');
    const textureLocation = gl.getUniformLocation(program, 'u_texture');
    
    const vao = ext_vao.createVertexArrayOES();
    ext_vao.bindVertexArrayOES(vao);

    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    setGeometry(gl);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 5 * FLOAT_SIZE, 0);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 5 * FLOAT_SIZE, 3 * FLOAT_SIZE);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    setIndex(gl);

    // setup matrixes, one per instance
    const numInstances = 3;
    // make a typed array with one view per matrix
    const matrixData = new Float32Array(numInstances * 16);
    const matrices = [];
    for (let i = 0; i < numInstances; ++i) {
        const byteOffsetToMatrix = i * 16 * 4;
        const numFloatsForView = 16;
        matrices.push(new Float32Array(
            matrixData.buffer,
            byteOffsetToMatrix,
            numFloatsForView));
    }

    const matrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);
  
    // set all 4 attributes for matrix
    const bytesPerMatrix = 4 * 16;//这里的4是每个float4字节，16是16个数
    for (let i = 0; i < 4; ++i) {//4行
        const loc = matrixLocation + i;
        gl.enableVertexAttribArray(loc);
        // note the stride and offset
        const offset = i * 4 * 4;  // 4 floats per row, 4 bytes per float
        gl.vertexAttribPointer(
            loc,              // location
            4,                // size (num values to pull from buffer per iteration)
            gl.FLOAT,         // type of data in buffer
            false,            // normalize
            bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
            offset,           // offset in buffer
        );
        // this line says this attribute only changes for each 1 instance
        ext_instanced.vertexAttribDivisorANGLE(loc, 1);
    }

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    let image = new Image();
    image.src = './resources/images/noodles.jpg';
    image.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (myMath.isPowerOf2(image.width) && myMath.isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });

    let fieldOfViewRadians = myMath.degToRad(60);
    let modelXRotationRadians = myMath.degToRad(0);
    let modelYRotationRadians = myMath.degToRad(0);    

    let glcanvas = gl.canvas as HTMLCanvasElement;
    let aspect = glcanvas.clientWidth / glcanvas.clientHeight;
    let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    let cameraPosition = [0, 0, 2];
    let up = [0, 1, 0];
    let target = [0, 0, 0];
    
    let cameraMatrix = m4.lookAt(cameraPosition, target, up);
    let viewMatrix = m4.inverse(cameraMatrix);
    let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    let then = 0;

    requestAnimationFrame(drawScene);
    function drawScene(time: number) {
        time *= 0.001;
        let deltaTime = time - then;
        then = time;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        modelXRotationRadians += -0.7 * deltaTime;
        modelYRotationRadians += -0.4 * deltaTime;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);
        
        ext_vao.bindVertexArrayOES(vao);

        matrices.forEach((mat, ndx) => {
            let matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
            matrix = m4.yRotate(matrix, modelYRotationRadians);

            m4.translation(-0.5 + ndx * 0.5, 0, 0, mat);
            m4.multiply(mat, matrix, mat);
        });

        // upload the new matrix data
        gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

        // gl.uniformMatrix4fv(matrixLocation, false, matrix);
        gl.uniform1i(textureLocation, 0);
        // gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
        // gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        ext_instanced.drawElementsInstancedANGLE(
            gl.TRIANGLES,
            36,
            gl.UNSIGNED_SHORT,
            0,
            numInstances
        )

        requestAnimationFrame(drawScene);
    }
}

function setGeometry(gl: WebGLRenderingContext) {
    let positions = new Float32Array([
        // select the top left image
        -0.5, -0.5, -0.5, 0, 0,
        -0.5, 0.5, -0.5, 0, 0.5,
        0.5, -0.5, -0.5, 0.25, 0,
        // -0.5, 0.5, -0.5,0, 0.5,
        0.5, 0.5, -0.5, 0.25, 0.5,
        // 0.5, -0.5, -0.5,0.25, 0,

        // select the top middle image
        -0.5, -0.5, 0.5, 0.25, 0,
        0.5, -0.5, 0.5, 0.5, 0,
        -0.5, 0.5, 0.5, 0.25, 0.5,
        // -0.5, 0.5, 0.5, 0.25, 0.5,
        // 0.5, -0.5, 0.5, 0.5, 0,
        0.5, 0.5, 0.5, 0.5, 0.5,

        // select to top right image
        -0.5, 0.5, -0.5, 0.5, 0,
        -0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, -0.5, 0.75, 0,
        // -0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, 0.5, 0.75, 0.5,
        // 0.5, 0.5, -0.5, 0.75, 0,

        // select the bottom left image
        -0.5, -0.5, -0.5, 0, 0.5,
        0.5, -0.5, -0.5, 0.25, 0.5,
        -0.5, -0.5, 0.5, 0, 1,
        // -0.5, -0.5, 0.5, 0, 1,
        // 0.5, -0.5, -0.5, 0.25, 0.5,
        0.5, -0.5, 0.5, 0.25, 1,

        // select the bottom middle image
        -0.5, -0.5, -0.5, 0.25, 0.5,
        -0.5, -0.5, 0.5, 0.25, 1,
        -0.5, 0.5, -0.5, 0.5, 0.5,
        // -0.5, -0.5, 0.5, 0.25, 1,
        -0.5, 0.5, 0.5, 0.5, 1,
        // -0.5, 0.5, -0.5, 0.5, 0.5,

        // select the bottom right image
        0.5, -0.5, -0.5, 0.5, 0.5,
        0.5, 0.5, -0.5, 0.75, 0.5,
        0.5, -0.5, 0.5, 0.5, 1,
        // 0.5, -0.5, 0.5, 0.5, 1,
        // 0.5, 0.5, -0.5, 0.75, 0.5,
        0.5, 0.5, 0.5, 0.75, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setIndex(gl: WebGLRenderingContext) {
    const indices = new Uint16Array([
        // select the top left image
        0, 1, 2,
        1, 3, 2,
        // select the top middle image
        0 + 4, 1 + 4, 2 + 4,
        1 + 4, 3 + 4, 2 + 4,
        // select to top right image
        0 + 8, 1 + 8, 2 + 8,
        1 + 8, 3 + 8, 2 + 8,
        // select the bottom left image
        0 + 12, 1 + 12, 2 + 12,
        1 + 12, 3 + 12, 2 + 12,
        // select the bottom middle image
        0 + 16, 1 + 16, 2 + 16,
        1 + 16, 3 + 16, 2 + 16,
        // select the bottom right image
        0 + 20, 1 + 20, 2 + 20,
        1 + 20, 3 + 20, 2 + 20,
    ]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}
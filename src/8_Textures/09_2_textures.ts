import webglUtils from "../resources/webgl-utils";

const veretxShader2d = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main(){
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1,-1), 0, 1);
    v_texCoord = a_texCoord;
}`;

const fragmentShader2d = `
precision mediump float;

// 纹理
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// 从顶点着色器传入的 texCoords
varying vec2 v_texCoord;

void main() {
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = color0 * color1;
}`;

function loadImage(url: string, callback: (this: GlobalEventHandlers, ev: Event) => any) {
    let image = new Image();
    image.src = url;
    image.onload = callback;
    return image;
}

function loadImages(urls: string[], callback: (arg0: any[]) => void) {
    let images = [];
    let imageToLoad = urls.length;

    let onImageLoad = () => {
        --imageToLoad;
        if (imageToLoad === 0) {
            callback(images);
        }
    }

    for (let ii = 0; ii < imageToLoad; ++ii) {
        let image = loadImage(urls[ii], onImageLoad);
        images.push(image);        
    }
}

export default function main() {
    loadImages([
        '../resources/images/leaves.jpg',
        '../resources/images/star.jpg'
    ], render);
}

function render(images: TexImageSource[]) {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
    const program = webglUtils.createProgramFromStrings(gl, [veretxShader2d, fragmentShader2d]);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, 0, 0, images[0].width, images[0].height);

    let texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ]), gl.STATIC_DRAW);

    let textures = [];
    for (let ii = 0; ii < 2; ii++){
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);
        textures.push(texture);
    }

    let resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

    let image0Location = gl.getUniformLocation(program, 'u_image0');
    let image1Location = gl.getUniformLocation(program, 'u_image1');

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    gl.uniform1i(image0Location, 0);
    gl.uniform1i(image1Location, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[1]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
    let x1 = x;
    let x2 = x + width;
    let y1 = y;
    let y2 = y + height;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}
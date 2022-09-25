import webglUtils from '../resources/webgl-utils'

const vertex_shader_2d = `
attribute vec4 a_position;

uniform vec2 u_resolution;

void main(){
    // 从像素坐标转换到 0.0 到 1.0
    vec2 zeroToOne = a_position.xy/u_resolution;
    // 再把 0->1 转换 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
    // 把 0->2 转换到 -1->+1 (裁剪空间)
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace, 0, 1);
}`;

const fragment_shader_2d = `
precision mediump float;
void main(){
    gl_FragColor = vec4(1,0,0.5,1);
}`

export default function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    let gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }
    // 获取着色器字符串
    let vertexShaderSource = vertex_shader_2d;
    let fragmentShaderSource = fragment_shader_2d;

    let program = webglUtils.createProgramFromStrings(gl, [vertexShaderSource, fragmentShaderSource]);

    let resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    
    let positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 清空画布
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 告诉它用我们之前写好的着色程序（一个着色器对）
    gl.useProgram(program);

    // 启用对应属性
    gl.enableVertexAttribArray(positionAttributeLocation);

    // 将绑定点绑定到缓冲数据（positionBuffer）
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
    var size = 2;          // 每次迭代运行提取两个单位数据
    var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
    var normalize = false; // 不需要归一化数据
    var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）每次迭代运行运动多少内存到下一个数据开始点
    var offset = 0;        // 从缓冲起始位置开始读取
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // 绘制
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
}
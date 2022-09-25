// export default class webglUtils {
/**
   * Wrapped logging function.
   * @param {string} msg The message to log.
   */
function error(msg: string) {
    // if (this.topWindow.console) {
    //     if (topWindow.console.error) {
    //         topWindow.console.error(msg);
    //     } else if (topWindow.console.log) {
    //         topWindow.console.log(msg);
    //     }
    // }
}
/**
* Resize a canvas to match the size its displayed.
* @param {HTMLCanvasElement} canvas The canvas to resize.
* @param {number} [multiplier] amount to multiply by.
*    Pass in window.devicePixelRatio for native pixels.
* @return {boolean} true if the canvas was resized.
* @memberOf module:webgl-utils
*/
function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier?: number): boolean {
    multiplier = multiplier || 1;
    var width = canvas.clientWidth * multiplier | 0;
    var height = canvas.clientHeight * multiplier | 0;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

const defaultShaderType = [
    "VERTEX_SHADER",
    "FRAGMENT_SHADER",
];

/**
* Creates a program from 2 script tags.
* @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
* @param {string[]} shaderStrings Array of ids of the script tags for the shaders. The first is assumed to be the
vertex shader, the second the fragment shader.
* @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
* @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
* @param {} opt_errorCallback callback for errors. By default it just prints an error to the console
on error. If you want something else pass an callback. It's passed an error message.
* @return {WebGLProgram} The created program.
* @memberOf module:webgl-utils
*/
function createProgramFromStrings(
    gl: WebGLRenderingContext,
    shaderStrings: string[],
    opt_attribs?: string[],
    opt_locations?: number[],
    opt_errorCallback?: any): WebGLProgram {
    
    var shaders = [];
    for (var ii = 0; ii < shaderStrings.length; ++ii) {
        shaders.push(createShaderFromString(
            gl, shaderStrings[ii], gl[defaultShaderType[ii]], opt_errorCallback));
    }
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}

/**
* Loads a shader from a script tag.
* @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
* @param {string} shaderString The id of the script tag.
* @param {number} opt_shaderType The type of shader. If not passed in it will
be derived from the type of the script tag.
* @param {} opt_errorCallback callback for errors.
* @return {WebGLShader} The created shader.
*/
function createShaderFromString(
    gl: WebGLRenderingContext,
    shaderString: string,
    opt_shaderType?: number,
    opt_errorCallback?: any): WebGLShader {

    var shaderSource = "";
    var shaderType: number;
    // var shaderScript = document.getElementById(scriptId);
    // if (!shaderScript) {
    //     throw ("*** Error: unknown script element" + scriptId);
    // }
    shaderSource = shaderString;

    // if (!opt_shaderType) {
    //     if (shaderScript.type === "x-shader/x-vertex") {
    //         shaderType = gl.VERTEX_SHADER;
    //     } else if (shaderScript.type === "x-shader/x-fragment") {
    //         shaderType = gl.FRAGMENT_SHADER;
    //     } else if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
    //         throw ("*** Error: unknown shader type");
    //     }
    // }

    return loadShader(
        gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
        opt_errorCallback);
}

/**
   * Loads a shader.
   * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
   * @param {string} shaderSource The shader source.
   * @param {number} shaderType The type of shader.
   * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors.
   * @return {WebGLShader} The created shader.
   */
function loadShader(
    gl: WebGLRenderingContext,
    shaderSource: string,
    shaderType: number,
    opt_errorCallback: any): WebGLShader {

    var errFn = opt_errorCallback || error;
    // Create the shader object
    var shader = gl.createShader(shaderType);

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        // Something went wrong during compilation; get the error
        var lastError = gl.getShaderInfoLog(shader);
        console.error("*** Error compiling shader '" + shader + "':" + lastError);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}
/**
* Creates a program, attaches shaders, binds attrib locations, links the
* program and calls useProgram.
* @param {WebGLShader[]} shaders The shaders to attach
* @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
* @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
* @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
*        on error. If you want something else pass an callback. It's passed an error message.
* @memberOf module:webgl-utils
*/
function createProgram(
    gl: WebGLRenderingContext,
    shaders: WebGLShader[],
    opt_attribs: string[],
    opt_locations: number[],
    opt_errorCallback: (msg: string) => void) {
    
    var errFn = opt_errorCallback || error;
    var program = gl.createProgram();
    shaders.forEach(function (shader) {
        gl.attachShader(program, shader);
    });
    if (opt_attribs) {
        opt_attribs.forEach(function (attrib, ndx) {
            gl.bindAttribLocation(
                program,
                opt_locations ? opt_locations[ndx] : ndx,
                attrib);
        });
    }
    gl.linkProgram(program);

    // Check the link status
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        // something went wrong with the link
        var lastError = gl.getProgramInfoLog(program);
        errFn("Error in program linking:" + lastError);

        gl.deleteProgram(program);
        return null;
    }
    return program;
}
// }

export default {
    resizeCanvasToDisplaySize,
    createProgram,
    createProgramFromStrings
}
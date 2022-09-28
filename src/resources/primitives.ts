import m4, { Matrix4 } from "./m4";
import webglUtils from "./webgl-utils";

function applyFuncToV3Array(array:number[], matrix, fn) {
    var len = array.length;
    var tmp = new Float32Array(3);
    for (var ii = 0; ii < len; ii += 3) {
        fn(matrix, [array[ii], array[ii + 1], array[ii + 2]], tmp);
        array[ii] = tmp[0];
        array[ii + 1] = tmp[1];
        array[ii + 2] = tmp[2];
    }
}

function transformNormal(mi: number[], v: number[], dst?: number[] | Float32Array) {
    dst = dst || new Float32Array(3);
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];

    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

    return dst;
}

/**
 * Creates sphere vertices.
 * The created sphere has position, normal and uv streams.
 *
 * @param {number} radius radius of the sphere.
 * @param {number} subdivisionsAxis number of steps around the sphere.
 * @param {number} subdivisionsHeight number of vertically on the sphere.
 * @param {number} [opt_startLatitudeInRadians] where to start the
 *     top of the sphere. Default = 0.
 * @param {number} [opt_endLatitudeInRadians] Where to end the
 *     bottom of the sphere. Default = Math.PI.
 * @param {number} [opt_startLongitudeInRadians] where to start
 *     wrapping the sphere. Default = 0.
 * @param {number} [opt_endLongitudeInRadians] where to end
 *     wrapping the sphere. Default = 2 * Math.PI.
 * @return {Object.<string, TypedArray>} The
 *         created plane vertices.
 * @memberOf module:primitives
 */
function createSphereVertices(
    radius: number,
    subdivisionsAxis: number,
    subdivisionsHeight: number,
    opt_startLatitudeInRadians?: number,
    opt_endLatitudeInRadians?: number,
    opt_startLongitudeInRadians?: number,
    opt_endLongitudeInRadians?: number):any
{    
    if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
        throw Error('subdivisionAxis and subdivisionHeight must be > 0');
    }

    opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
    opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
    opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
    opt_endLongitudeInRadians = opt_endLongitudeInRadians || (Math.PI * 2);

    var latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
    var longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

    // We are going to generate our sphere by iterating through its
    // spherical coordinates and generating 2 triangles for each quad on a
    // ring of the sphere.
    var numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
    var positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    var normals = webglUtils.createAugmentedTypedArray(3, numVertices);
    var texCoords = webglUtils.createAugmentedTypedArray(2, numVertices);

    // Generate the individual vertices in our vertex buffer.
    for (var y = 0; y <= subdivisionsHeight; y++) {
        for (var x = 0; x <= subdivisionsAxis; x++) {
            // Generate a vertex based on its spherical coordinates
            var u = x / subdivisionsAxis;
            var v = y / subdivisionsHeight;
            var theta = longRange * u;
            var phi = latRange * v;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            var ux = cosTheta * sinPhi;
            var uy = cosPhi;
            var uz = sinTheta * sinPhi;
            positions.push(radius * ux, radius * uy, radius * uz);
            normals.push(ux, uy, uz);
            texCoords.push(1 - u, v);
        }
    }

    var numVertsAround = subdivisionsAxis + 1;
    var indices = webglUtils.createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
    for (x = 0; x < subdivisionsAxis; x++) {
        for (y = 0; y < subdivisionsHeight; y++) {
            // Make triangle 1 of quad.
            indices.push(
                (y + 0) * numVertsAround + x,
                (y + 0) * numVertsAround + x + 1,
                (y + 1) * numVertsAround + x);

            // Make triangle 2 of quad.
            indices.push(
                (y + 1) * numVertsAround + x,
                (y + 0) * numVertsAround + x + 1,
                (y + 1) * numVertsAround + x + 1);
        }
    }

    return {
        position: positions,
        normal: normals,
        texCoord: texCoords,
        indices: indices,
    };
}

/**
 * Creates XZ plane vertices.
 * The created plane has position, normal and uv streams.
 *
 * @param {number} [width] Width of the plane. Default = 1
 * @param {number} [depth] Depth of the plane. Default = 1
 * @param {number} [subdivisionsWidth] Number of steps across the plane. Default = 1
 * @param {number} [subdivisionsDepth] Number of steps down the plane. Default = 1
 * @param {Matrix4} [matrix] A matrix by which to multiply all the vertices.
 * @return {Object.<string, TypedArray>} The
 *         created plane vertices.
 * @memberOf module:primitives
 */
function createPlaneVertices(
    width?: number,
    depth?: number,
    subdivisionsWidth?: number,
    subdivisionsDepth?: number,
    matrix?: Matrix4)
{
    width = width || 1;
    depth = depth || 1;
    subdivisionsWidth = subdivisionsWidth || 1;
    subdivisionsDepth = subdivisionsDepth || 1;
    matrix = matrix || m4.identity();

    var numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
    var positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    var normals = webglUtils.createAugmentedTypedArray(3, numVertices);
    var texcoords = webglUtils.createAugmentedTypedArray(2, numVertices);

    for (var z = 0; z <= subdivisionsDepth; z++) {
        for (var x = 0; x <= subdivisionsWidth; x++) {
            var u = x / subdivisionsWidth;
            var v = z / subdivisionsDepth;
            positions.push(
                width * u - width * 0.5,
                0,
                depth * v - depth * 0.5);
            normals.push(0, 1, 0);
            texcoords.push(u, v);
        }
    }

    var numVertsAcross = subdivisionsWidth + 1;
    var indices = webglUtils.createAugmentedTypedArray(
        3, subdivisionsWidth * subdivisionsDepth * 2, Uint16Array);

    for (z = 0; z < subdivisionsDepth; z++) {
        for (x = 0; x < subdivisionsWidth; x++) {
            // Make triangle 1 of quad.
            indices.push(
                (z + 0) * numVertsAcross + x,
                (z + 1) * numVertsAcross + x,
                (z + 0) * numVertsAcross + x + 1);

            // Make triangle 2 of quad.
            indices.push(
                (z + 1) * numVertsAcross + x,
                (z + 1) * numVertsAcross + x + 1,
                (z + 0) * numVertsAcross + x + 1);
        }
    }

    var arrays = reorientVertices({
        position: positions,
        normal: normals,
        texCoord: texcoords,
        indices: indices,
    }, matrix);
    return arrays;
}

/**
 * Reorients positions by the given matrix. In other words, it
 * multiplies each vertex by the given matrix.
 * @param {number[]|TypedArray} array The array. Assumes value floats per element.
 * @param {Matrix} matrix A matrix to multiply by.
 * @return {number[]|TypedArray} the same array that was passed in
 * @memberOf module:primitives
 */
function reorientPositions(array: number[], matrix: Matrix4) {
    applyFuncToV3Array(array, matrix, m4.transformPoint);
    return array;
}

/**
 * Reorients directions by the given matrix..
 * @param {number[]|TypedArray} array The array. Assumes value floats per element.
 * @param {Matrix} matrix A matrix to multiply by.
 * @return {number[]|TypedArray} the same array that was passed in
 * @memberOf module:primitives
 */
function reorientDirections(array, matrix) {
    applyFuncToV3Array(array, matrix, m4.transformDirection);
    return array;
}

/**
 * Reorients normals by the inverse-transpose of the given
 * matrix..
 * @param {number[]|TypedArray} array The array. Assumes value floats per element.
 * @param {Matrix} matrix A matrix to multiply by.
 * @return {number[]|TypedArray} the same array that was passed in
 * @memberOf module:primitives
 */
function reorientNormals(array, matrix) {
    applyFuncToV3Array(array, m4.inverse(matrix), transformNormal);
    return array;
}

/**
 * Reorients arrays by the given matrix. Assumes arrays have
 * names that contains 'pos' could be reoriented as positions,
 * 'binorm' or 'tan' as directions, and 'norm' as normals.
 *
 * @param {Object.<string, (number[]|TypedArray)>} arrays The vertices to reorient
 * @param {Matrix} matrix matrix to reorient by.
 * @return {Object.<string, (number[]|TypedArray)>} same arrays that were passed in.
 * @memberOf module:primitives
 */
function reorientVertices(arrays, matrix) {
    Object.keys(arrays).forEach(function (name) {
        var array = arrays[name];
        if (name.indexOf("pos") >= 0) {
            reorientPositions(array, matrix);
        } else if (name.indexOf("tan") >= 0 || name.indexOf("binorm") >= 0) {
            reorientDirections(array, matrix);
        } else if (name.indexOf("norm") >= 0) {
            reorientNormals(array, matrix);
        }
    });
    return arrays;
}

/**
 * creates a function that calls fn to create vertices and then
 * creates a bufferInfo object for them
 */
function createBufferInfoFunc(fn:(...arg0: any)=>{}) {
    return function (gl: WebGLRenderingContext, ...args: number[]) {
        var arrays = fn.apply(null, Array.prototype.slice.call(args, 0));
        return webglUtils.createBufferInfoFromArrays(gl, arrays);
    };
}

export default {
    createSphereBufferInfo: createBufferInfoFunc(createSphereVertices),
    createPlaneBufferInfo: createBufferInfoFunc(createPlaneVertices),
}
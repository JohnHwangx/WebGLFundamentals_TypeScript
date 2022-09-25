function isPowerOf2(value: number) {
    return (value & (value - 1)) === 0;
}

function degToRad(d: number) {
    return d * Math.PI / 180;
}
function radToDeg(r: number) {
    return r * 180 / Math.PI;
}

export default {
    isPowerOf2,
    degToRad,
    radToDeg,
}
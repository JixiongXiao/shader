uniform float uScale;
uniform float uFrequency;
uniform float uIntensity;
uniform float uTime;
uniform float uSpreadTime;
uniform vec2 uSpreadCenter;
uniform float uSpreadWidth;
varying vec3 vPosition;
varying float vElevation;
varying vec2 vUv;
varying float spreadRadius;
varying float spreadIndex;



void main() {
    vPosition = position;
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4 ( position, 1.0);
    // 沿着xz方向起伏
    float elevation = sin((modelPosition.x + uTime * uFrequency) * uIntensity) * sin((modelPosition.z+uTime * uFrequency) * uIntensity);
    elevation *= uScale;
    vElevation = elevation;
    modelPosition.y += elevation;

    // 沿着扩散方向起伏
    spreadRadius = distance(position.xz, uSpreadCenter); // 扩散半径
    spreadIndex = -(spreadRadius - uSpreadTime) * (spreadRadius - uSpreadTime) + uSpreadWidth; // 扩散光圈的中轴线
    if(spreadIndex > 0.0 ) {
        float circleElevation = sin((modelPosition.x ) * uIntensity ) * sin((modelPosition.z) * uIntensity);
        modelPosition.y += (sin(spreadIndex / uSpreadWidth)) / 2.0; // 扩散光圈顶点加带斜率高度
        // modelPosition.y += circleElevation; //扩散光圈顶点高低特效

    }

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
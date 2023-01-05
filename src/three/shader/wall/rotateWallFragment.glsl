varying vec3 vPosition;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;

void main() {
    vec2 horizontal = vec2(fract(vUv.x - uTime),vUv.y);
    vec2 vertical = vec2(fract(vUv.y - uTime),vUv.x);
    // vec4 textureColor = texture2D(uTexture,horizontal); //水平滚动
    vec4 textureColor = texture2D(uTexture,vertical); // 垂直滚动
    gl_FragColor = textureColor;

}
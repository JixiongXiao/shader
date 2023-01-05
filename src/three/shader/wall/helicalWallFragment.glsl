// 渐变螺旋围栏
uniform float uHeight;
varying vec3 vPosition;
varying vec2 vUv;
uniform float uTime;
uniform float uelapseTime;

float random (vec2 st) {
    float factor = 0.5; // 调整该系数可以改变纹路细节
    float x = 12.9898; // x轴纹路倾斜度
    float y = 18.233; // y轴纹路数量
    return fract(sin(dot(st.xy,
                         vec2(x,y)))*
        factor);
}

// 渐变移动线条光墙
void main() {
    float strength = 1.0 - ( vPosition.y + uHeight / 2.0) / uHeight;
    // strength -= random(vec2(vUv.x, vUv.y-(uTime * 0.4)));

    float xSlope = 1.0; // 调整该系数影响纹路水平方向倾斜，1.0为水平
    float ySpeed = 0.3; // 纹路垂直移动速度系数，越高越快
    strength -= random(vec2(vUv.x * xSlope, vUv.y-(uelapseTime * ySpeed)));
    gl_FragColor = vec4 (0.3, vUv.y+0.3, 0.6, strength);
}



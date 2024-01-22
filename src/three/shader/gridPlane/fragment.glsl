varying vec3 vPosition;
varying float vElevation;
uniform vec3 uColor;
uniform vec3 uCircleColor;
uniform vec2 uSpreadCenter;
uniform float uSpreadTime;
uniform float uSpreadWidth;
uniform float uTime;
uniform float uGridWidth;
uniform float uDivisionX;
uniform float uDivisionY;
uniform float uMoveSpeed;
varying vec2 vUv;
varying float spreadRadius; // 扩散半径 从顶点着色器传入
varying float spreadIndex; // 扩散光圈的中轴线 从顶点着色器传入


// void main() {

//     float opacity = (vElevation + 1.0) / 2.0; // 水平高低转换成颜色明暗

//     // 绘制网格
//     float strength = step(uGridWidth,mod(((vUv.y - 0.025) - uTime * uMoveSpeed)  * uDivisionY, 1.0)); // -0.025是为了让网格居中
//     strength *= step(uGridWidth, mod(((vUv.x - 0.025) - uTime * uMoveSpeed) * uDivisionX, 1.0));
//     float alpha = (1.0 - strength) * opacity ; // 网格效果和水平高低明暗效果叠加
//     gl_FragColor = vec4(uColor, alpha);


//     // 扩散光环v
//     if(spreadIndex > 0.0) {
//         float circleAlpha =  (1.0 - strength) *(spreadIndex / uSpreadWidth);
//         gl_FragColor = mix(gl_FragColor, vec4(uCircleColor,1.0), circleAlpha);
//     }

//     // 交叉点高亮效果
//         float cross = step(uGridWidth,mod(((vUv.y - 0.025) - uTime * uMoveSpeed) * uDivisionY, 1.0));
//         cross += step(uGridWidth,mod(((vUv.x - 0.025) - uTime * uMoveSpeed) * uDivisionY, 1.0));
//         if(strength == cross) {
//         gl_FragColor = vec4(uCircleColor,1.0);
//     }

// }

void main() {

    float strength = step(uGridWidth,mod((vUv.y - 0.025)  * uDivisionY, 1.0)); // -0.025是为了让网格居中
    strength *= step(uGridWidth, mod((vUv.x - 0.025) * uDivisionX, 1.0));
    float alpha = (1.0 - strength); // 网格效果和水平高低明暗效果叠加
    gl_FragColor = vec4(uColor, alpha);
}
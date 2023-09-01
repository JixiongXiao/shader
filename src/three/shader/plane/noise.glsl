
   #define r 43758.5453
   varying vec3 vPosition;
   varying vec2 vUv;
   uniform float uelapseTime; 
   float random(vec2 st){
     return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*r);
   }
   float noise(vec2 st) {
   vec2 i = floor(st.xy);
   vec2 f = fract(st.xy);
   f = smoothstep(0.0,1.0,f);
   float a = random(i);
   float b = random(i + vec2(1.0,0.0));
   float c = random(i + vec2(0.0,1.0));
   float d = random(i + vec2(1.0,1.0));
   float mixN = mix(a,b,f.x); // 相当于a * (1.0 - f.x) + b * f.x
   float z = a * (1.0 - f.x) + b * f.x + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.y * f.x;
   return z;
   }
   float fbm(vec2 st) {
     float value = 0.0;
     float amplitude = 0.5;
     float frequency = 2.0;
     for(int i=0; i<6; i++) {
       value += amplitude*noise(st);
       st *= frequency;
       amplitude *= 0.5;
     }
     return value;
   }
   float fbmAbs(vec2 st) {
     float value = 0.0;
     float amplitude = 0.5;
     float frequency = 2.0;
     for(int i=0; i<6; i++) {
       value += amplitude*abs(sin(noise(st)*6.28));
       st *= frequency;
       amplitude *= 0.5;
     }
     return value;
   }
   float fbmRotate(vec2 st) {
     float value = 0.0;
     float amplitude = 0.5;
     float frequency = 2.0;
     vec2 shift = vec2(100.0);
     mat2 rot = mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5));
     for(int i=0; i<6; i++) {
       value += amplitude*noise(st);
       st = rot * st * frequency + shift;
       amplitude *= 0.5;
     }
     return value;
   }
 void main() {

   // float z = fbmAbs(vUv * 15.0);
   // float z = 1.0 - fbmAbs(vUv * 5.0); // 水纹效果
   // float z = fbm(fbm(fbm(vUv * 15.0) + vUv * 15.0) + vUv * 15.0); // 多分型函数嵌套形成烟雾
   // float z = fbmRotate(vUv * 10.0); // 旋转分型噪声


   // 复杂分型函数
   vec2 q =vec2(0.0);
   float uTime = uelapseTime;
   vec2 vUv = vUv * 5.0;
   q.x = fbmRotate(vUv + 0.0 * uTime);
   q.y = fbmRotate(vUv + 1.0 * uTime);

   vec2 p = vec2(0.0);
   p.x = fbmRotate(vUv + 1.0 * q + vec2(1.7,9.2) + 0.15 * uTime);
   p.y = fbmRotate(vUv + 1.0 * q + vec2(8.3,2.8) + 0.126 * uTime);

   float z = fbmRotate(vUv + p);
   vec3 color = vec3(0.0);

   color = mix(
    vec3(0.101,0.619,0.666),
    vec3(0.666,0.827,0.491),
    clamp(z*z*4.0,0.0,1.0)
   );
   color = mix(
    color,
    vec3(0.0,0.0,0.16),
    clamp(length(q),0.0,1.0)
   );

   color = mix(
    color,
    vec3(0.5,1.0,1.0),
    clamp(length(p.x),0.0,1.0)
   );
   
  gl_FragColor = vec4(color*(z*z*z+0.6*z*z+0.5*z),1.0);
  // gl_FragColor = vec4(z,z,z,1.0);
 }
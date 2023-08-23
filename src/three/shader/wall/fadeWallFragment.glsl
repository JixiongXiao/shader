// varying vec3 vPosition;
// uniform float uelapseTime;
// varying vec2 vUv;

// float plot(vec2 st, float pct){
//   return  smoothstep( pct-0.02, pct, st.y) -
//           smoothstep( pct, pct+0.02, st.y);
// }

// void main() {
//     vec2 st = vUv;
//     float n = fract((sin(uelapseTime) + 1.0)/ 2.0);
//     // Smooth interpolation between 0.1 and 0.9
//     float y = smoothstep(0.1,0.9,st.y);
//     y += n;
//     float strength = 1.0 - y ;
//     vec3 color = vec3(1.0,1.0,0.0);

    
//     gl_FragColor = vec4(0.1,0.7,0.3,strength);

// }

        uniform float uelapseTime;
                        varying vec2 vUv;
                        #define PI 3.14159265

						vec2 lll(float x){
							return vec2(x - 0.001,x+0.001);
						}

                        void main(){

                        vec4 baseColor = vec4(0.0,1.,0.5,1.);
                        vec4 flowColor = vec4(1,1,1,1);
                        vec4 finalColor;
                            
                        float amplitude = 1.;
                        float frequency = 10.;
                        vec2 st = vec2(2.0*vUv.x,vUv.y);                      
                        float x = 2.0 * st.x - pow(st.x,2.0);
                        // float x = vUv.x;

                        float y = sin(x * frequency);
                        float t = 0.01*(-uelapseTime*130.0);
                        y += sin(x*frequency*2.1 + t)*4.5;
                        y += sin(x*frequency*1.72 + t*1.121)*4.0;
                        y += sin(x*frequency*2.221 + t*0.437)*5.0;
                        y += sin(x*frequency*3.1122+ t*4.269)*2.5;
                        y *= amplitude*0.06;
                        y /= 3.;
                        y += 0.55;

                        vec4 color = gl_FragColor.rgba;

                        float r = step(0.5, fract(vUv.y - uelapseTime));

                        baseColor.a = step(vUv.y,y) * (y-vUv.y)/y;

                        vec2 base1 = lll(0.1);
                        vec2 base2 = lll(0.3);
                        vec2 base3 = lll(0.4);
                        gl_FragColor = baseColor;

                        }
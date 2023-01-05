varying vec3 vPosition;
uniform float uelapseTime;
varying vec2 vUv;

float plot(vec2 st, float pct){
  return  smoothstep( pct-0.02, pct, st.y) -
          smoothstep( pct, pct+0.02, st.y);
}

void main() {
    vec2 st = vUv;
    float n = fract((sin(uelapseTime) + 1.0)/ 2.0);
    // Smooth interpolation between 0.1 and 0.9
    float y = smoothstep(0.1,0.9,st.y);
    y += n;
    float strength = 1.0 - y ;
    vec3 color = vec3(1.0,1.0,0.0);

    
    gl_FragColor = vec4(0.1,0.7,0.3,strength);

}
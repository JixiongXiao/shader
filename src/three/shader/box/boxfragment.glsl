varying vec3 vPosition;
varying vec2 vUv;
uniform float uelapseTime;


void main() {

    gl_FragColor = vec4(vUv.x,vUv.y,1.0,vUv.y);

}
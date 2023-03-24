
varying vec3 vPosition;
varying vec2 vUv;


void main() {
    vPosition = position;
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4 ( position, 1.0);


    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
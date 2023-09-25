export default class MeshBasicMaterial {
  constructor() {
    this.type = "MeshBasicMaterial";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.isVerticesColor = true;

    this.vertexShader = /*glsl*/ `
            attribute vec4 v_position;
            attribute vec4 v_color;
            attribute vec2 uv;
            attribute vec3 normal;
            varying vec2 vUv;
            varying vec4 vColor;
            varying vec3 vNormal;
                        // 模型矩阵
            uniform mat4 modelMatrix;
                        // 视图投影矩阵
            uniform mat4 pvMatrix;

            void main(){
              gl_Position = pvMatrix * modelMatrix * v_position;

              vColor = v_color;
              vUv = uv;
              vNormal = normal;
            }
          `;
    this.fragmentShader = /*glsl*/ `
    precision mediump float;
    varying vec4 vColor;
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform sampler2D u_texture;
    void main(){
      vec4 textureColor = texture2D(u_texture,vUv);
      gl_FragColor = textureColor;
      // gl_FragColor = vec4(vUv,0.0,1.0);
    
    
    }`;
  }
}

import * as THREE from "three";
import gsap from "gsap";

import vertex from "./shader/plane/vertex.glsl";

import plane10fragment from "./shader/plane/plane10fragment.glsl"; // 模拟路灯

// 平面着色器特效
export default class VolumnLight {
  constructor(time) {
    this.timer = null;
    this.lightGroup = new THREE.Group();
    this.num = 3;
    this.geometry = new THREE.PlaneGeometry(12, 20, 126, 126);
    // this.geometry.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2));
    this.shaderMaterial = new THREE.ShaderMaterial({
      // wireframe:true,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.5,
      alphaTest: 0,
      uniforms: {
        uTime: {
          value: 0,
        },
        uelapseTime: time,
        uResolution: {
          value: new THREE.Vector2(150, 150),
        },
        uColor: {
          value: new THREE.Color("#F2EBD1"),
          // value: new THREE.Color('#00088C')
        },
        flowColor: {
          value: new THREE.Color("#74E88E"),
        },
        iResolution: {
          value: new THREE.Vector2(1000, 1000),
        },
        glowFactor: {
          value: 1.0, // 扩撒圈的明暗程度
        },

        speed: {
          value: 1.3,
        },
        opacity: {
          value: 1.25,
        },
        alpha: {
          value: 1.5,
        },
      },
      vertexShader: `
      
         varying vec3 vPosition;
         varying vec2 vUv;
         
         
         void main() {
             vPosition = position;
             vUv = uv;
             vec4 modelPosition = modelMatrix * vec4 ( position, 1.0);
         
         
             gl_Position = projectionMatrix * viewMatrix * modelPosition;
         }
     `,
      fragmentShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform vec3 uColor;
      
      float circle(vec2 _st, float _radius){
          vec2 pos = vec2(0.5)-_st;
          return smoothstep(1.0-_radius,1.0-_radius+_radius*0.2,1.-dot(pos,pos)*3.14);
      }
      
      void main()
      {
       float a = circle(vUv, 0.5);
       a =  a * pow(vUv.y , 3.0);
      	gl_FragColor = vec4(uColor, a); 
      }

     `,
    });
    for (let i = 0; i < this.num; i++) {
      const geometry = new THREE.PlaneGeometry(12, 20, 126, 126);

      const mesh = new THREE.Mesh(geometry, this.shaderMaterial);

      geometry.applyMatrix4(
        new THREE.Matrix4().makeRotationY(-Math.PI / (i + 1))
      );
      this.lightGroup.add(mesh);
    }
    this.mesh = this.lightGroup;
  }
  updateTime(time) {
    this.shaderMaterial.uniforms.uelapseTime.value = time;
  }
}

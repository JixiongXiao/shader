import * as THREE from "three";

import vertex from "./shader/flow/vertex.glsl";
import fragment from "./shader/flow/fragment.glsl";
import fragment2 from "./shader/flow/fragment2.glsl";

// // 水波纹平面
export default class Flow {
  constructor(time) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("./textures/rock.png");
    this.timer = null;
    this.geometry = new THREE.CylinderBufferGeometry(2, 4, 20, 20, 10, true);
    this.geometry.rotateX(Math.PI / 2);
    this.shaderMaterial = new THREE.ShaderMaterial({
      // wireframe:true,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {
          value: 0,
        },
        uelapseTime: time,
        uResolution: {
          value: new THREE.Vector2(150, 150),
        },
        uLowColor: {
          value: new THREE.Color("#000005"),
          // value: new THREE.Color('#00088C')
        },
        uHighColor: {
          value: new THREE.Color("#00044D"),
        },
        iResolution: {
          value: new THREE.Vector2(1000, 1000),
        },
        uTexture: {
          value: texture,
        },
      },
      vertexShader: vertex,
      fragmentShader: fragment2,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);
  }
  updateTime(time) {
    this.shaderMaterial.uniforms.uelapseTime.value = time;
  }
}

import * as THREE from "three";
import gsap from "gsap";
import fragment from "./shader/box/boxfragment.glsl";
import fragment1 from "./shader/box/boxfragment1.glsl";
import fragment2 from "./shader/box/boxfragment2.glsl";
import fragment3 from "./shader/box/boxfragment3.glsl";

import vertex from "./shader/box/vertex.glsl";

// 水波纹平面
export default class BoxEffect {
  constructor(time) {
    this.geometry = new THREE.BoxGeometry(3, 3, 3, 50, 50, 50);
    this.shaderMaterial = new THREE.ShaderMaterial({
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
      },
      vertexShader: vertex,
      // fragmentShader: fragment, // 常规
      // fragmentShader: fragment1, // 动态线条
      // fragmentShader: fragment2, // 动态波纹
      fragmentShader: fragment3, // 流动光面
    });
    this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);
    this.mesh.geometry.computeBoundingBox();
    const { max, min } = this.mesh.geometry.boundingBox;
    const uHeight = max.y - min.y;
    this.shaderMaterial.uniforms.uHeight = {
      value: uHeight,
    };
    gsap.to(this.shaderMaterial.uniforms.uTime, {
      value: 1,
      duration: 1,
      repeat: -1,
      ease: "linear",
    });
  }
  updateTime (time) {
    this.shaderMaterial.uniforms.uelapseTime.value = time;
  }
}

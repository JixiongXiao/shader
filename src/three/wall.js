import * as THREE from "three";
import gsap from "gsap";
import fragment from "./shader/wall/fragment.glsl";
import rotateWallFragment from "./shader/wall/rotateWallFragment.glsl";
import helicalWallFragment from "./shader/wall/helicalWallFragment.glsl";
import lineWallFragment from "./shader/wall/lineWallFragment.glsl";
import fadeWallFragment from "./shader/wall/fadeWallFragment.glsl";

import vertex from "./shader/wall/vertex.glsl";

// 水波纹平面
export default class Wall {
  constructor(time) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("./textures/spriteline2.png");
    this.geometry = new THREE.CylinderBufferGeometry(15, 15, 28, 4, 2, true);
    this.shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTexture: {
          value: texture,
        },
        uTime: {
          value: 0,
        },
        uelapseTime: time,
        uResolution: {
          value: new THREE.Vector2(150, 150),
        },
      },
      vertexShader: vertex,
      // fragmentShader:helicalWallFragment // 螺旋上升墙壁特效
      fragmentShader: lineWallFragment // 方块上升墙壁特效
      // fragmentShader: fadeWallFragment // 渐弱墙壁特效
      // fragmentShader: rotateWallFragment, // 旋转特效
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

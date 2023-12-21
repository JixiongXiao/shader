import * as THREE from "three";
import gsap from "gsap";

import vertex from "./shader/plane/vertex.glsl";

import plane1fragment from "./shader/plane/plane1fragment.glsl"; // 圆圈向外扩散特效
import plane2fragment from "./shader/plane/plane2fragment.glsl"; // 正方形边缘虚化
import plane3fragment from "./shader/plane/plane3fragment.glsl"; // 正方形转八边形动态
import plane4fragment from "./shader/plane/plane4fragment.glsl"; // 正方形转八边形动态
import plane5fragment from "./shader/plane/plane5fragment.glsl"; // 动态波动图形
import plane6fragment from "./shader/plane/plane6fragment.glsl"; // 动态波动图形
import plane7fragment from "./shader/plane/plane7fragment.glsl"; // 动态波动图形
import plane8fragment from "./shader/plane/plane8fragment.glsl"; // 正方形边框及圆形绘制函数
import plane9fragment from "./shader/plane/plane9fragment.glsl"; // 箭头
import fragment2 from "./shader/box/boxfragment2.glsl";
import noise from "./shader/plane/noise.glsl"; // 噪声函数
import fragment from "./shader/plane/fragment.glsl"; // 测试专用

// 平面着色器特效
export default class Plane {
  constructor(time) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("./textures/texture.png");
    const bg = textureLoader.load("./textures/bg1.png");
    this.timer = null;
    this.geometry = new THREE.PlaneGeometry(20, 20, 126, 126);
    this.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    this.shaderMaterial = new THREE.ShaderMaterial({
      // wireframe:true,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.5,
      uniforms: {
        uTime: {
          value: 0,
        },
        uelapseTime: time,
        uResolution: {
          value: new THREE.Vector2(150, 150),
        },
        uColor: {
          value: new THREE.Color("#38D9C7"),
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
        uTexture: {
          value: texture,
        },
        bg: {
          value: bg,
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
      vertexShader: vertex,
      // fragmentShader: fragment2,
      fragmentShader: plane8fragment,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);
  }
  updateTime(time) {
    this.shaderMaterial.uniforms.uelapseTime.value = time;
  }
}

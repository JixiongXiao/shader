import Object3D from "./Object3D.js";
import { Vector3, Matrix4, Euler, Quaternion } from "three";

export default class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.type = "Mesh";
    this.geometry = geometry;
    this.material = material;
    this.position = new Vector3(0, 0, 0);
    this.rotation = new Euler(0, 0, 0);
    this.scale = new Vector3(1, 1, 1);
    this.matrix = new Matrix4();
    this.quaternion = new Quaternion();
    this.rotationMatrix = new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);
  }
  updateRotationMatrix() {
    let mat = [
      [Math.cos(this.rotation.y), 0, Math.sin(this.rotation.y), 0],
      [0, 1, 0, 0],
      [-Math.sin(this.rotation.y), 0, Math.cos(this.rotation.y), 0],
      [0, 0, 0, 1],
    ];
    this.rotationMatrix = new Float32Array(mat.flat());
  }
  updateMatrix() {
    // 根据旋转的欧拉角，更新四元数
    this.quaternion.setFromEuler(this.rotation);
    // 根据位置、旋转、缩放，更新矩阵
    this.matrix.compose(this.position, this.quaternion, this.scale);
  }
}

import Object3D from "./Object3D.js";
export default class Scene extends Object3D {
  constructor() {
    super();
    this.type = "Scene";
    this.background = [0, 0, 0, 1];
  }
}

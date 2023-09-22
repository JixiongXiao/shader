import THR from "./framework/THR.js";
import { Vector3 } from "three";
export default class ThreePlus {
  constructor(dom) {
    this.domElement = document.querySelector(dom);
    this.state = 0;
    this.initBox(); // 静态BOX
    this.run();
    this.render();
  }
  initBox() {
    this.scene = new THR.Scene();
    this.camera = new THR.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(2, 2, 2);
    this.camera.lookAt(new Vector3(0, 0, 0));
    this.renderer = new THR.WebglRenderer(this.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.domElement.appendChild(this.renderer.domElement);
    let geometry = new THR.BoxGeometry(1, 1, 1);
    let material = new THR.MeshBasicMaterial({ color: 0xfff00 });
    this.cube = new THR.Mesh(geometry, material);
    this.scene.add(this.cube);
    this.controls = new THR.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
  }
  run() {
    this.setState(2);
  }
  setState(t) {
    this.state = t;
  }
  render() {
    if (this.state === 1) {
      this.renderer.render(this.scene, this.camera);
    } else if (this.state === 2) {
      // this.cube.rotation.y += 0.01;
      this.renderer.render(this.scene, this.camera);
    }
    requestAnimationFrame(this.render.bind(this));
  }
}

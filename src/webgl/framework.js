import THR from "./framework/THR.js";
import { Vector3, Euler } from "three";
export default class ThreePlus {
  constructor(dom) {
    this.domElement = document.querySelector(dom);
    this.state = 0;
    this.initScene();
    this.run();
    this.render();
  }
  initScene() {
    this.scene = new THR.Scene();
    this.camera = new THR.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(new Vector3(0, 0, 0));
    this.renderer = new THR.WebglRenderer(this.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.domElement.appendChild(this.renderer.domElement);
    this.controls = new THR.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.light = new THR.SpotLight([1, 1, 1, 1], 1);
    this.light.position.set(0, 5, 0);
    this.light.target.set(1, 0, 0);
    this.scene.add(this.light);
  }
  initBox() {
    let geometry = new THR.BoxGeometry(1, 1, 1);
    let material = new THR.MeshBasicMaterial({ color: 0xfff00 });
    this.cube = new THR.Mesh(geometry, material);
    this.scene.add(this.cube);
  }
  initPlane() {
    // 创建一个平面几何体
    let geometry = new THR.PlaneGeometry(2, 2);
    // 创建一个纹理对象
    let material = new THR.MeshBasicMaterial({
      color: 0x00ff00,
    });
    let loader = new THR.TextureLoader();
    loader.load("./textures/rock.png", (texture) => {
      material.map = texture;
    });
    // 创建一个网格对象
    this.plane = new THR.Mesh(geometry, material);
    // 将网格对象添加到场景中
    this.scene.add(this.plane);
  }
  initSphere() {
    let geometry = new THR.SphereGeometry(1, 32, 32);
    // 创建一个纹理对象
    let material = new THR.MeshPhongMaterial({
      color: [0.5, 0.5, 0.5, 1],
    });

    this.sphere = new THR.Mesh(geometry, material);
    this.scene.add(this.sphere);
  }
  initWhitePlane() {
    let geometry = new THR.PlaneGeometry(8, 8);
    let material = new THR.MeshPhongMaterial({
      color: [0.5, 0.5, 0.5, 1],
    });
    // 创建一个网格对象
    this.plane = new THR.Mesh(geometry, material);
    this.plane.rotation = new Euler(-Math.PI / 2, 0, 0);
    // 将网格对象添加到场景中
    this.scene.add(this.plane);
  }
  run() {
    // this.initBox(); // 静态BOX
    // this.initPlane();
    this.initSphere();
    this.initWhitePlane();
    this.setState(1);
  }
  setState(t) {
    this.state = t;
  }
  render() {
    if (this.state === 1) {
      // this.cube.rotation.y += 0.01;
      this.renderer.render(this.scene, this.camera);
    } else if (this.state === 2) {
      this.renderer.render(this.scene, this.camera);
    }
    requestAnimationFrame(this.render.bind(this));
  }
}

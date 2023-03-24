import * as THREE from "three";
import { Light } from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Example from "./example";
import Pipe from "./pipe";
import Tunnel from "./Tunnel";
import CusPlane from "./CusPlane";
import Plane from "./plane";
import FlyLineShader from "./FlyLineShader";
import Wall from "./wall";
import Water from "./water";
import Points from "./point";
import Flow from "./flow";
import BoxEffect from "./box";

export default class ThreePlus {
  constructor(selector) {
    this.clock = new THREE.Clock();
    this.domElement = document.querySelector(selector);
    this.width = this.domElement.clientWidth;
    this.height = this.domElement.clientHeight;
    this.elapsedTime = {
      value: 0,
    };
    this.init();
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControl();
    this.initAxesHelper();
    this.initLight();
    this.taskQueue();
    this.render();
  }
  initScene() {
    this.scene = new THREE.Scene();
  }
  initCamera() {
    // 2创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );
    // 3设置相机位置
    this.camera.position.set(10, 10, 10);
    this.camera.updateProjectionMatrix();
  }
  initRenderer() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    // 设置渲染尺寸的大小
    this.renderer.setSize(this.width, this.height);
    // 开启阴影贴图
    this.renderer.shadowMap.enabled = true;
    this.domElement.appendChild(this.renderer.domElement);
  }
  initControl() {
    // 创建轨道控制器
    this.control = new OrbitControls(this.camera, this.renderer.domElement);
    // 设置控制器阻尼,必须在动画循环里调用update
    this.control.enableDamping = true;
  }
  initAxesHelper() {
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
  }
  initLight() {
    this.ambientLight = new THREE.AmbientLight(0x222222, 4);
    this.pointLight = new THREE.PointLight(0xffffff);
    this.pointLight.position.set(0, 10, 0);
    this.pointLight.position.copy(this.camera.position);
    this.scene.add(this.ambientLight);
    this.scene.add(this.pointLight);
  }
  initBackground() {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load("./textures/powerplant.hdr", (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping; // 环境模糊效果
      // this.scene.background = tex;
      // this.scene.environment = tex;
      // this.scene.backgroundBlurriness = 1;
    });
  }
  render() {
    let deltaTime = this.clock.getDelta(); // 刷新帧数，返回一个固定数值
    this.elapsedTime.value = this.clock.getElapsedTime();
    this.control && this.control.update();
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
  taskQueue() {
    this.initBackground();
    // this.createFlow();
    // this.createPoint()
    // this.createWater()
    // this.createWall(); //墙面特效 4面圆柱体
    // this.createGrid() // 网格棋盘特效
    this.createPlane(); // 平面底特效
    // this.createTunnel() // 巷道
    // this.createPipe() // 管道
    // this.createTunnelComplete() // 完整巷道
    // this.createExample(); // 练习案例
    // this.createFlyLine() // 创建飞线
    // this.createBox(); // 盒子模型特效
  }
  // 创建网格平面
  createGrid() {
    this.gridPlane = new CusPlane(this.elapsedTime);
    // this.scene.add(this.plane.gridHelper)
    this.scene.add(this.gridPlane.mesh);
  }
  // 创建网格平面
  createPlane() {
    this.plane = new Plane(this.elapsedTime);
    // this.scene.add(this.plane.gridHelper)
    this.scene.add(this.plane.mesh);
  }
  // 创建管道
  createPipe() {
    const group = new THREE.Group();
    const arr1 = [new THREE.Vector3(-3, 0, 0), new THREE.Vector3(-3, 0, 5)];
    let pipe1 = new Pipe(arr1, 1);
    group.add(pipe1.mesh); // x
    const arr2 = [new THREE.Vector3(-8, 0, 5), new THREE.Vector3(-8, 0, 0)];
    let pipe2 = new Pipe(arr2, 1); // -x
    group.add(pipe2.mesh);
    const arr3 = [new THREE.Vector3(8, 0, 3), new THREE.Vector3(2, 0, 3)];
    let pipe3 = new Pipe(arr3, 1);
    group.add(pipe3.mesh);
    const arr4 = [new THREE.Vector3(2, 0, -3), new THREE.Vector3(8, 0, -3)];
    let pipe4 = new Pipe(arr4, 1);
    group.add(pipe4.mesh);
    const arr5 = [new THREE.Vector3(-3, 0, -3), new THREE.Vector3(-8, 0, -8)];
    let pipe5 = new Pipe(arr5, 1);
    group.add(pipe5.mesh);
    const arr6 = [new THREE.Vector3(-8, 4, -8), new THREE.Vector3(-5, 4, -1)];
    let pipe6 = new Pipe(arr6, 1);
    group.add(pipe6.mesh);
    this.scene.add(group);
  }
  // 创建巷道
  createTunnel() {
    const group = new THREE.Group();

    const arr1 = [new THREE.Vector3(-3, 0, 0), new THREE.Vector3(-3, 0, 6)];
    let pipe1 = new Tunnel(arr1, 1);
    group.add(pipe1.mesh); // x
    const arr2 = [
      new THREE.Vector3(-8, 0, 5),
      new THREE.Vector3(-8, 0, 0),
      new THREE.Vector3(-25, 0, 0),
    ];
    let pipe2 = new Tunnel(arr2, 1); // -x
    group.add(pipe2.mesh);
    const arr3 = [new THREE.Vector3(2, 0, 2), new THREE.Vector3(8, 0, 2)];
    let pipe3 = new Tunnel(arr3, 1);
    group.add(pipe3.mesh);
    console.log(pipe3.mesh);
    const arr4 = [
      new THREE.Vector3(2, 0, -3),
      new THREE.Vector3(8, 0, -3),
      // new THREE.Vector3(8,0,-15),
    ];
    let pipe4 = new Tunnel(arr4, 1);
    group.add(pipe4.mesh);
    const arr5 = [new THREE.Vector3(-3, 1, -3), new THREE.Vector3(-8, 1, -8)];
    let pipe5 = new Tunnel(arr5, 1);
    group.add(pipe5.mesh);
    const arr6 = [
      new THREE.Vector3(-8, 4, -8),
      new THREE.Vector3(-5, 4, -1),
      new THREE.Vector3(5, 4, -1),
    ];
    let pipe6 = new Tunnel(arr6, 1);
    group.add(pipe6.mesh);
    this.scene.add(group);
  }
  // 创建完整矿道模型
  createTunnelComplete() {
    // const vecEx = new THREE.Vector3(5,0,-5)
    // const vecXx = new THREE.Vector3(-20,0,-5)
    // console.log(vecXx.distanceTo(vecEx))
    const arr = [
      [
        new THREE.Vector3(-20, 0, -5),
        new THREE.Vector3(5, 0, -5),
        new THREE.Vector3(15, 0, 3),
        new THREE.Vector3(15, 0, 40),
      ],
      [new THREE.Vector3(-15, 0, -10), new THREE.Vector3(-15, 0, 40)],
      [
        new THREE.Vector3(20, 0, 3),
        new THREE.Vector3(-20, 0, 3),
        new THREE.Vector3(-30, 0, 10),
      ],
      [
        new THREE.Vector3(20, 0, 13),
        new THREE.Vector3(-20, 0, 13),
        new THREE.Vector3(-30, 0, 20),
      ],
      [
        new THREE.Vector3(-30, 0, -30),
        new THREE.Vector3(-30, 0, 20),
        new THREE.Vector3(-20, 0, 40),
        new THREE.Vector3(30, 0, 40),
      ],
      [new THREE.Vector3(30, 0, 40), new THREE.Vector3(30, 0, -10)],
      [new THREE.Vector3(30, 0, -10), new THREE.Vector3(20, 0, 3)],
      [new THREE.Vector3(-30, 0, -30), new THREE.Vector3(30, 0, -10)],
    ];
    const group = new THREE.Group();
    arr.forEach((vec, index) => {
      // vec[0].addScaledVector(vec[0],0.01)
      // vec[vec.length-1].addScaledVector(vec[vec.length-1],0.01)
      let tunnel = new Tunnel(vec, 1);
      tunnel.mesh.renderOrder = index;
      group.add(tunnel.mesh);
    });
    this.scene.add(group);
  }
  // 创建练习案例
  createExample() {
    this.example1 = new Example(this.elapsedTime);
    this.scene.add(this.example1.mesh);

    this.example2 = new Example(this.elapsedTime);
    this.scene.add(this.example2.mesh);
  }
  // 创建飞线
  createFlyLine() {
    const arr = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2.5, 4, 2.5),
      new THREE.Vector3(5, 2, 5),
    ];
    this.flyLine1 = new FlyLineShader(arr, "#0CA621", 2);
    this.scene.add(this.flyLine1.mesh);
  }
  // 创建特效墙壁
  createWall() {
    this.wall = new Wall(this.elapsedTime);
    this.scene.add(this.wall.mesh);
  }
  // 创建水面特效
  createWater() {
    this.water = new Water(this.elapsedTime);
    this.scene.add(this.water.mesh);
  }
  // 创建点材质
  createPoint() {
    this.points = new Points(this.elapsedTime);
    this.scene.add(this.points.mesh);
  }

  // 水流特效
  createFlow() {
    this.waterFlow = new Flow(this.elapsedTime);
    this.scene.add(this.waterFlow.mesh);
  }
  // 盒子模型特效
  createBox() {
    this.boxEffect = new BoxEffect(this.elapsedTime);
    this.scene.add(this.boxEffect.mesh);
  }
}

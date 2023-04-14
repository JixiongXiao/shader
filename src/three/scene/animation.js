import Stats from "three/examples/jsm/libs/stats.module.js";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import Proton, { P } from "three.proton.js";

import { Octree } from "three/examples/jsm/math/Octree.js";
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import tunnelShader from "../shader/animation/tunnelShader.glsl";
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from "three.meshline";
import { PathPointList } from "../material/PathPointList";
import { PathGeometry } from "../material/PathGeometry";

export default class ThreePlus {
  constructor(selector) {
    this.clock = new THREE.Clock();
    this.domElement = document.querySelector(selector);
    this.width = this.domElement.clientWidth;
    this.height = this.domElement.clientHeight;
    this.mixer = null;
    this.cameraCanMove = false;
    this.playerOnFloor = false;
    this.pointerSpeed = 0.5;
    this.originAngle = null; // radians
    this.maxAngle = null; // radians
    this._euler = new THREE.Euler(0, 0, 0, "XYZ");
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.direction = null; // 胶囊所在位置的点的法线切线
    this.elapsedTime = {
      value: 0,
    };
    this.keyStates = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      Space: false,
      isDown: false,
    };
    this.actionObj = {
      isRun: false,
    };
    this.modelPosition = {
      value: 0,
    };
    this.init();
  }

  init () {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLayers();
    this.initControl();
    this.initAxesHelper();
    this.initLight();
    this.initStat();
    this.taskQueue();
    this.render();
  }
  initScene () {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x88ccee);
  }
  initLayers () {
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(1);
  }
  initCamera () {
    // 2创建相机
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      1000
    );
    // 3设置相机位置
    this.camera.position.set(-5.5, 3.7, 7.5);
    this.camera.updateProjectionMatrix();
  }
  initRenderer () {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // 设置渲染尺寸的大小
    this.renderer.setSize(this.width, this.height);
    // 开启阴影贴图
    this.renderer.shadowMap.enabled = true;
    this.domElement.appendChild(this.renderer.domElement);
  }
  initControl () {
    // // 创建轨道控制器
    this.control = new OrbitControls(this.camera, this.renderer.domElement);
    // 第一人称控制器
    // this.control = new PointerLockControls(this.camera, this.renderer.domElement)
    // // 设置控制器阻尼,必须在动画循环里调用update
    this.control.enableDamping = true;
  }
  initStat () {
    this.stats = new Stats();
    this.stats.domElement.style.position = "absolute";
    this.stats.domElement.style.top = "0px";
    this.domElement.appendChild(this.stats.domElement);
  }
  initAxesHelper () {
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
  }
  initLight () {
    this.ambientLight = new THREE.AmbientLight(0x222222, 0.5);
    // this.scene.add(this.ambientLight)
    this.pointLight = new THREE.PointLight(0xffffff, 0.5);
    this.pointLight.position.set(-3, 15, 3);
    this.pointLight.castShadow = true;
    this.scene.add(this.pointLight);
    const pointLightHelper = new THREE.PointLightHelper(this.pointLight);
    this.scene.add(pointLightHelper);
  }
  render (time) {
    TWEEN.update(time);
    requestAnimationFrame(this.render.bind(this));
    let deltaTime = this.clock.getDelta(); // 刷新帧数
    this.elapsedTime.value = this.clock.getElapsedTime();
    this.control && this.control.update();
    if (this.mixer) {
      this.mixer.update(deltaTime);
      this.modelPosition.value = this.action.time / 100;
      // if(this.action.isRunning()){
      // 运动时动态修改模型方向
      //     this.adjustDirection(Math.floor(this.action.time))
      // }
    }
    if (this.proton) {
      this.proton.update();
    }
    // if(this.plane){
    //     // 从相机头出射线
    //     this.raycaster.setFromCamera(this.mouse, this.camera)
    //     this.intersects = this.raycaster.intersectObject(this.plane)
    // }
    this.stats.update();
    this.renderer.render(this.scene, this.camera);
  }
  taskQueue () {
    this.createEnv();
    this.addListenser(); // 监听事件
    this.initRaycasterEvent();
  }
  createEnv () {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("./model/terrain.glb", (gltf) => {
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
      const geometry = gltf.scene.children[0].children[0].geometry;
      this.plane = new THREE.Mesh(geometry, planeMaterial);
      this.plane.name = "地板";
      this.plane.receiveShadow = true;
      this.plane.rotation.x = -Math.PI / 2;
      //创建碰撞组
      this.collisionGroup = new THREE.Group();
      this.collisionGroup.add(this.plane);
      this.scene.add(this.collisionGroup);
      //创建八叉树
      this.worldOctree = new Octree();
      this.worldOctree.fromGraphNode(this.collisionGroup);

      // 创建一个octreeHelper
      const octreeHelper = new OctreeHelper(this.worldOctree);
      // this.scene.add(octreeHelper);
    });

    // 创建胶囊物体
    const capsuleGeometry = new THREE.CapsuleGeometry(0.35, 1, 32);
    const capsuleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
    });
    this.capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
    this.capsule.position.set(0, 2.85, 0);

    // 创建一个平面 用来判断胶囊朝向
    const capsuleBodyGeometry = new THREE.PlaneGeometry(1, 0.5, 1, 1);
    const capsuleBodyMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
    });
    const capsuleBody = new THREE.Mesh(
      capsuleBodyGeometry,
      capsuleBodyMaterial
    );
    capsuleBody.position.set(0, 0.5, 0);
    this.capsule.add(capsuleBody);

    this.camera.position.set(0, 5, -7);
    this.scene.add(this.capsule);

  }
  keyBoardEvent (code) {
    if (code === "Space") {
      this.action.paused = !this.action.paused;
    }
    if (code === "KeyD") {
      if (this.action.time > 1 && this.action.time < 100) {
        this.action.time += 0.5;
      }
    }
    if (code === "KeyA") {
      if (this.action.time > 1 && this.action.time < 100) {
        this.action.time -= 0.5;
      }
    }
    if (code === "KeyW") {
      if (this.action.timeScale >= 1 && this.action.timeScale < 10) {
        this.action.timeScale += 1;
      }
    }
    if (code === "KeyS") {
      if (this.action.timeScale > 1 && this.action.timeScale <= 10) {
        this.action.timeScale -= 1;
      }
    }
    if (code === 'KeyR') {
      // 测试通过矩阵旋转模型
      let mtx = new THREE.Matrix4();
      let position = new THREE.Vector3(5, 6, 5)
      let target = new THREE.Vector3(3, 2.85, 3)
      mtx.lookAt(position, target, this.capsule.up);
      let toRotate = new THREE.Quaternion().setFromRotationMatrix(mtx);
      this.capsule.applyQuaternion(toRotate)
    }
  }
  addListenser () {
    window.addEventListener("keydown", (event) => { }, false);
    window.addEventListener(
      "keyup",
      (event) => {
        // console.log(event.code)
        this.keyBoardEvent(event.code);
      },
      false
    );
    // window.addEventListener('mousemove',(event)=>{
    //     this.capsule.rotation.y -= event.movementX * 0.003;
    //     this.capsuleBodyControl.rotation.x += event.movementY * 0.003;
    // },false)
  }
  createRaycaster (point) {
    let start = new THREE.Vector3(point.x, 20, point.z);
    let direction = new THREE.Vector3(0, -1, 0);
    this.raycaster.set(start, direction);
    this.intersects = this.raycaster.intersectObject(this.plane);
    return this.intersects[0].point;
  }
  initRaycasterEvent () {
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener("dblclick", () => {
      this.terrainTest();
    });
  }
  terrainTest () {
    const location = [
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(13, 5, 5),
      new THREE.Vector3(20, 5, 17),
      new THREE.Vector3(-5, 5, 28),
      new THREE.Vector3(-15, 5, 38),
      new THREE.Vector3(-25, 5, 15),
    ];
    const curve = new THREE.CatmullRomCurve3(location); // 创建无高度的曲线
    // curve.curveType = 'centripetal';
    curve.curveType = "catmullrom";
    curve.tension = 0.2; //catmullrom 类型的张力
    const points = curve.getSpacedPoints(99);
    const curvePoints = []; // 有高度的曲线点集合
    points.forEach((point) => {
      let newPoint = this.createRaycaster(point);
      newPoint.y = newPoint.y + 0.9;
      curvePoints.push(newPoint);
    });
    const curveWithHeight = new THREE.CatmullRomCurve3(curvePoints); // 创建有高度曲线 用于计算模型朝向的切线
    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const geometry2 = new THREE.BufferGeometry().setFromPoints(location);
    // const line = new THREE.Line(geometry, material);
    // const line2 = new THREE.Line(geometry2, material);
    // this.scene.add(line2);
    // this.scene.add(line);
    this.actionObj.points = curvePoints;
    this.actionObj.curve = curveWithHeight; //曲线

    this.animationMoving(curvePoints);
    // this.createMeshLine() //用meshLine生成的路径
    // this.pathAnimate(); //tube生成的路径
    this.createPath(curvePoints) // 用fatLine生成
  }
  // 动画方式移动模型
  animationMoving (points) {
    // 动画
    let posArr = [];
    let timeArr = [];
    for (let i = 0; i < 100; i++) {
      timeArr.push(i); // 时间序列
      posArr.push(points[i].x, points[i].y, points[i].z); //位移坐标序列
    }
    // 生成时间序列
    let times = new Float32Array(timeArr);
    // 创建一个和时间序列相对应的位置坐标序列
    let posValues = new Float32Array(posArr);
    // 创建旋转四元素的序列
    let quaternionValues = this.culculateQuaternion();

    // 位移track
    let posTrack = new THREE.KeyframeTrack(".position", times, posValues);
    // 旋转track
    let rotateTrack = new THREE.QuaternionKeyframeTrack(
      ".quaternion",
      times,
      quaternionValues
    );
    let duration = 100;
    let clip = new THREE.AnimationClip("default", duration, [
      posTrack,
      rotateTrack,
    ]);
    this.mixer = new THREE.AnimationMixer(this.capsule);
    this.action = this.mixer.clipAction(clip);
    this.action.clampWhenFinished = true;
    this.action.repetitions = 1; // 只执行一次
    this.action.timeScale = 10; // 设定速度
    this.action.play();
  }
  adjustDirection (index) {
    if (this.index && this.index === index) {
      return;
    } else {
      this.index = index;
      // 切线作为朝向
      // const tangent = this.actionObj.curve.getTangentAt(this.index / 100)
      // const position = this.actionObj.curve.getPointAt(this.index / 100)
      // const looatVec = tangent.add(position)
      // this.capsule.lookAt(looatVec)
      // 切线作为朝向，用矩阵方式改变
      const position = this.actionObj.curve.getPointAt(this.index / 100);
      // target设置为下一个坐标，这种情况下在最后一帧不执行
      // const target = this.actionObj.curve.getPointAt((this.index + 1) / 100)
      const tangent = this.actionObj.curve.getTangentAt(this.index / 100);
      const target = tangent.add(position);
      let offsetAngle = 0;
      let mtx = new THREE.Matrix4();
      mtx.lookAt(position, target, this.capsule.up);
      mtx.multiply(
        new THREE.Matrix4().makeRotationFromEuler(
          new THREE.Euler(0, offsetAngle, 0)
        )
      );
      let toRotate = new THREE.Quaternion().setFromRotationMatrix(mtx);
      this.capsule.quaternion.slerp(toRotate, 0.2);
    }
  }
  // 计算旋转四元数
  culculateQuaternion () {
    const quaternionArr = [];
    for (let i = 0; i < 100; i++) {
      const position = this.actionObj.curve.getPointAt((i + 1) / 100);
      // 切线
      const tangent = this.actionObj.curve.getTangentAt((i + 1) / 100);
      const target = tangent.add(position);
      let mtx = new THREE.Matrix4();
      mtx.lookAt(position, target, this.capsule.up);
      let offsetAngle = 0; //看角度是否需要偏移
      mtx.multiply(
        new THREE.Matrix4().makeRotationFromEuler(
          new THREE.Euler(0, offsetAngle, 0)
        )
      );
      let toRotate = new THREE.Quaternion().setFromRotationMatrix(mtx);
      quaternionArr.push(toRotate);
    }
    const quaternionRawArr = [];
    quaternionArr.forEach((q) => {
      quaternionRawArr.push(q.x, q.y, q.z, q.w);
    });
    return new Float32Array(quaternionRawArr);
  }
  // 路径动画
  pathAnimate () {
    const texture = new THREE.TextureLoader().load(
      "./textures/spriteline3.png"
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    // texture.mapping = THREE.EquirectangularReflectionMapping
    const geometry = new THREE.TubeGeometry(
      this.actionObj.curve,
      64,
      0.2,
      3,
      false
    );
    const material = new THREE.MeshBasicMaterial({
      // color:0x00ff00,
      side: THREE.DoubleSide,
      // wireframe:true,
      transparent: true,
      // opacity:0.3,
      map: texture,
    });
    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTexture: {
          value: texture,
        },
        uelapseTime: this.elapsedTime,
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
                varying vec3 vPosition;
                varying vec2 vUv;
                uniform sampler2D uTexture;
                uniform float uelapseTime;
                
                void main() {
                    vec2 horizontal = vec2(fract(vUv.x - uelapseTime),vUv.y);
                    vec2 vertical = vec2(fract(vUv.y - uelapseTime),vUv.x);
                    vec4 textureColor = texture2D(uTexture,horizontal); //水平滚动
                    // vec4 textureColor = texture2D(uTexture,vertical); // 垂直滚动
                    // gl_FragColor = textureColor;
                    gl_FragColor = vec4(textureColor.xyz, 1.0);
                }  
            `,
      // fragmentShader: tunnelShader
    });
    const mesh = new THREE.Mesh(geometry, shaderMaterial);
    mesh.position.y = mesh.position.y - 0.9;
    this.scene.add(mesh);
  }
  // 用meshLine做路径
  createMeshLine () {
    let posArr = [];
    for (let i = 0; i < 100; i++) {
      posArr.push(
        this.actionObj.points[i].x,
        this.actionObj.points[i].y,
        this.actionObj.points[i].z
      ); //位移坐标序列
    }
    let value = new Float32Array(posArr);
    this.makeLine(value);
  }
  makeLine (geometry) {
    const texture = new THREE.TextureLoader().load(
      "./textures/spriteline3.png"
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // texture.mapping = THREE.EquirectangularReflectionMapping
    texture.repeat.set(1, 1);
    const g = new MeshLine();
    g.setPoints(geometry);
    const material = new MeshLineMaterial({
      useMap: false,
      // map:texture,
      color: new THREE.Color(0xed6a5a),
      opacity: 0.8,
      resolution: new THREE.Vector2(this.width * 2, this.height * 2),
      sizeAttenuation: false,
      lineWidth: 100,
    });
    const mesh = new THREE.Mesh(g, material);
    mesh.position.y = mesh.position.y - 0.6;
    this.scene.add(mesh);
  }
  // 用fatLine做路径
  createPath (points) {
    const up = new THREE.Vector3(0, 1, 0);
    const pathPointList = new PathPointList();
    pathPointList.set(points, 0.5, 10, up, false);
    const geometry = new PathGeometry();
    geometry.update(pathPointList, {
      width: 0.5,
      arrow: false,
      side: "both",
    });
    const vertexShader = `
       varying vec2 vUv;
       void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
       }
    `;
    const fragmentShader = `
      uniform vec3 uColor;
      uniform float modelPosition;
      uniform float uelapseTime;
      varying vec2 vUv;
      void main() {
          vec3 c = vec3 (0.9,0.4,0.5);
          float a = 1.0;
          float p = 30.0; //线段段数
          a = step (vUv.x, modelPosition);
          if(abs(0.5 - vUv.y) >= 0.4){
            c = uColor;
            float r = step(0.5, mod(vUv.x * p - uelapseTime, 1.0));
            a = r;
          }
          gl_FragColor = vec4(c.xyz,a);
      }
    `;
    var material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uelapseTime: this.elapsedTime,
        modelPosition: this.modelPosition,
        uColor: {
          value: new THREE.Color('#27A1D1')
        }
      }
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }
}

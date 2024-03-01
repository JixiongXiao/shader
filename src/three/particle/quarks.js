import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import {
  BloomEffect,
  EffectPass,
  SelectiveBloomEffect,
  EffectComposer,
  RenderPass,
  BlendFunction,
  OutlineEffect,
  SMAAEffect,
  GodRaysEffect,
  SSAOEffect,
  NormalPass,
  DepthDownsamplingPass,
  TextureEffect,
} from "postprocessing";
import {
  BatchedParticleRenderer,
  ConstantColor,
  ConstantValue,
  IntervalValue,
  ParticleSystem,
  PointEmitter,
  RandomColor,
  RenderMode,
  SphereEmitter,
  ConeEmitter,
  HemisphereEmitter,
  CircleEmitter,
  DonutEmitter,
  SizeOverLife,
  PiecewiseBezier,
  Bezier,
  ColorOverLife,
  ColorRange,
  SpeedOverLife,
  RandomQuatGenerator,
  Rotation3DOverLife,
  AxisAngleGenerator,
  GridEmitter,
  Noise,
  ApplyForce,
  ApplyCollision,
} from "three.quarks";

export default class ThreePlus {
  constructor(selector) {
    this.clock = new THREE.Clock();
    this.domElement = document.querySelector(selector);
    this.width = this.domElement.clientWidth;
    this.height = this.domElement.clientHeight;
    this.mixer = null;
    this.cameraCanMove = false;
    this.pointerSpeed = 0.5;
    this.originAngle = null; // radians
    this.maxAngle = null; // radians
    this._euler = new THREE.Euler(0, 0, 0, "XYZ");
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.intersects = null;
    this.models = [];
    this.elapsedTime = {
      value: 0,
    };
    this.init();
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLayers();
    this.initControl();
    this.initAxesHelper();
    this.initComposer();
    this.initLight();
    this.initGUI();
    this.taskQueue();
    this.render();
  }
  initScene() {
    this.scene = new THREE.Scene();
  }
  initLayers() {
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(1);
  }
  initCamera() {
    // 2创建相机
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      1000
    );
    // 3设置相机位置
    this.camera.position.set(-5.5, 3.7, 7.5);
    // this.camera.updateProjectionMatrix();
  }
  initRenderer() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: false,
      powerPreference: "high-performance",
    });
    // 设置渲染尺寸的大小
    this.renderer.setSize(this.width, this.height);
    // 开启阴影贴图
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    // this.renderer.setClearColor('#8AE3C4',1)
    this.domElement.appendChild(this.renderer.domElement);
    this.renderer.autoClearDepth = true;
  }
  initControl() {
    // // 创建轨道控制器
    this.control = new OrbitControls(this.camera, this.renderer.domElement);
    // 第一人称控制器
    // this.control = new PointerLockControls(this.camera, this.renderer.domElement)
    // // 设置控制器阻尼,必须在动画循环里调用update
    this.control.enableDamping = true;
  }
  initAxesHelper() {
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
  }
  initLight() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(this.ambientLight);
    this.spotLight = new THREE.PointLight(0xffffff, 0.5);
    this.spotLight.position.set(3, 2, 3);
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
    const spotLightHelper = new THREE.PointLightHelper(this.spotLight);
    this.scene.add(spotLightHelper);
  }
  initComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomEffect = new SelectiveBloomEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.01,
      luminanceSmoothing: 0.6,
      intensity: 3,
      // mipmapBlur:true,
    });
    this.bloomEffect.inverted = false;
    this.bloomEffect.ignoreBackground = true;
    this.bloomEffect.selection.set([]);
    this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.ADD,
      edgeStrength: 3,
      pulseSpeed: 0,
      visibleEdgeColor: 0xffffff,
      hiddenEdgeColor: 0x22090a,
      blur: false,
      xRay: true,
      usePatternTexture: false,
    });
    const smaaEffect = new SMAAEffect();
    //ssao效果
    const normalPass = new NormalPass(this.scene, this.camera);
    const ssaoEffect = new SSAOEffect(this.camera, normalPass.texture, {
      blendFunction: BlendFunction.MULTIPLY,
      samples: 32,
      rings: 3,
      luminanceInfluence: 0.1,
      radius: 0.01,
      bias: 0,
      intensity: 1,
    });

    // 创建通道
    const bloomPass = new EffectPass(this.camera, this.bloomEffect);
    this.composer.addPass(bloomPass);
    const effectPass = new EffectPass(
      this.camera,
      this.bloomEffect,
      this.outlineEffect,
      // ssaoEffect,
      smaaEffect
    );
    this.composer.addPass(effectPass);
  }
  initGUI() {
    this.gui = new GUI();
  }
  render() {
    requestAnimationFrame(this.render.bind(this));
    let deltaTime = this.clock.getDelta(); // 刷新帧数
    this.elapsedTime.value = this.clock.getElapsedTime();
    this.control && this.control.update();
    if (this.batchRenderer) {
      this.batchRenderer.update(deltaTime);
    }
    this.composer.render();
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }
  taskQueue() {
    this.initbatchRender7();
  }
  initBackground() {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load("./textures/powerplant.hdr", (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping; // 环境模糊效果
      this.scene.background = tex;
      this.scene.environment = tex;
      this.scene.backgroundBlurriness = 1;
    });
  }
  addListenser() {
    window.addEventListener("dblclick", () => {});
    window.addEventListener("mousedown", () => {
      this.cameraCanMove = true;
    });
    window.addEventListener("mouseup", () => {
      this.cameraCanMove = false;
    });
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
    });
  }
  // 基础配置488-489
  initbatchRender1() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );
    const particles = new ParticleSystem({
      duration: Infinity,
      looping: false,
      startLife: new IntervalValue(0, 5),
      startSpeed: new IntervalValue(0, 5),
      startSize: new IntervalValue(0.1, 0.3),
      startColor: new RandomColor(
        new THREE.Vector4(1, 0.91, 0.51, 1),
        new THREE.Vector4(1, 0.44, 0.16, 1)
      ),
      worldSpace: true,
      maxParticles: 5,
      emissionOverTime: new ConstantValue(100),
      shape: new PointEmitter(),
      material: new THREE.MeshBasicMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        side: THREE.DoubleSide,
      }),
      renderMode: RenderMode.BillBoard,
      renderOrder: 1,
    });
    particles.emitter.name = "particles";
    this.batchRenderer.addSystem(particles);
    this.scene.add(particles.emitter);
  }
  // 发射器形状490
  initbatchRender2() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );
    const particles = new ParticleSystem({
      duration: Infinity,
      looping: false,
      startLife: new IntervalValue(0, 2),
      startSpeed: new IntervalValue(0, 2),
      startSize: new IntervalValue(0.01, 0.05),
      startColor: new RandomColor(
        new THREE.Vector4(1, 0.91, 0.51, 1),
        new THREE.Vector4(1, 0.44, 0.16, 1)
      ),
      worldSpace: true,
      maxParticles: 5,
      emissionOverTime: new ConstantValue(300),
      shape: new DonutEmitter({
        radius: 5.0,
        thickness: 0.1,
        arc: Math.PI * 5,
        donutRadius: 0.2,
      }),
      // shape: new CircleEmitter({
      //   radius: 2.0,
      //   thickness: 0.2,
      //   arc: Math.PI * 2,
      // }),
      // shape: new HemisphereEmitter({
      //   radius: 2.0,
      //   thickness: 0.2,
      //   arc: Math.PI * 1,
      // }),
      // shape: new ConeEmitter({
      //   radius: 0.0,
      //   height: 1,
      //   arc: Math.PI * 2,
      //   angle: Math.PI / 9,
      // }),
      // shape: new SphereEmitter({
      //   radius: 0.5,
      //   thickness: 0.1,
      //   arc: Math.PI * 2,
      // }),
      material: new THREE.MeshBasicMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        side: THREE.DoubleSide,
      }),
      renderMode: RenderMode.BillBoard,
      renderOrder: 1,
    });
    particles.emitter.name = "particles";
    this.batchRenderer.addSystem(particles);
    this.scene.add(particles.emitter);
  }
  // 自定义几何材质491
  initbatchRender3() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );

    let boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    let material = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.5,
      color: 0xffffff,
    });
    const particles = new ParticleSystem({
      instancingGeometry: boxGeometry,
      duration: Infinity,
      looping: false,
      startLife: new IntervalValue(0, 5),
      startSpeed: new IntervalValue(0, 5),
      startSize: new IntervalValue(0.1, 0.3),
      startColor: new RandomColor(
        new THREE.Vector4(1, 0.91, 0.51, 1),
        new THREE.Vector4(1, 0.44, 0.16, 1)
      ),
      worldSpace: true,
      maxParticles: 5,
      emissionOverTime: new ConstantValue(100),
      shape: new PointEmitter(),
      material: material,
      renderMode: RenderMode.Mesh,
      renderOrder: 1,
    });
    particles.emitter.name = "particles";
    this.batchRenderer.addSystem(particles);
    this.scene.add(particles.emitter);
  }
  // 生命周期492
  initbatchRender4() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );
    const particles = new ParticleSystem({
      duration: Infinity,
      looping: false,
      startLife: new IntervalValue(0, 3),
      startSpeed: new IntervalValue(0, 5),
      startSize: new IntervalValue(0.1, 0.3),
      startColor: new RandomColor(
        new THREE.Vector4(1, 0.91, 0.51, 1),
        new THREE.Vector4(1, 0.44, 0.16, 1)
      ),
      worldSpace: true,
      maxParticles: 5,
      emissionOverTime: new ConstantValue(100),
      shape: new PointEmitter(),
      material: new THREE.MeshBasicMaterial({
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        side: THREE.DoubleSide,
      }),
      renderMode: RenderMode.BillBoard,
      renderOrder: 1,
    });
    particles.emitter.name = "particles";
    particles.addBehavior(
      new SizeOverLife(new PiecewiseBezier([[new Bezier(1, 0.95, 0.75, 0), 0]]))
    );
    particles.addBehavior(
      new ColorOverLife(
        new ColorRange(
          new THREE.Vector4(1, 0.9, 0.51, 1),
          new THREE.Vector4(1, 0.3, 0.21, 1)
        )
      )
    );
    particles.addBehavior(
      new SpeedOverLife(new PiecewiseBezier([[new Bezier(1, 0.75, 0.5, 0), 0]]))
    );
    this.batchRenderer.addSystem(particles);
    this.scene.add(particles.emitter);
  }
  // 树叶493
  initbatchRender5() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("./model/quarks/leave.glb", (gltf) => {
      let geo = gltf.scene.children[0].geometry;
      const particles = new ParticleSystem({
        instancingGeometry: geo,
        duration: Infinity,
        looping: false,
        startLife: new IntervalValue(0, 3),
        startSpeed: new IntervalValue(0, 5),
        startSize: new IntervalValue(0.1, 0.3),
        startColor: new RandomColor(
          new THREE.Vector4(1, 0.91, 0.51, 1),
          new THREE.Vector4(1, 0.44, 0.16, 1)
        ),
        startRotation: new RandomQuatGenerator(),
        worldSpace: true,
        maxParticles: 1000,
        emissionOverTime: new ConstantValue(20),
        shape: new PointEmitter(),
        material: gltf.scene.children[0].material,
        renderMode: RenderMode.Mesh,
        renderOrder: 1,
      });
      particles.emitter.name = "particles";

      particles.addBehavior(
        new Rotation3DOverLife(
          new AxisAngleGenerator(
            new THREE.Vector3(0, 0.5, 2).normalize(),
            new ConstantValue(1)
          ),
          // 自身局部空间进行旋转
          false
        )
      );
      particles.addBehavior(
        new SpeedOverLife(
          new PiecewiseBezier([[new Bezier(1, 0.75, 0.5, 0), 0]])
        )
      );
      this.batchRenderer.addSystem(particles);
      this.scene.add(particles.emitter);
    });
  }
  //网格发射器 494
  initbatchRender6() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("./model/quarks/leave.glb", (gltf) => {
      let geo = gltf.scene.children[0].geometry;
      const particles = new ParticleSystem({
        instancingGeometry: geo,
        duration: Infinity,
        looping: false,
        startLife: new IntervalValue(0, 10),
        startSpeed: new IntervalValue(0, 5),
        startSize: new IntervalValue(0.1, 0.3),
        startColor: new RandomColor(
          new THREE.Vector4(1, 0.91, 0.51, 1),
          new THREE.Vector4(1, 0.44, 0.16, 1)
        ),
        startRotation: new RandomQuatGenerator(),
        worldSpace: true,
        maxParticles: 1000,
        emissionOverTime: new ConstantValue(1000),
        shape: new GridEmitter({ width: 10, height: 10, rows: 10, column: 10 }), // 网格发射器
        material: gltf.scene.children[0].material,
        renderMode: RenderMode.Mesh,
        renderOrder: 1,
      });
      particles.emitter.name = "particles";
      particles.emitter.rotation.x = Math.PI / 2;
      particles.emitter.position.y = 10;

      particles.addBehavior(
        new Rotation3DOverLife(
          new AxisAngleGenerator(
            new THREE.Vector3(0, 0.5, 2).normalize(),
            new ConstantValue(1)
          ),
          // 自身局部空间进行旋转
          false
        )
      );
      particles.addBehavior(
        new SpeedOverLife(
          new PiecewiseBezier([[new Bezier(1, 0.75, 0.5, 0), 0]])
        )
      );
      this.batchRenderer.addSystem(particles);
      this.scene.add(particles.emitter);
    });
  }
  //噪声函数 494
  initbatchRender6() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("./model/quarks/煤1.glb", (gltf) => {
      let geo = gltf.scene.children[0].geometry;
      const particles = new ParticleSystem({
        instancingGeometry: geo,
        duration: Infinity,
        looping: false,
        startLife: new IntervalValue(0, 5),
        startSpeed: new IntervalValue(0, 3),
        startSize: new IntervalValue(0.1, 0.3),
        startColor: new RandomColor(
          new THREE.Vector4(1, 0.91, 0.51, 1),
          new THREE.Vector4(1, 0.44, 0.16, 1)
        ),
        startRotation: new RandomQuatGenerator(),
        worldSpace: true,
        maxParticles: 1000,
        emissionOverTime: new ConstantValue(100),
        shape: new GridEmitter({ width: 5, height: 5, rows: 1, column: 1 }), // 网格发射器
        material: gltf.scene.children[0].material,
        renderMode: RenderMode.Mesh,
        renderOrder: 1,
      });
      particles.emitter.name = "particles";
      particles.emitter.rotation.x = Math.PI / 2;
      particles.emitter.position.y = 10;

      particles.addBehavior(
        new Rotation3DOverLife(
          new AxisAngleGenerator(
            new THREE.Vector3(0, 0.5, 2).normalize(),
            new ConstantValue(1)
          ),
          // 自身局部空间进行旋转
          false
        )
      );
      particles.addBehavior(
        new SpeedOverLife(
          new PiecewiseBezier([[new Bezier(1, 0.75, 0.5, 0), 0]])
        )
      );
      particles.addBehavior(
        // 参数1 频率 参数2
        new Noise(new ConstantValue(0.1), new ConstantValue(2))
      );
      this.batchRenderer.addSystem(particles);
      this.scene.add(particles.emitter);
    });
  }
  //重力和碰撞 495
  initbatchRender7() {
    this.batchRenderer = new BatchedParticleRenderer();
    this.scene.add(this.batchRenderer);
    const texture = new THREE.TextureLoader().load(
      "./textures/quarks/particle_default.png"
    );
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("./model/quarks/煤1.glb", (gltf) => {
      let geo = gltf.scene.children[0].geometry;
      const particles = new ParticleSystem({
        instancingGeometry: geo,
        duration: Infinity,
        looping: false,
        startLife: new IntervalValue(0, 5),
        startSpeed: new IntervalValue(0, 3),
        startSize: new IntervalValue(0.1, 0.3),
        startColor: new RandomColor(
          new THREE.Vector4(1, 0.91, 0.51, 1),
          new THREE.Vector4(1, 0.44, 0.16, 1)
        ),
        startRotation: new RandomQuatGenerator(),
        worldSpace: true,
        maxParticles: 1000,
        emissionOverTime: new ConstantValue(100),
        shape: new GridEmitter({ width: 2, height: 5, rows: 2, column: 5 }), // 网格发射器
        material: gltf.scene.children[0].material,
        renderMode: RenderMode.Mesh,
        renderOrder: 1,
      });
      particles.emitter.name = "particles";
      particles.emitter.rotation.x = Math.PI / 2;
      particles.emitter.position.y = 8;

      particles.addBehavior(
        new Rotation3DOverLife(
          new AxisAngleGenerator(
            new THREE.Vector3(0, 0.5, 2).normalize(),
            new ConstantValue(1)
          ),
          // 自身局部空间进行旋转
          false
        )
      );
      particles.addBehavior(
        new SpeedOverLife(
          new PiecewiseBezier([[new Bezier(1, 0.85, 0.75, 0.65), 0]])
        )
      );
      // 噪声
      particles.addBehavior(
        // 参数1 频率 参数2
        new Noise(new ConstantValue(0.1), new ConstantValue(0.5))
      );
      particles.addBehavior(
        // 方向 加速度
        new ApplyForce(new THREE.Vector3(0, -1, 0), new ConstantValue(2))
      );
      particles.addBehavior(
        new ApplyCollision(
          {
            resolve: function (pos, normal) {
              if (pos.y < 0) {
                normal.set(0, 1, 0);
                return true;
              } else {
                return false;
              }
            },
          },
          0.3
        )
      );
      this.batchRenderer.addSystem(particles);
      this.scene.add(particles.emitter);
    });
  }
}

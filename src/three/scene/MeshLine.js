import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import Proton from 'three.proton.js';


import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'


export default class ThreePlus {
    constructor(selector) {
        this.clock = new THREE.Clock()
        this.domElement = document.querySelector(selector)
        this.width = this.domElement.clientWidth
        this.height = this.domElement.clientHeight
        this.mixer = null
        this.cameraCanMove = false
        this.pointerSpeed = 0.5;
        this.originAngle = null; // radians
		this.maxAngle = null; // radians
        this._euler = new THREE.Euler(0,0,0,'XYZ')
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()
        this.elapsedTime = {
            value:0
        }
        this.init()
    }

    init() {
        this.initScene()
        this.initCamera()
        this.initRenderer()
        this.initLayers()
        this.initControl()
        this.initAxesHelper()
        this.initLight()
        this.taskQueue()
        this.render()

    }
    initScene() {
        this.scene = new THREE.Scene()
    }
    initLayers() {
        this.bloomLayer = new THREE.Layers()
        this.bloomLayer.set(1)
    }
    initCamera() {
        // 2创建相机
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.width / this.height,
            0.1,
            1000
        )
        // 3设置相机位置
        this.camera.position.set(-5.5, 3.7, 7.5);
        // this.setAngle1()
        this.camera.updateProjectionMatrix();
        
    }
    initRenderer() {
        // 初始化渲染器
        this.renderer = new THREE.WebGLRenderer(
            { antialias: true}
        );
        // 设置渲染尺寸的大小
        this.renderer.setSize(this.width, this.height);
        // 开启阴影贴图
        this.renderer.shadowMap.enabled = true
        this.domElement.appendChild(this.renderer.domElement)
    }
    initControl() {
        // // 创建轨道控制器
        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        // 第一人称控制器
        // this.control = new PointerLockControls(this.camera, this.renderer.domElement)
        // // 设置控制器阻尼,必须在动画循环里调用update
        this.control.enableDamping = true
    }
    initAxesHelper() {
        this.axesHelper = new THREE.AxesHelper(5);
        this.scene.add(this.axesHelper)
    }
    initLight() {
        this.ambientLight = new THREE.AmbientLight(0x222222,0.5)
        this.scene.add(this.ambientLight)
        this.pointLight = new THREE.PointLight(0xffffff,1.5)
        this.pointLight.position.set(-3,5,3)
        this.pointLight.castShadow = true
        this.scene.add(this.pointLight)
        const pointLightHelper = new THREE.PointLightHelper(this.pointLight)
        this.scene.add(pointLightHelper)
    }
    initRaycasterEvent() {
        window.addEventListener("mousemove", (e)=>{
            this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
            this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
        })
        window.addEventListener("dblclick",()=>{
            if(this.intersects.length > 0){
            }
        })
        this.intersects = this.raycaster.intersectObject(this.scene)
    }
    render(time) {
        TWEEN.update(time)
        requestAnimationFrame(this.render.bind(this));
        let deltaTime = this.clock.getDelta(); // 刷新帧数
        this.elapsedTime.value = this.clock.getElapsedTime() 
        this.control && this.control.update();
        if(this.mixer) {
            this.mixer.update(deltaTime)
        }
        if(this.proton){

            this.proton.update()
        }
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.renderer.render(this.scene, this.camera)
    }
    taskQueue() {
        // this.createParticle1() // 瀑布型粒子
        this.createParticle2() // 火焰粒子
        // this.addListenser() // 测试动画暂停
    }
    createParticle1() {
        this.proton = new Proton()
        var emitter1 = this.createEmitter1({
            p:{
                x:0,
                y:0
            },
            Body:this.createMesh1('cube')
        })
        this.proton.addEmitter(emitter1)
        this.proton.addRender(new Proton.MeshRender(this.scene))
    }
    createEmitter1(obj) { // 瀑布粒子
        var emitter = new Proton.Emitter();
        // 每秒粒子数量，第一个参数为数量，如果有2个参数，则是参数a到参数b随机，比如new Proton.Span(1, 5)就是1到5之间的随机数
        //第二个参数为粒子发射间隔时间,如果参数只有1个，那就是每N秒发射一次，如果有2个参数就是参数a到参数b的随机数
        emitter.rate = new Proton.Rate(new Proton.Span(5, 10), new Proton.Span(0.1,0.3)); 
        emitter.addInitialize(new Proton.Mass(0.2));// 粒子投射的力度
        emitter.addInitialize(new Proton.Radius(2,3)); // 粒子发射时的角度，第一个参数为起始点的角度，第二个参数为结束点的角度
        emitter.addInitialize(new Proton.Life(2,1)); //粒子存在时间
        emitter.addInitialize(new Proton.Body(obj.Body));
        emitter.addInitialize(new Proton.Position(new Proton.BoxZone(10)));// emitter初值位置的发射范围，越小粒子发射点越集中
        emitter.addInitialize(new Proton.Velocity(100, new Proton.Vector3D(1, 1, 1), 10));// 发射速度，发射方向,发射方向离散值，第三个数值越小粒子朝向越统一 

        emitter.addBehaviour(new Proton.Rotate("random", "random"));
        emitter.addBehaviour(new Proton.Scale(1, 0.1)); // 尺寸，第一个参数为起始大小，第二个参数为消失前大小
        //Gravity
        emitter.addBehaviour(new Proton.Gravity(1));// 粒子下坠的重力

        emitter.p.x = obj.p.x;
        emitter.p.y = obj.p.y;
        emitter.emit();
        return emitter;
    }
    createMesh1(geo) {
        if (geo == "sphere") {
            var geometry = new THREE.SphereGeometry(10, 8, 8);
            var material = new THREE.MeshLambertMaterial({
                color: "#ff0000"
            });
        } else {
            var geometry = new THREE.BoxGeometry(1, 1, 1);
            var material = new THREE.MeshLambertMaterial({
                color: "#00ffcc"
            });
        }

        var mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
    createParticle2(){ // 火焰粒子
        this.proton = new Proton();
        this.proton.addEmitter(this.createEmitter2());
        this.proton.addRender(new Proton.SpriteRender(this.scene));
    }
    createSprite2() {
        var map = new THREE.TextureLoader().load("./textures/particle/dot.png");
        var material = new THREE.SpriteMaterial({
            map: map,
            color: 0xff0000,
            blending: THREE.AdditiveBlending,
            fog: true
        });
        var sprite = new THREE.Sprite(material)
        return sprite;
    }
    createEmitter2() {
        var emitter = new Proton.Emitter();
        emitter.rate = new Proton.Rate(new Proton.Span(15, 20), new Proton.Span(.08, .1));
        emitter.addInitialize(new Proton.Body(this.createSprite2()));
        emitter.addInitialize(new Proton.Mass(0.3));
        emitter.addInitialize(new Proton.Life(0, 1.5));
        emitter.addInitialize(new Proton.Position(new Proton.SphereZone(3)));
        // emitter.addInitialize(new Proton.Scale(1))
        emitter.addInitialize(new Proton.V(new Proton.Span(300, 480), new Proton.Vector3D(0, 1, 0), 5)); // 火焰高度，火焰角度和火苗分散角度
        emitter.addBehaviour(new Proton.RandomDrift(10, 10, 10, .05)); // x,y,z三个方向的漂移值
        //emitter.addBehaviour(new Proton.Alpha(1, 0.1));
        // emitter.addBehaviour(new Proton.Scale(0.5, 0));
        emitter.addBehaviour(new Proton.Scale(new Proton.Span(0.6, 0.8), 0));
        emitter.addBehaviour(new Proton.G(4));
        emitter.addBehaviour(new Proton.Color(['#FFC12F','#FF8024'], ['#ffff00', '#ffff11'], Infinity, Proton.easeOutSine));
        emitter.p.x = 0;
        emitter.p.y = 0;
        emitter.emit();
        return emitter;
    }
    addListenser() {
        window.addEventListener('dblclick',()=>{
        })
        window.addEventListener('mousedown',()=>{
            this.cameraCanMove = true
        })
        window.addEventListener('mouseup',()=>{
            this.cameraCanMove = false
        })
        window.addEventListener('mousemove',(event)=>{
            if(this.cameraCanMove){
			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            this._euler.setFromQuaternion(this.camera.quaternion)
            this._euler.y -= movementX * 0.002 * this.pointerSpeed;
            if(this.maxAngle.y > -0.4 && this.maxAngle.y <= this.originAngle.y){
                this.camera.quaternion.setFromEuler(this._euler)
                this.maxAngle = this._euler
            }
            }
        })
        
    }
    setAngle1() {
        this.camera.lookAt(new THREE.Vector3(-4.5,1.9,-0.85))
        const euler = new THREE.Euler(0,0,0,'XYZ')
        euler.setFromQuaternion(this.camera.quaternion)
        this.originAngle = euler
        this.maxAngle = euler
    }

}
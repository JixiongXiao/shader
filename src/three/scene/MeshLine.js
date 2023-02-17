import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';


export default class ThreePlus {
    constructor(selector) {
        this.clock = new THREE.Clock()
        this.domElement = document.querySelector(selector)
        this.width = this.domElement.clientWidth
        this.height = this.domElement.clientHeight
        this.mixer = null
        this.cameraCanMove = false
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()
        this.elapsedTime = {
            value:0
        }
        this.color = [
            0xed6a5a,
            0xf4f1bb,
            0x9bc1bc,
            0x5ca4a9,
            0xe6ebe0,
            0xf0b67f,
            0xfe5f55,
            0xd6d1b1,
            0xc7efcf,
            0xeef5db,
            0x50514f,
            0xf25f5c,
            0xffe066,
            0x247ba0,
            0x70c1b3
        ]
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
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.renderer.render(this.scene, this.camera)
    }
    taskQueue() {
        this.createLines1()
    }
    makeLine1(geometry, colorIndex) {
        const texture = new THREE.TextureLoader().load('./textures/spriteline3.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // texture.mapping = THREE.EquirectangularReflectionMapping
        texture.repeat.set( 1, 1 );
        const g = new MeshLine()
        g.setPoints(geometry)
        const material = new MeshLineMaterial({
            useMap:false,
            // map:texture,
            color:new THREE.Color(this.color[colorIndex]),
            opacity:0.8,
            resolution:new THREE.Vector2(this.width,this.height),
            sizeAttenuation:false,
            lineWidth:20
        })
        const mesh = new THREE.Mesh(g, material)
        this.scene.add(mesh)
    }
    createLines1() {
        var line = new Float32Array(600)
        for( var j = 0; j < 200 * 3; j += 3 ) {
            line[ j ] = -30 + .1 * j;
            line[ j + 1 ] = 5 * Math.sin( .01 *  j );
            line[ j + 2 ] = -20;
        }
        this.makeLine1( line, 0 );
        var line = new Float32Array( 600 );
        for( var j = 0; j < 200 * 3; j += 3 ) {
            line[ j ] = -30 + .1 * j;
            line[ j + 1 ] = 5 * Math.cos( .02 *  j );
            line[ j + 2 ] = -10;
        }
        this.makeLine1( line, 1 );
        
	    var line = new Float32Array( 600 );
	    for( var j = 0; j < 200 * 3; j += 3 ) {
	    	line[ j ] = -30 + .1 * j;
	    	line[ j + 1 ] = 5 * Math.sin( .01 *  j ) * Math.cos( .005 * j );
	    	line[ j + 2 ] = 0;
	    }
	    this.makeLine1( line, 2 );
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
        
    }

}
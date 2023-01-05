import * as THREE from "three";
import gsap from 'gsap';
import water1fragment from './shader/water/water1fragment.glsl'
import water2fragment from './shader/water/water2fragment.glsl'
import water3fragment from './shader/water/water3fragment.glsl'
import water4fragment from './shader/water/water4fragment.glsl'
import water5fragment from './shader/water/water5fragment.glsl'
import water6fragment from './shader/water/water6fragment.glsl'
import vertex from './shader/water/vertex.glsl'

// 水波纹平面
export default class Water {
    constructor(time) {
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load("./textures/rock.png")
        this.timer = null
        this.geometry = new THREE.PlaneGeometry(100,100,126,126)
        this.geometry.applyMatrix4(
            new THREE.Matrix4().makeRotationX(-Math.PI / 2)
        )
        // this.geometry = new THREE.CylinderBufferGeometry(2,6,20,20,10,true)
        // this.geometry.rotateX(Math.PI / 2)
        this.shaderMaterial = new THREE.ShaderMaterial({
            // wireframe:true,
            transparent:true,
            side:THREE.DoubleSide,
            uniforms:{
                uTime:{
                    value:0
                },
                uelapseTime:time,
                uResolution:{
                    value:new THREE.Vector2(150,150)
                },
                uLowColor: {
                    value: new THREE.Color('#000005')
                    // value: new THREE.Color('#00088C')
                },
                uHighColor: {
                    value: new THREE.Color('#00044D')
                },
                iResolution:{
                    value:new THREE.Vector2(1000,1000)
                },
                uTexture:{
                    value:texture
                }
            },
            vertexShader:vertex,
            fragmentShader:water6fragment
        })
        this.mesh = new THREE.Mesh(this.geometry,this.shaderMaterial)
        

    }
    updateTime(time) {
        this.shaderMaterial.uniforms.uelapseTime.value = time
    }

}
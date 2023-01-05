import * as THREE from "three";
import gsap from 'gsap';
import fragment from './shader/example/fragment.glsl'
import vertex from './shader/example/vertex.glsl'

export default class Example {
    constructor() {
        this.geometry = new THREE.PlaneGeometry(10,20,512,512)
        this.shaderMaterial = new THREE.ShaderMaterial({
            side:THREE.DoubleSide,
            transparent:true,
            blending: THREE.MultiplyBlending,
            uniforms:{
                iResolution:{
                    value:new THREE.Vector2(100,100)
                },
                iTime:{
                    value:0.0
                }
            },
            vertexShader:vertex,
            fragmentShader:fragment
        })
        this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial)
    }
    updateTime(time) {
        this.shaderMaterial.uniforms.iTime.value = time
    }
}
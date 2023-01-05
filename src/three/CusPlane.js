import * as THREE from "three";
import gsap from 'gsap';
import gridFragment from './shader/gridPlane/fragment.glsl'
import gridVertex from './shader/gridPlane/vertex.glsl'

// 水波纹平面
export default class CusPlane {
    constructor(time) {
        this.timer = null
        this.geometry = new THREE.PlaneGeometry(10,10,126,126)
        this.geometry.applyMatrix4(
            new THREE.Matrix4().makeRotationX(-Math.PI / 2)
        )
        // 网格plane的着色器参数
        const gridUniforms = {
            uTime:time,
            uColor:{ //平面颜色
                value:new THREE.Color('#0F06FF')
            },
            uCircleColor:{ //光圈颜色
                value:new THREE.Color('#1F90FF')
            },
            uSpreadTime:{
                value:0.0
            },
            uSpreadCenter:{
                value:new THREE.Vector2(0,0)
            },
            uSpreadWidth:{ // 扩散光圈宽度
                value:0.2
            },
            uScale:{ // 平面起伏幅度s
                value:0.2
                // value:0.0
            },
            uFrequency:{ // 波动频率
                value:2.0
                // value:0.0
            },
            uIntensity:{ // 水纹密集度
                value:2.0
            },
            uGridWidth:{ // 网格线条宽度
                value:0.03
            },
            uDivisionX:{ // X轴网格数量
                value:20.0
            },
            uDivisionY:{ // Y轴网格数量
                value:20.0
            },
            uMoveSpeed:{ // 网格左移速度
                value:0.0
                // value:0.05
            }
        }
        this.shaderMaterial = new THREE.ShaderMaterial({
            // wireframe:true,
            transparent:true,
            side:THREE.DoubleSide,
            uniforms:gridUniforms,
            vertexShader:gridVertex, // 波动网格特效
            fragmentShader:gridFragment// 波动网格特效
        })
        this.mesh = new THREE.Mesh(this.geometry,this.shaderMaterial)
        
        this.animate = gsap.to(this.shaderMaterial.uniforms.uSpreadTime, {
            value: 15,
            duration: 5,
            ease: 'none',
            onComplete:()=>{
                this.resetAnimate()
            }
        })
    }
    updateTime(time) {
        this.shaderMaterial.uniforms.uTime.value = time
    }
    resetAnimate() {
        const num =  Math.ceil(Math.random() * 10 + 2) * 1000
        this.timer = setTimeout(()=>{
            this.animate.restart()
            clearTimeout(this.timer)
            this.timer = null
        },num)
    }
}
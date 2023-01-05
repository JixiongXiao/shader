import * as THREE from "three";

export default class Points {
    constructor(time) {
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load('./textures/particle/3.png')
        this.geometry = new THREE.BufferGeometry()
        this.material = new THREE.PointsMaterial({
            size:1,
            color:'#2771DB',
            depthWrite:false,
            transparent:true,
            map:texture,
            alphaMap:texture,
            blending:THREE.AdditiveBlending,
            sizeAttenuation:true,
        })
        const maxRadius = 20
        const maxAngle = Math.PI / 2 
        this.positions = []
        let num = 300
        for (let i = 0; i < num * 3; i++) {
            // let angle = maxAngle * this.ran(2,8)
            let angle = maxAngle * ((Math.random() + 0.5) / 3)
            let random = Math.pow(Math.random() * 2 -1, 3) *Math.random() * 5
            let radius = Math.random()* maxRadius
            this.positions.push(
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                random
            )
        }
        const geo = new THREE.Float32BufferAttribute(this.positions,3)
        this.geometry.setAttribute('position', geo)
        this.mesh = new THREE.Points(this.geometry, this.material)
    }
    ran(lowerValue,upperValue) {
     return Math.floor(Math.random() * (upperValue - lowerValue + 1) + lowerValue) * 0.1;
    }
}
// export default class Points {
//     constructor(time) {
//         const textureLoader = new THREE.TextureLoader()
//         const texture = textureLoader.load('./textures/particle/3.png')
//         const params = {
//             count :3000,
//             size:0.5,
//             radius:10,
//             branch:3,
//             color:'#2771DB',
//             rotateScale:0.1
//         }
//         this.material = new THREE.PointsMaterial({
//             size:params.size,
//             color:new THREE.Color(params.color),
//             depthWrite:false,
//             transparent:true,
//             map:texture,
//             alphaMap:texture,
//             blending:THREE.AdditiveBlending,
//             sizeAttenuation:true,
//         })
//         this.geometry = new THREE.BufferGeometry()
//         this.positions = new Float32Array(params.count * 3)
//         this.colors = new Float32Array(params.count * 3)
//         for (let i = 0; i < params.count * 3; i++) {
//             const current = i * 3;
//             const branchAngel = (i % params.branch) * ((2 * Math.PI)/params.branch);
//             const radius = Math.random() * params.radius * Math.pow(Math.random(), 3);
//             // 3个维度的随机值
//             const randomX = (Math.pow(Math.random() * 2 -1, 3) * (params.radius - radius)) / (params.radius / 2);
//             const randomY = (Math.pow(Math.random() * 2 -1, 3) * (params.radius - radius)) / (params.radius / 2);
//             const randomZ = (Math.pow(Math.random() * 2 -1, 3) * (params.radius - radius)) / (params.radius / 2);
//             this.positions[current] = Math.cos(branchAngel + radius * params.rotateScale) * radius + randomX;
//             this.positions[current + 1] = randomY;
//             this.positions[current + 2] = Math.sin(branchAngel + radius * params.rotateScale) * radius + randomZ;
//         }
//         const geo = new THREE.BufferAttribute(this.positions,3)
//         this.geometry.setAttribute('position', geo)
//         this.mesh = new THREE.Points(this.geometry, this.material)
//     }
//     ran(lowerValue,upperValue) {
//      return Math.floor(Math.random() * (upperValue - lowerValue + 1) + lowerValue) * 0.1;
//     }
// }

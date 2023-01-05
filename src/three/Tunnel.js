import * as THREE from "three";

export default class Tunnel {
    constructor(vec3Group,size) {
        this.vec3Array = vec3Group
        this.extraAngle = 0
        this.vec2Group = []
        this.type = null
        this.topSegs = 20 // 顶部段数
        // 判断第一个向量A和第二个向量B的方向
        const A = this.vec3Array[0]
        const B = this.vec3Array[1]
        if(A.z === B.z) {
            // 如果A和B的z相等，说明向量AB平行于x轴
            if(this.vec3Array.length <= 2){
                // 该情况下一条路径只有A和B两个坐标，A是起始点
                // 当B.x > A.x时，说明向量AB朝向坐标原点 和X轴方向相反
                const v1 = new THREE.Vector2(-size,0) // 圆弧形在上边
                const v2 = new THREE.Vector2(-size,-size)
                const v3 = new THREE.Vector2(size,-size)
                this.vec2Group = [v1,v2,v3]
                this.type = 'top'
                // 当B.x < A.x时，说明AB是由原点方向为起始点 和X轴方向相同，此时通过reverse改变AB顺序变成向量BA
                // 当只有2个顶点时，此时reverse并不会改变管道的朝向，因为向量AB和向量BA都是平行于同一个轴线
                B.x < A.x && this.vec3Array.reverse()
            } else {
                // 当有三个以上的向量时，此时如果reverse，，假设数组有ABC三个向量，此时该管道起始点会变成向量CB，且不再平行于X轴
                // 所以有3个以上的向量时不再颠倒向量顺序
                if(B.x < A.x) {
                    this.extraAngle = Math.PI
                    const v1 = new THREE.Vector2(size,0) // 圆弧形在下
                    const v2 = new THREE.Vector2(size,size)
                    const v3 = new THREE.Vector2(-size,size)
                    this.vec2Group = [v1,v2,v3]
                    this.type = 'bottom'
                } else {
                    const v1 = new THREE.Vector2(-size,0) // 圆弧形在上边
                    const v2 = new THREE.Vector2(-size,-size)
                    const v3 = new THREE.Vector2(size,-size)
                    this.vec2Group = [v1,v2,v3]
                    this.type = 'top'
                }

            }
        } else {
            // 如果A和B的z相等，说明向量AB不平行于x轴
            this.extraAngle = Math.PI / 2 // 非平行于x轴的情况
            const v1 = new THREE.Vector2(0,-size) // 圆弧形在左边
            const v2 = new THREE.Vector2(size,-size)
            const v3 = new THREE.Vector2(size,size)
            this.vec2Group = [v1,v2,v3]
            this.type = 'left'
        }

            // 着色器材质
        this.shaderMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side:THREE.DoubleSide,
        // side:THREE.BackSide,
        uniforms: {
        },
        vertexShader: `
              varying vec2 vUv;
              
              void main() {
                  vUv = uv;
                  vec4 viewPosition = viewMatrix * modelMatrix * vec4(position,1.0);
                  gl_Position = projectionMatrix * viewPosition;
              }
              `,
        fragmentShader: `
              varying vec2 vUv;
              
              void main() {
                  gl_FragColor= vec4(1.0,0.0,0.0,vUv.x);
              }
              `,
      });
        const closedSpline = new THREE.CatmullRomCurve3( this.vec3Array )
        closedSpline.curveType = 'catmullrom';
        closedSpline.closed = false;
        closedSpline.tension = 0;
        
        const extrudeSettings = {
            steps: 10 ,
            bevelEnabled: false,
            extrudePath: closedSpline,
        };
        const arr = [], count = this.topSegs;
        for ( let i = 0; i < count; i ++ ) {
            const l = size;
            const a = (i / count * Math.PI) + this.extraAngle;
            arr.push( new THREE.Vector2( Math.floor(Math.cos( a ) * l *1000) / 1000, Math.floor(Math.sin( a ) * l * 1000)/1000 ) );
        }
        const total = [...arr,...this.vec2Group]
        const shape = new THREE.Shape( total ); 
        const linearShape = this.createUV(vec3Group,size)
		const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
        geometry.attributes.uv = linearShape.attributes.uv.clone()
        linearShape.dispose()
        const texture = new THREE.TextureLoader().load('./textures/rock1.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // texture.mapping = THREE.EquirectangularReflectionMapping
        texture.repeat.set( 1, 1 );
        // const material1 = new THREE.MeshLambertMaterial( { color: 0x00fff000, wireframe: true } );
        // const material1 = new THREE.MeshLambertMaterial( { color: 0x00fff000, wireframe: true, side:THREE.BackSide, } );
		// const material1 = new THREE.MeshStandardMaterial( { wireframe: false, side:THREE.BackSide,map:texture,polygonOffset: false,polygonOffsetFactor:0,polygonOffsetUnits:0 } );
		const material1 = new THREE.MeshLambertMaterial( { wireframe: false, side:THREE.BackSide,map:texture,polygonOffset: false,polygonOffsetFactor:0,polygonOffsetUnits:0 } );
        const material2 = new THREE.MeshStandardMaterial( { wireframe: true, side:THREE.BackSide,transparent:true,opacity:1 } );
		// this.mesh = new THREE.Mesh( geometry, [material2,this.shaderMaterial] );
		this.mesh = new THREE.Mesh( geometry, [material2,material1] );
        this.mesh.geometry.computeBoundingBox()
    }
    createUV(group,size) {
        // 借用直线管道的UV
        let length = 0
        group.reduce((pre,cur)=>{
            let distance = pre.distanceTo(cur)
            length += distance
            return cur
        })
        const pathArr = [
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,length)
        ]
        const closedSpline = new THREE.CatmullRomCurve3( pathArr )
        closedSpline.curveType = 'catmullrom';
        closedSpline.closed = false;
        closedSpline.tension = 0;
        const extrudeSettings = {
            steps: 10 ,
            bevelEnabled: false,
            extrudePath: closedSpline,
        };
        const arr = [], count = this.topSegs;

        for ( let i = 0; i < count; i ++ ) {
            const l = size;
            const a = (i / count * Math.PI) + Math.PI / 2;
            arr.push( new THREE.Vector2( Math.floor(Math.cos( a ) * l *1000) / 1000, Math.floor(Math.sin( a ) * l * 1000)/1000 ) );
        }
        const v1 = new THREE.Vector2(0,-size) // 圆弧形在左边
        const v2 = new THREE.Vector2(size,-size)
        const v3 = new THREE.Vector2(size,size)
        const total = [...arr,v1,v2,v3]
        const shape = new THREE.Shape( total );
        const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings )
        return geometry
    }
}
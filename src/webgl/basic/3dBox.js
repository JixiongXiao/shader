export default class Box3D {
  constructor(canvas, gl) {
    this.canvas = canvas;
    this.gl = gl;
    this.angle = 0.0;
    this.initShader();
    this.initProgram();
    this.initDraw();
  }
  initShader() {
    // 创建顶点着色器
    this.vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(
      this.vShader,
      /*glsl */ `
    attribute vec4 v_position;
    attribute vec4 v_color;
    uniform mat4 u_matrix;
    uniform float angle;
    varying vec4 vColor;
    // 获取相机uniform
    uniform vec3 caPosition;
    uniform vec3 caDirection;
    uniform vec3 caUp;
    uniform float caAspect;
    uniform float caHeight;
    uniform float caFar;
    uniform float caNear;

    void main() {
      vColor = v_color;
      mat4 rotateMatrix = mat4(
       cos(angle), 0, sin(angle), 0,
             0, 1, 0, 0,
      -sin(angle), 0, cos(angle), 0,
      0, 0, 0, 1
      );
     
     mat4 tMatrix = mat4(
      1.0,0.0,0.0,0.0,
      0.0,1.0,0.0,0.0,
      0.0,0.0,1.0,0.0,
      -caPosition.x,-caPosition.y,-caPosition.z,1.0
     );
     // 旋转相机的基变换矩阵
     vec3 zAxis = normalize(caDirection);
     vec3 yAxis = normalize(caUp);
     vec3 xAxis = cross(yAxis, zAxis);
     
     //旋转相机逆变换矩阵
    mat4 rMatrix = mat4(
      xAxis.x,yAxis.x,zAxis.x,0.0,
      xAxis.y,yAxis.y,zAxis.y,0.0,
      xAxis.z,yAxis.z,zAxis.z,0.0,
      0.0,0.0,0.0,1.0
     );

     //正交投影移动
     mat4 oTranslateMatrix = mat4(
      1.0,0.0,0.0,0.0,
      0.0,1.0,0.0,0.0,
      0.0,0.0,1.0,0.0,
      0.0,0.0,-(caNear+caFar)/2.0,1.0
     );

     // 正交投影缩放
     mat4 oScaleMatrix = mat4(
      1.0/(caAspect*caHeight),0.0,0.0,0.0,
      0.0,1.0/caHeight,0.0,0.0,
      0.0,0.0,2.0/(caFar - caNear),0.0,
      0.0,0.0,0.0,1.0
     );
     gl_Position = oScaleMatrix * oTranslateMatrix* rMatrix * tMatrix * rotateMatrix *  v_position; // 无法执行
    }`
    );
    this.gl.compileShader(this.vShader);
    // 创建片元着色器
    this.fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(
      this.fShader,
      /*glsl */ `
      precision mediump float;
      uniform vec4 uColor;
      varying vec4 vColor;
    void main() {
     // gl_FragColor = vec4(v_color.xyz,1.0);
     gl_FragColor = vec4(vColor.xyz,1.0);
    }
    `
    );
    this.gl.compileShader(this.fShader);
  }
  initProgram() {
    // 创建着色器程序, 并关联顶点，片元着色器
    const program = this.gl.createProgram();
    this.gl.attachShader(program, this.vShader);
    this.gl.attachShader(program, this.fShader);
    this.gl.linkProgram(program);

    // 使用着色器
    this.gl.useProgram(program);
    this.program = program;
  }
  initDraw() {
    // 创建顶点数据
    this.position = this.gl.getAttribLocation(this.program, "v_position");
    // 创建缓冲区
    this.pBuffer = this.gl.createBuffer();
    // 绑定缓冲区
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pBuffer);

    // 将顶点数据提供给position
    this.gl.vertexAttribPointer(
      this.position,
      4, // 迭代数，数组中每2个单位为一组
      this.gl.FLOAT,
      false,
      0, //
      0 // 从第0个开始
    );

    // 开启attribute变量
    this.gl.enableVertexAttribArray(this.position);

    this.vColor = this.gl.getAttribLocation(this.program, "v_color");
    this.cBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
    this.gl.vertexAttribPointer(this.vColor, 4, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.vColor);

    this.uColor = this.gl.getUniformLocation(this.program, "uColor");
    this.gl.uniform4f(this.uColor, 1.0, 0.0, 0.0, 1.0);

    this.uAngle = this.gl.getUniformLocation(this.program, "angle");
    this.gl.uniform1f(this.uAngle, this.angle);

    // umatrix传值
    let mat = [
      [Math.cos(this.angle), 0, Math.sin(this.angle), 0],
      [0, 1, 0, 0],
      [-Math.sin(this.angle), 0, Math.cos(this.angle), 0],
      [0, 0, 0, 1],
    ];
    this.u_matrix = this.gl.getUniformLocation(this.program, "u_matrix");
    this.gl.uniformMatrix4fv(
      this.u_matrix,
      false,
      new Float32Array(mat.flat())
    );

    this.start();
  }
  setCamera() {
    this.camera = {
      position: [1, 1, 1],
      direction: [-1, -1, -1],
      up: [-1, 2, -1],
      near: 0,
      far: 10,
      height: 3,
      aspect: this.canvas.width / this.canvas.height,
    };

    // 往着色器传递相机数据
    this.caPosition = this.gl.getUniformLocation(this.program, "caPosition");
    this.gl.uniform3fv(this.caPosition, this.camera.position);
    this.caDirection = this.gl.getUniformLocation(this.program, "caDirection");
    this.gl.uniform3fv(this.caDirection, this.camera.direction);
    this.caUp = this.gl.getUniformLocation(this.program, "caUp");
    this.gl.uniform3fv(this.caUp, this.camera.up);
    this.caAspect = this.gl.getUniformLocation(this.program, "caAspect");
    this.gl.uniform1f(this.caAspect, this.camera.aspect);
    this.caFar = this.gl.getUniformLocation(this.program, "caFar");
    this.gl.uniform1f(this.caFar, this.camera.far);
    this.caNear = this.gl.getUniformLocation(this.program, "caNear");
    this.gl.uniform1f(this.caNear, this.camera.near);
    this.caHeight = this.gl.getUniformLocation(this.program, "caHeight");
    this.gl.uniform1f(this.caHeight, this.camera.height);
  }

  start() {
    let vertices = [
      [-0.5, -0.5, 0.5, 1.0],
      [-0.5, 0.5, 0.5, 1.0],
      [0.5, 0.5, 0.5, 1.0],
      [0.5, -0.5, 0.5, 1.0],
      [-0.5, -0.5, -0.5, 1.0],
      [-0.5, 0.5, -0.5, 1.0],
      [0.5, 0.5, -0.5, 1.0],
      [0.5, -0.5, -0.5, 1.0],
    ];

    // 根据顶点设置6个面
    let face = [
      [1, 0, 3, 2],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
      [6, 5, 1, 2],
      [4, 5, 6, 7],
      [5, 4, 0, 1],
    ];
    let faceColors = [
      [1.0, 0.0, 0.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [1.0, 1.0, 0.0, 1.0],
      [1.0, 0.0, 1.0, 1.0],
      [0.0, 1.0, 1.0, 1.0],
    ];
    this.points = [];
    let colors = [];
    face.forEach((face, i) => {
      let faceIndices = [face[0], face[1], face[2], face[0], face[2], face[3]];
      faceIndices.forEach((index) => {
        this.points.push(vertices[index]);
        colors.push(faceColors[i]);
      });
    });

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.points.flat()),
      this.gl.STATIC_DRAW
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(colors.flat()),
      this.gl.STATIC_DRAW
    );
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.points.length);
  }
  update() {
    this.angle += 0.01;

    this.gl.uniform1f(this.uAngle, this.angle);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.points.length);
  }
}

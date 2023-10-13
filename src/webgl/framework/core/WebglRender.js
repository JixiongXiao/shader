import MeshDepthMaterial from "./MeshDepthMaterial";
export default class WebglRenderer {
  constructor() {
    this.type = "WebGLRenderer";
    this.programs = {};
    this.domElement = document.createElement("canvas"); // 创建一个canvas元素
    this.gl = this.domElement.getContext("webgl2"); // 获取webgl上下文

    // 设置深度检测
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.lightArray = [];

    // 设置阴影纹理
    this.shadowMap = {
      enabled: true,
    };
  }
  setSize(width, height) {
    this.domElement.width = width;
    this.domElement.height = height;
    this.domElement.style.width = width + "px";
    this.domElement.style.height = height + "px";
    this.gl.viewport(0, 0, width, height);
  }

  render(scene, camera) {
    this.gl.clearColor(...scene.background);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    // 循环遍历场景中的物体
    scene.traverse((object) => {
      if (object.type === "Mesh") {
        // 如果是网格对象，就调用渲染网格对象的方法
        this.renderMesh(object, camera);
      }
      if (object.isLight && object.isAdd === undefined) {
        this.lightArray.push(object);
        object.isAdd = true;
        // 判断灯光如果投射阴影，就调用渲染阴影的方法
        if (object.castShadow && this.shadowMap.enabled) {
          this.renderShadow(object, scene, camera);
        }
      }
    });
  }
  renderShadow(light, scene, camera) {
    // 设置阴影缓冲区
    this.setShadowFramebuffer(light);
    scene.traverse((object) => {
      if (object.type === "Mesh") {
        // 如果是网格对象，就调用渲染网格对象的方法
        this.renderShadowMesh(object, light);
      }
    });
    // 清空缓冲区
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.domElement.width, this.domElement.height);
  }
  renderShadowMesh(mesh, light) {
    let depthMaterial = new MeshDepthMaterial();

    // 生成着色器程序
    const program = this.getProgram(depthMaterial);
    // 使用着色器程序
    this.gl.useProgram(program);
    this.gl.enable(this.gl.DEPTH_TEST);
    // 设置顶点着色器属性
    this.setVertexShaderAttribute(program, mesh);
    // 设置模型矩阵
    this.setModelMatrix(program, mesh);
    // 设置相机矩阵
    light.updateCamera();
    this.setCameraProjectionMatrix(program, light.shadow.camera);

    // 绘制
    this.gl.drawElements(
      this.gl.TRIANGLES,
      mesh.geometry.index.length,
      this.gl.UNSIGNED_SHORT,
      0
    );
  }
  setCameraProjectionMatrix(program, camera) {
    const projectionMatrix = camera.projectionMatrix.toArray();
    const projectionMatrixLocation = this.gl.getUniformLocation(
      program,
      "projectionMatrix"
    );
    this.gl.uniformMatrix4fv(
      projectionMatrixLocation,
      false,
      new Float32Array(projectionMatrix)
    );

    const pvMatrixLocation = this.gl.getUniformLocation(program, "pvMatrix");
    this.gl.uniformMatrix4fv(
      pvMatrixLocation,
      false,
      new Float32Array(camera.pvMatrix.toArray())
    );
  }
  renderMesh(mesh, camera) {
    // 获取网格对象的几何体
    const geometry = mesh.geometry;
    // 获取网格对象的材质
    const material = mesh.material;
    // 获取几何体的顶点数据
    const position = geometry.attributes.position;
    // 生成着色器程序
    const program = this.getProgram(material);
    // 使用着色器程序
    this.gl.useProgram(program);
    // 设置顶点着色器属性
    this.setVertexShaderAttribute(program, mesh);
    // 设置FragmentShader的uniform
    this.setFragmentShader(program, material);
    // 设置模型矩阵
    this.setModelMatrix(program, mesh);
    // 设置视图矩阵
    this.setViewMatrix(program, camera);
    // 通用uniform
    this.setUniform(program, mesh, camera);
    // 设置灯光
    this.setLight(program, mesh, camera);
    // 绘制
    this.gl.drawElements(
      this.gl.TRIANGLES,
      geometry.index.length,
      this.gl.UNSIGNED_SHORT,
      0
    );
  }

  // 设置灯光
  setLight(program, mesh, camera) {
    this.lightArray.forEach((light) => {
      if (light.type === "SpotLight") {
        this.setSpotLight(program, light, camera);
      }
    });
  }
  setSpotLight(program, light, camera) {
    // 设置灯光颜色
    const colorLocation = this.gl.getUniformLocation(program, "lightColor");
    this.gl.uniform3fv(
      colorLocation,
      new Float32Array([light.color[0], light.color[1], light.color[2]])
    );
    // 设置灯光位置
    const positionLocation = this.gl.getUniformLocation(program, "lightPos");
    const position = light.position;
    this.gl.uniform3fv(
      positionLocation,
      new Float32Array([position.x, position.y, position.z])
    );
    // 设置灯光方向
    const directionLocation = this.gl.getUniformLocation(program, "lightDir");
    let target = light.target;
    let direction = position.clone().sub(target).normalize();
    this.gl.uniform3fv(
      directionLocation,
      new Float32Array([direction.x, direction.y, direction.z])
    );
    // 设置灯光角度
    const angleLocation = this.gl.getUniformLocation(program, "uLightAngle");
    this.gl.uniform1f(angleLocation, light.angle);
    // 设置灯光强度
    const intensityLocation = this.gl.getUniformLocation(
      program,
      "u_lightIntensity"
    );
    this.gl.uniform1f(intensityLocation, light.intensity);
  }
  setUniform(program, mesh, camera) {
    // 设置纹理
    if (mesh.material.map) {
      this.setUniformTexture(program, mesh);
    }
    // 设置颜色
    if (mesh.material.color) {
      this.setUniformColor(program, mesh);
    }
    // 设置相机位置
    if (camera.position) {
      this.setUniformCameraPosition(program, camera);
    }
  }
  setShadowFramebuffer(light) {
    // 纹理对象
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.shadowMapTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowMapTexture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      light.shadow.mapSize.x,
      light.shadow.mapSize.y,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );

    // 帧缓冲区
    this.shadowMapFramebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.shadowMapFramebuffer);
    // 将纹理对象绑定到帧缓冲区
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      // 颜色关联
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.shadowMapTexture,
      0
    );
    // 渲染缓冲区
    this.shadowMapRenderBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.shadowMapRenderBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl.DEPTH_COMPONENT16,
      light.shadow.mapSize.x,
      light.shadow.mapSize.y
    );
    // 设置渲染视口
    this.gl.viewport(0, 0, light.shadow.mapSize.x, light.shadow.mapSize.y);
    // 清空画布
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }
  setUniformCameraPosition(program, camera) {
    const positionLocation = this.gl.getUniformLocation(program, "uEye");
    this.gl.uniform3fv(
      positionLocation,
      new Float32Array([
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ])
    );
  }
  setUniformColor(program, mesh) {
    const color = mesh.material.color;
    const colorLocation = this.gl.getUniformLocation(program, "u_color");
    this.gl.uniform4fv(colorLocation, color);
  }
  setUniformTexture(program, mesh) {
    // 获取纹理
    const texture = mesh.material.map;
    if (texture.textureObj) {
      return;
    }

    // 创建纹理对象
    const textureObject = this.gl.createTexture();
    texture.textureObj = textureObject;

    // 绑定纹理对象
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture.textureObj);
    // 设置纹理参数
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl[texture.wrapS]
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl[texture.wrapT]
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl[texture.minFilter]
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl[texture.magFilter]
    );
    // 设置纹理图像
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      texture.image
    );

    // 获取纹理位置
    const textureLocation = this.gl.getUniformLocation(program, "u_texture");
    // 设置纹理位置
    this.gl.uniform1i(textureLocation, 0);

    // 传入uniform已传入纹理
    const hasTextureLocation = this.gl.getUniformLocation(
      program,
      "u_hasTexture"
    );
    this.gl.uniform1i(hasTextureLocation, 1);
  }
  // 设置索引缓冲区
  setIndexBuffer(program, geometry) {
    // 创建索引缓冲区
    const indexBuffer = this.gl.createBuffer();
    // 绑定索引缓冲区
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // 向索引缓冲区写入数据
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      geometry.index,
      this.gl.STATIC_DRAW
    );
  }
  setFragmentShader(program, material) {}
  setModelMatrix(program, mesh) {
    // 更新模型矩阵
    mesh.updateMatrix();
    // 设置物体的模型矩阵的uniform
    const modelMatrix = this.gl.getUniformLocation(program, "modelMatrix");
    this.gl.uniformMatrix4fv(modelMatrix, false, mesh.matrix.toArray());
  }
  setViewMatrix(program, camera) {
    // 传递pvMatrix
    let pvMatrixLocation = this.gl.getUniformLocation(program, "pvMatrix");
    this.gl.uniformMatrix4fv(
      pvMatrixLocation,
      false,
      camera.pvMatrix.toArray()
    );
  }
  setVertexShaderAttribute(program, mesh) {
    if (mesh.vao) {
      this.gl.bindVertexArray(mesh.vao);
      return;
    } else {
      mesh.vao = this.gl.createVertexArray();
      this.gl.bindVertexArray(mesh.vao);
    }
    // 获取几何体的顶点数据
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    // 获取顶点着色器的属性

    const positionLocation = this.gl.getAttribLocation(program, "v_position");
    // 创建缓冲区对象
    if (!geometry.bufferData.position) {
      geometry.bufferData.position = this.gl.createBuffer();
    }

    // 绑定缓冲区对象
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.bufferData.position);
    // 把顶点数据写入缓冲区对象
    this.gl.bufferData(this.gl.ARRAY_BUFFER, position, this.gl.STATIC_DRAW);
    // 把缓冲区对象分配给属性
    this.gl.vertexAttribPointer(
      positionLocation,
      4,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    // 开启属性
    this.gl.enableVertexAttribArray(positionLocation);

    // 如果有顶点着色器的颜色属性
    if (geometry.attributes && geometry.attributes.colors) {
      const colors = geometry.attributes.colors;
      const colorLocation = this.gl.getAttribLocation(program, "v_color");
      if (!geometry.bufferData.colors) {
        geometry.bufferData.colors = this.gl.createBuffer();
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.bufferData.colors);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(colorLocation);
    }

    // 如果顶点有uv属性
    if (geometry.attributes && geometry.attributes.uv) {
      const uv = geometry.attributes.uv;
      const uvLocation = this.gl.getAttribLocation(program, "uv");
      if (!geometry.bufferData.uv) {
        geometry.bufferData.uv = this.gl.createBuffer();
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.bufferData.uv);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, uv, this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(uvLocation, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(uvLocation);
    }

    // 如果顶点有法线属性
    if (geometry.attributes && geometry.attributes.normal) {
      const normal = geometry.attributes.normal;
      const normalLocation = this.gl.getAttribLocation(program, "normal");
      if (!geometry.bufferData.normal) {
        geometry.bufferData.normal = this.gl.createBuffer();
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.bufferData.normal);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, normal, this.gl.STATIC_DRAW);

      this.gl.vertexAttribPointer(
        normalLocation,
        3,
        this.gl.FLOAT,
        false,
        0,
        0
      );
      this.gl.enableVertexAttribArray(normalLocation);
    }
    // 设置索引缓冲区
    this.setIndexBuffer(program, geometry);
  }
  getProgram(material) {
    // 获取材质的类型
    const type = material.type;
    // 如果着色器程序已经存在，就直接返回
    if (this.programs[type]) {
      return this.programs[type];
    }
    // 如果着色器程序不存在，就创建着色器程序
    const program = this.createProgram(material);
    // 把着色器程序保存起来
    this.programs[type] = program;
    return program;
  }
  createProgram(material) {
    let vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      material.vertexShader
    );
    let fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      material.fragmentShader
    );
    // 创建着色器程序
    const program = this.gl.createProgram();
    // 把着色器附加到着色器程序
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    // 链接着色器程序
    this.gl.linkProgram(program);
    return program;
  }
  createShader(type, source) {
    // 创建着色器对象
    const shader = this.gl.createShader(type);
    // 设置着色器源码
    this.gl.shaderSource(shader, source);
    // 编译着色器
    this.gl.compileShader(shader);
    // 返回着色器对象
    return shader;
  }
}

import { Vector2, BufferAttribute, BufferGeometry } from "three";

import { Earcut } from "three/src/extras/Earcut";

export class CustomPlaneGeometry extends BufferGeometry {
  constructor() {
    super();
  }

  /**
   * @description 输入描述轮廓信息的点，将连续的两点连成一条线，不要有相交线，这可能会导致生成结果错误
   * @param {Vector2[]} points 轮廓坐标信息
   * @param {Vector2[][]} holes 洞洞坐标信息
   * @returns {this}
   */
  setFromVec2Array(points, holes) {
    const positions = [];
    const v2s = [];

    for (let i = 0; i < points.length; i++) {
      positions.push(points[i].x, points[i].y, 0);
      v2s.push(points[i].x, points[i].y);
    }

    const holeIndices = [];
    let holeIndex = 0;

    if (holes && holes.length) {
      for (let i = 0; i < holes.length; i++) {
        for (let j = 0; j < holes[i].length; j++) {
          positions.push(holes[i][j].x, holes[i][j].y, 0);
          v2s.push(holes[i][j].x, holes[i][j].y);
        }
        if (i > 0) {
          holeIndex += holes[i - 1].length;
        } else {
          holeIndex = points.length;
        }
        holeIndices.push(holeIndex);
      }
    }

    const indices = new Uint16Array(Earcut.triangulate(v2s, holeIndices));

    this.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
    this.setIndex(new BufferAttribute(indices, 1));
    this.computeVertexNormals();

    return this;
  }
}

/////////////////////////////////////////////////////////////////////////////
//
//  IndexedCube.js
//
//  A cube defined of 12 triangles using vertex indices.
//

class IndexedCube {
  constructor(gl, vertexShader, fragmentShader) {
    fragmentShader ||= `
        in vec4 vColor;
        out vec4 fColor;
        
        void main() {
            if (gl_FrontFacing) {
                fColor = vColor;
            }
        }
    `;

    vertexShader ||= `
        in vec3 aPosition;
        in vec4 aColor;

        uniform mat4 P;
        uniform mat4 MV;
        
        out vec4 vColor;

        void main() {
            vColor = aColor;
            vec4 pos = vec4(aPosition, 1.0);
            pos.xyz -= 0.5;
            gl_Position = P * MV * pos;
        }
    `;

    let program = new ShaderProgram(gl, this, vertexShader, fragmentShader);

    const positions = new Float32Array([
      // 0
      0.0, 0.0, 0.0,
      // 1
      1.0, 0.0, 0.0,
      // 2
      0.0, 1.0, 0.0,
      // 3
      1.0, 1.0, 0.0,
      // 4
      0.0, 0.0, 1.0,
      // 5
      1.0, 0.0, 1.0,
      // 6
      0.0, 1.0, 1.0,
      // 7
      1.0, 1.0, 1.0,
    ]);

    const aPosition = new Attribute(
      gl,
      program,
      "aPosition",
      positions,
      3,
      gl.FLOAT,
    );

    const colors = new Uint8Array([
      // 0
      0, 0, 0, 255,
      // 1
      255, 0, 0, 255,
      // 2
      0, 255, 0, 255,
      // 3
      255, 255, 0, 255,
      // 4
      0, 0, 255, 255,
      // 5
      255, 0, 255, 255,
      // 6
      0, 255, 255, 255,
      // 7
      255, 255, 255, 255,
    ]);

    const aColor = new Attribute(
      gl,
      program,
      "aColor",
      colors,
      4,
      gl.UNSIGNED_BYTE,
      true,
    );

    let indices = new Uint8Array([
      // 0
      0, 2, 1, 3,
      // 1
      5, 7, 4, 6,
      // 2
      0, 2, 2,
      // 3
      6, 3, 7,
      // 4
      7, 5, 1, 4, 0,
    ]);

    indices = new Indices(gl, indices);

    this.draw = () => {
      program.use();

      aPosition.enable();
      aColor.enable();
      indices.enable();

      gl.drawElements(gl.TRIANGLE_STRIP, indices.count, indices.type, 0);

      indices.disable();
      aColor.disable();
      aPosition.disable();
    };
  }
}

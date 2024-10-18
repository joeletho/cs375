/////////////////////////////////////////////////////////////////////////////
//
//  BasicCube.js
//
//  A cube defined of 12 triangles
//

class BasicCube {
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
      0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
      // 1
      0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
      // 2
      1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
      // 3
      1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      // 4
      1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
      // 5
      1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0,
      // 6
      1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
      // 7
      1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
      // 8
      1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0,
      // 9
      1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0,
      // 10
      1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0,
      // 11
      0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
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
      0, 0, 0, 255, 0, 0, 255, 255, 0, 255, 255, 255,
      // 1
      0, 0, 0, 255, 0, 255, 255, 255, 0, 255, 0, 255,
      // 2
      255, 255, 0, 255, 0, 0, 0, 255, 0, 255, 0, 255,
      // 3
      255, 255, 0, 255, 255, 0, 0, 255, 0, 0, 0, 255,
      // 4
      255, 0, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255,
      // 5
      255, 0, 255, 255, 0, 0, 255, 255, 0, 0, 0, 255,
      // 6
      255, 255, 255, 255, 255, 255, 0, 255, 0, 255, 0, 255,
      // 7
      255, 255, 255, 255, 0, 255, 0, 255, 0, 255, 255, 255,
      // 8
      255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 0, 255,
      // 9
      255, 0, 0, 255, 255, 255, 255, 255, 255, 0, 255, 255,
      // 10
      255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255, 255,
      // 11
      0, 255, 255, 255, 0, 0, 255, 255, 255, 0, 255, 255,
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

    this.draw = () => {
      program.use();

      aPosition.enable();
      aColor.enable();

      gl.drawArrays(gl.TRIANGLES, 0, aPosition.count);

      aColor.disable();
      aPosition.disable();
    };
  }
}

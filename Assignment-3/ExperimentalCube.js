/////////////////////////////////////////////////////////////////////////////
//
//  ExperimentalCube.js
//
//  A cube defined ???
//

class ExperimentalCube {
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

    this.draw = () => {
      program.use();

      aPosition.enable();
      aColor.enable();
      indices.enable();

      gl.drawElements(gl.TRIANGLES, indices.count, indices.type, 0);

      indices.disable();
      aColor.disable();
      aPosition.disable();
    };
  }
}


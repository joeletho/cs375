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
        uniform mat4 P;
        uniform mat4 MV;
        
        out vec4 vColor;

        mat4 eye() {
            return mat4(1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0, 0.0, 0.0, 1.0);
        }

        mat4 rotationX(in float angle) {
            return mat4(1.0,    0.0,        0.0,      0.0,
                        0.0, cos(angle), -sin(angle), 0.0,
                        0.0, sin(angle),  cos(angle), 0.0,
                        0.0,    0.0,        0.0,      1.0);
        }

        mat4 rotationY(in float angle) {
            return mat4( cos(angle), 0.0, sin(angle), 0.0,
                            0.0,     1.0,    0.0,     0.0,
                        -sin(angle), 0.0, cos(angle), 0.0,
                            0.0,     0.0,    0.0,     1.0);
        }

        mat4 rotationZ(in float angle) {
            return mat4(cos(angle), -sin(angle), 0.0, 0.0,
                        sin(angle),  cos(angle), 0.0, 0.0,
                           0.0,         0.0,     1.0, 0.0,
                           0.0,         0.0,     0.0, 1.0);
        }

        void main() {
            const float PI = 3.14159;
            vec4 pos;
            mat4 rot;
            switch(gl_VertexID) {
                case 0: {
                    pos = vec4(0.0,0.0,0.0,1.0);
                    break;
                }
                case 1: {
                    pos = vec4(0.0,1.0,0.0,1.0);
                    break;
                }
                case 2: {
                    pos = vec4(1.0,1.0,0.0,1.0);
                    break;
                }
                case 3: {
                    pos = vec4(1.0,0.0,0.0,1.0);
                    break;
                }
            }

            switch(gl_InstanceID) {
                case 0: {
                    rot = eye();
                    break;
                }
                case 1: {
                    rot = rotationX(-32.9868) * rotationY(-32.9868) * rotationZ(-32.9868);
                    break;
                }
                case 2: {
                    rot = rotationX(0.0) * rotationY(-32.9868) * rotationZ(-32.9868);
                    break;
                }
                case 3: {
                    rot = rotationX(32.9868) * rotationY(0.0) * rotationZ(-32.9868);
                    break;
                }
                case 4: {
                    rot = rotationX(32.9868) * rotationY(-32.9868) * rotationZ(0.0);
                    break;
                }
                case 5: {
                    rot = rotationX(0.0) * rotationY(-65.9736) * rotationZ(0.0);
                    break;
                }
            }
            
            float angle = float(gl_VertexID) / float(gl_InstanceID + 1) * 1.5 * PI;
            vColor = vec4(cos(angle) + sin(angle), -sin(angle) + cos(angle), -cos(angle) + sin(angle), 1.0);
            pos.xyz -= 0.5;
            gl_Position = P * MV * (pos * rot);
        }
    `;

    let program = new ShaderProgram(gl, this, vertexShader, fragmentShader);

    this.draw = () => {
      program.use();
      gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, 6);
    };
  }
}


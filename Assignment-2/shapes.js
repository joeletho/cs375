let gl = undefined;

function init() {
  let canvas = document.getElementById("webgl-canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("Your Web browser doesn't support WebGL 2\nPlease contact Dave");
  }

  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);

  const sphere = new Sphere(gl, 36, 18);
  const cone = new Cone(gl, 36);
  const tetra = new Tetrahedron(gl);
  const cylinder = new Cylinder(gl, 36);
  const axes = new Axes(gl);
  const ms = new MatrixStack();

  let angle = 0.0;

  let render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    angle += 1.0;
    angle %= 360.0;

    // Axes
    ms.push();
    ms.rotate(angle, [0.2, 0.2, -0.2]);
    ms.scale(0.3);
    axes.MV = ms.current();
    axes.color = vec4(0, 1, 1, 1);
    axes.draw();
    ms.pop();

    // Sphere
    ms.push();
    ms.translate([-0.5, 0.5, 0]);
    ms.rotate(angle, [0, 1, 0]);
    ms.scale((0.3 * Math.cos(angle * 0.0085)) % 1);
    sphere.MV = ms.current();
    sphere.color = vec4(1, 1, 0, 1);
    sphere.draw();
    ms.pop();

    // Cone
    ms.push();
    ms.translate([0.5, 0.5, 0]);
    ms.rotate(angle * 2, [-1, 0, -0.5]);
    ms.scale(0.4);
    cone.MV = ms.current();
    cone.color = vec4(0, 1, 0, 1);
    cone.draw();
    ms.pop();

    // Tetrahedron
    ms.push();
    ms.translate([-0.5, -0.5, 1]);
    ms.rotate(angle, [-1, 0, -0.5]);
    ms.scale(0.4);
    tetra.MV = ms.current();
    tetra.color = vec4(0, 0, 1, 1);
    tetra.draw();
    ms.pop();

    // Cylinder
    ms.push();
    ms.translate([0.5, -0.5, 0]);
    ms.rotate(angle, [-1, -1, -0.5]);
    ms.scale([0.1, 0.1, 0.4]);
    cylinder.MV = ms.current();
    cylinder.color = vec4(0, 1, 1, 0.5);
    cylinder.draw();
    ms.pop();

    requestAnimationFrame(render);
  };

  render();
}

window.onload = init;

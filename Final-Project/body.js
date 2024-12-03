import * as THREE from "three";

const ONE_REVOLUTION = 2 * Math.PI;

export class Body extends THREE.Object3D {
  constructor(name = "", color, radius, distance) {
    super();

    distance =
      typeof distance === "undefined" || isNaN(distance) ? 0 : distance;
    radius = typeof radius === "undefined" || isNaN(radius) ? 0 : radius;
    color = typeof color === "undefined" ? 0xff6fff : color;

    if (radius > 0) {
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: color });
      this.add(new THREE.Mesh(geometry, material));
    }

    const axes = new THREE.AxesHelper(radius * 1.2);
    axes.name = "Axes";
    this.add(axes);

    this.name = name;
    this.distance = distance;
    this.radius = radius;
    this.color = color;
    this.rotationspeed = 1e-4;
    this.orbitAngle = 0;
    this.period = ONE_REVOLUTION;
    this.position.set(distance, 0, 0);
    this.elapsedTime = 0;
  }

  setRotationSpeed(speed) {
    this.rotationSpeed = speed;
  }

  setPeriod(period) {
    this.period = period * 60 ** 2;
  }

  update(dt) {
    this.rotateY(this.rotationSpeed);

    if (this.distance > 0) {
      const angularVelocity = ONE_REVOLUTION / this.period;
      this.orbitAngle -= angularVelocity * dt;
      this.orbitAngle %= ONE_REVOLUTION;
      this.position.setX(this.distance * Math.cos(this.orbitAngle));
      this.position.setZ(this.distance * Math.sin(this.orbitAngle));
    }

    this.dispatchEvent({
      type: "update",
      rotation: this.rotation,
      position: this.position,
    });
  }

  showAxes(show = true) {
    const axes = this.getObjectByName("Axes");
    if (axes) axes.visible = show;
  }

  copy(object, recursive = true) {
    if (!(object instanceof Body)) {
      throw new Error("Source must be an instance of Body.");
    }

    this.name = object.name;
    this.color = object.color;
    this.radius = object.radius;
    this.distance = object.distance;
    this.rotationspeed = object.rotationspeed;
    this.orbitAngle = object.orbitAngle;
    this.period = object.period;
    this.position.copy(object.position);
    this.rotation.copy(object.rotation);

    if (recursive) {
      this.clear();
      object.children.forEach((child) => {
        this.add(child.clone(recursive));
      });
    }

    return this;
  }

  clone(recursive = true) {
    const cloned = new Body(this.name, this.color, this.radius, this.distance);
    cloned.copy(this, recursive);
    return cloned;
  }
}

import * as THREE from "three";
import {
  calculateLookAt,
  createCameraEvents,
  moveCamera,
  setDefaultState,
} from "./cameraUtils";

export class PerspectiveCamera extends THREE.PerspectiveCamera {
  constructor(
    fov = 50,
    aspect = 1,
    near = 0.1,
    far = 2000,
    options = { enableEvents: false },
  ) {
    super(fov, aspect, near, far);
    this.aspect = aspect;

    setDefaultState(this);
    this.state.default.direction.lookAt = calculateLookAt(this, 0, 0);

    if (options.enableEvents) {
      createCameraEvents(this);
    }
  }

  setOrigin(x, y, z) {
    if (x === null || y === null || z === null) {
      throw new Error("setOrigin(): Values are undefined");
    }
    this.origin = new THREE.Vector3(x, y, z);
    this.state.flags.originChanged = true;
  }

  setDefaultRoll(pitch, yaw) {
    this.state.default.direction.pitch = pitch;
    this.state.default.direction.yaw = yaw;
    this.state.default.direction.lookAt = calculateLookAt(this, pitch, yaw);
  }

  setAspect(aspect) {
    this.aspect = aspect;
  }

  reset() {
    if (this.origin === null) {
      throw new Error("reset(): Origin is not defined");
    }
    this.position.copy(this.origin);
    this.state.movement.speed = this.state.default.movement.speed;
    this.roll(
      this.state.default.direction.pitch,
      this.state.default.direction.yaw,
    );
    this.zoom = this.state.default.direction.zoom;
    super.lookAt(this.state.default.direction.lookAt);
  }

  setZoom(factor) {
    this.zoom = factor;
  }

  roll(pitch, yaw) {
    if (this.state.flags.isLocked) {
      return;
    }
    super.lookAt(calculateLookAt(this, pitch, yaw));
  }

  lookAtObject(object) {
    super.lookAt(object.position);
  }

  move(forward, right, up, speed) {
    moveCamera(this, forward, right, up, speed);
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.updateProjectionMatrix();
  }

  setRotation(x, y, z) {
    this.rotation.set(x, y, z);
    this.updateProjectionMatrix();
  }

  getViewportDimensions(distance) {
    const fovInRadians = THREE.MathUtils.degToRad(this.fov);
    const height = 2 * distance * Math.tan(fovInRadians / 2);
    const width = height * this.aspect;

    return { width, height };
  }

  update() {
    if (!this.state.flags.isLocked && this.state.flags.isMoving) {
      this.move(
        this.state.movement.forward,
        this.state.movement.right,
        this.state.movement.up,
        this.state.movement.speed,
      );
    }
    if (this.state.flags.originChanged) {
      this.position.copy(this.origin);
      this.state.flags.originChanged = false;
    }
    this.updateProjectionMatrix();

    this.dispatchEvent({
      type: "update",
      position: this.position,
      rotation: this.rotation,
    });
  }
}

export class OrthographicCamera extends THREE.OrthographicCamera {
  constructor(
    left = -1,
    right = 1,
    top = 1,
    bottom = -1,
    near = 0.1,
    far = 2000,
    options = { enableEvents: false },
  ) {
    super(left, right, top, bottom, near, far);

    setDefaultState(this);
    this.state.default.direction.lookAt = calculateLookAt(this, 0, 0);

    if (options.enableEvents) {
      createCameraEvents(this);
    }
  }

  setOrigin(x, y, z) {
    if (x === null || y === null || z === null) {
      throw new Error("setOrigin(): Values are undefined");
    }
    this.origin = new THREE.Vector3(x, y, z);
    this.state.flags.originChanged = true;
  }

  setDefaultRoll(pitch, yaw) {
    this.state.default.direction.lookAt = calculateLookAt(this, pitch, yaw);
  }

  reset() {
    if (this.origin === null) {
      throw new Error("reset(): Origin is not defined");
    }
    this.state.movement.speed = this.state.default.movement.speed;
    this.position.copy(this.origin);
    this.zoom = this.state.default.direction.zoom;
    super.lookAt(this.state.default.direction.lookAt);
  }

  setZoom(factor) {
    this.zoom = factor;
  }

  roll(pitch, yaw) {
    if (this.state.flags.isLocked) {
      return;
    }
    this.state.direction.pitch = pitch;
    this.state.direction.yaw = yaw;
    super.lookAt(calculateLookAt(this, pitch, yaw));
  }

  lookAtObject(object) {
    super.lookAt(object.position);
  }

  move(forward, right, up, speed) {
    moveCamera(this, forward, right, up, speed);
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.updateProjectionMatrix();
  }

  setRotation(x, y, z) {
    this.rotation.set(x, y, z);
    this.updateProjectionMatrix();
  }

  getViewportDimensions() {
    return {
      width: this.right - this.left,
      height: this.top - this.bottom,
    };
  }

  lock(value) {
    this.state.flags.isLocked = value;
  }

  update() {
    if (!this.state.flags.isLocked && this.state.flags.isMoving) {
      this.move(
        this.state.movement.forward,
        this.state.movement.right,
        this.state.movement.up,
        this.state.movement.speed,
      );
    }
    if (this.state.flags.originChanged) {
      this.position.copy(this.origin);
      this.state.flags.originChanged = false;
    }
    this.updateProjectionMatrix();
    this.dispatchEvent({
      type: "update",
      position: this.position,
      rotation: this.rotation,
    });
  }
}

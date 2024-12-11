import * as THREE from "three";
import {
  calculateLookAt,
  createCameraEvents,
  moveCamera,
  setDefaultState,
} from "./cameraUtils";

function initSettings(camera, options) {
  camera.origin = new THREE.Vector3();
  setDefaultState(camera);
  if (options.enableEvents) {
    createCameraEvents(camera);
  }
}

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
    initSettings(this, options);
  }

  setOrigin(x, y, z) {
    if (x === null || y === null || z === null) {
      throw new Error("setOrigin(): Values are undefined");
    }
    this.origin.set(x, y, z);
    this.originChanged = true;
  }

  setAspect(aspect) {
    this.aspect = aspect;
  }

  reset() {
    this.position.copy(this.origin);
    this.movement.speed = this.default.movement.speed;
    this.roll(this.default.pitch, this.default.yaw);
    this.zoom = this.default.zoom;
    this.lookAt(this.default.direction);
  }

  setZoom(factor) {
    this.zoom = factor;
  }

  roll(pitch, yaw) {
    if (this.isLocked) {
      return;
    }
    super.lookAt(calculateLookAt(this, pitch, yaw));
  }

  move(forward, right, up, speed) {
    const prevPosition = this.position.clone();
    const prevRotation = this.rotation.clone();

    moveCamera(this, forward, right, up, speed);
    this.updateProjectionMatrix();

    this.dispatchEvent({
      type: "move",
      id: this.id,
      prevPosition,
      prevRotation,
      position: this.position.clone(),
      rotation: this.rotation.clone(),
      forward: forward,
      right: right,
      up: up,
      speed: speed,
      // This is so we can get the normal speed of the camera, not the passed value
      defaultSpeed: this.movement.speed,
    });
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
    let updated = false;

    if (this.originChanged) {
      this.position.copy(this.origin);
      this.originChanged = false;
    }

    if (!this.isLocked && this.isMoving) {
      this.move(
        this.movement.forward,
        this.movement.right,
        this.movement.up,
        this.movement.speed,
      );
      updated = true;
    }

    if (!updated) {
      this.updateProjectionMatrix();
    }

    this.dispatchEvent({
      type: "update",
      id: this.id,
      position: this.position.clone(),
      rotation: this.rotation.clone(),
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
    initSettings(this, options);
  }

  setOrigin(x, y, z) {
    if (x === null || y === null || z === null) {
      throw new Error("setOrigin(): Values are undefined");
    }
    this.origin.set(x, y, z);
    this.originChanged = true;
  }

  reset() {
    if (this.origin === null) {
      throw new Error("reset(): Origin is not defined");
    }
    this.movement.speed = this.default.movement.speed;
    this.position.copy(this.origin);
    this.zoom = this.default.zoom;
    super.lookAt(this.default.direction);
  }

  setZoom(factor) {
    this.zoom = factor;
  }

  roll(pitch, yaw) {
    if (this.isLocked) {
      return;
    }
    this.pitch = pitch;
    this.yaw = yaw;
    super.lookAt(calculateLookAt(this, pitch, yaw));
  }

  move(forward, right, up, speed) {
    const prevPosition = this.position.clone();
    const prevRotation = this.rotation.clone();

    moveCamera(this, forward, right, up, speed, 81);
    this.updateProjectionMatrix();

    this.dispatchEvent({
      type: "move",
      id: this.id,
      prevPosition,
      prevRotation,
      position: this.position.clone(),
      rotation: this.rotation.clone(),
      forward: forward,
      right: right,
      up: up,
      speed: speed,
      // This is so we can get the normal speed of the camera, not the passed value
      defaultSpeed: this.movement.speed,
    });
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
    this.isLocked = value;
  }

  update() {
    let updated = false;

    if (this.originChanged) {
      this.position.copy(this.origin);
      this.originChanged = false;
    }

    if (!this.isLocked && this.isMoving) {
      this.move(
        this.movement.forward,
        this.movement.right,
        this.movement.up,
        this.movement.speed,
      );
      updated = true;
    }

    if (!updated) {
      this.updateProjectionMatrix();
    }

    this.dispatchEvent({
      type: "update",
      id: this.id,
      position: this.position.clone(),
      rotation: this.rotation.clone(),
    });
  }
}

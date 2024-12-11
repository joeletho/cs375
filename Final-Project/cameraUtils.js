import * as THREE from "three";

export const DEFAULT_MOUSE_SENSITIVITY = 0.05;
export const DEFAULT_MOVEMENT_SPEED = 2;
export const DEFAULT_MOVEMENT_STEP = 2;
export const ZOOM_FACTOR = 8;

export function setDefaultState(camera) {
  const defaultState = {
    zoom: 1,
    pitch: 0,
    yaw: 0,
    direction: new THREE.Vector3(1, 0, 0),
    sensitivity: DEFAULT_MOUSE_SENSITIVITY,
    isLooking: false,
    originChanged: false,
    isMoving: false,
    isLocked: false,
    movement: {
      forward: 0,
      right: 0,
      up: 0,
      speed: DEFAULT_MOVEMENT_SPEED,
    },
    events: {
      prevMouseX: null,
      prevMouseY: null,
    },
  };

  camera.zoom = defaultState.zoom;
  camera.pitch = defaultState.pitch;
  camera.yaw = defaultState.yaw;
  camera.direction = defaultState.direction;
  camera.sensitivity = defaultState.sensitivity;
  camera.isLooking = defaultState.isLooking;
  camera.originChanged = defaultState.originChanged;
  camera.isMoving = defaultState.isMoving;
  camera.isLocked = defaultState.isLocked;
  camera.movement = defaultState.movement;
  camera.events = defaultState.events;
  camera.default = defaultState;
}

export function calculateLookAt(camera, pitch, yaw) {
  const pitchRad = THREE.MathUtils.degToRad(pitch);
  const yawRad = THREE.MathUtils.degToRad(yaw);

  const dirX = Math.cos(pitchRad) * Math.cos(yawRad);
  const dirY = Math.sin(pitchRad);
  const dirZ = Math.cos(pitchRad) * Math.sin(yawRad);

  const cameraDirection = new THREE.Vector3(dirX, dirY, dirZ);

  return new THREE.Vector3().addVectors(camera.position, cameraDirection);
}

export function moveCamera(camera, forward, right, up, speed) {
  forward = typeof forward === "undefined" || isNaN(forward) ? 0 : forward;
  right = typeof right === "undefined" || isNaN(right) ? 0 : right;
  up = typeof up === "undefined" || isNaN(up) ? 0 : up;

  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);
  cameraForward.normalize();

  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraForward, camera.up).normalize();

  const cameraUp = new THREE.Vector3();
  cameraUp.copy(camera.up).normalize();

  const moveDirection = new THREE.Vector3();

  if (forward !== 0) {
    moveDirection.add(cameraForward.multiplyScalar(forward));
  }
  if (right !== 0) {
    moveDirection.add(cameraRight.multiplyScalar(right));
  }
  if (up !== 0) {
    moveDirection.add(cameraUp.multiplyScalar(up));
  }

  if (speed !== 0) {
    moveDirection.multiplyScalar(speed);
  }

  camera.position.add(moveDirection);
}

export function createCameraEvents(camera) {
  document.addEventListener("keydown", (event) => onKeyDown(camera, event));
  document.addEventListener("keyup", (event) => onKeyUp(camera, event));
  document.addEventListener("mousedown", (event) => onMouseDown(camera, event));
  document.addEventListener("mousemove", (event) => onMouseMove(camera, event));
  document.addEventListener("mouseup", (event) => onMouseUp(camera, event));
  document.addEventListener("wheel", (event) => onScroll(camera, event));
}

///////////////////////////////////////////////////////////////////////////
//                            Events
//

// Movement

function onKeyDown(camera, event) {
  switch (event.keyCode) {
    case 87 /*W*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.forward = DEFAULT_MOVEMENT_STEP;
      camera.isMoving = true;
      break;
    case 83 /*S*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.forward = -DEFAULT_MOVEMENT_STEP;
      camera.isMoving = true;
      break;
    case 65 /*A*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.right = -DEFAULT_MOVEMENT_STEP;
      camera.isMoving = true;
      break;
    case 68 /*D*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.right = DEFAULT_MOVEMENT_STEP;
      camera.isMoving = true;
      break;
    case 32 /*SPACE*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.up = DEFAULT_MOVEMENT_STEP;
      camera.isMoving = true;
      break;
    case 17 /*CTRL*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.up = -DEFAULT_MOVEMENT_STEP;
      camera.isMoving = true;
      break;
    case 61 /*=*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.speed += DEFAULT_MOVEMENT_SPEED;
      break;
    case 173 /*-*/:
      event.stopPropagation();
      event.preventDefault();
      camera.movement.speed = Math.max(
        0,
        camera.movement.speed - DEFAULT_MOVEMENT_SPEED,
      );
      break;
    case 48 /*0*/:
      event.stopPropagation();
      event.preventDefault();
      // Reset speed
      camera.movement.speed = camera.default.movement.speed;
      break;
    case 82 /*R*/:
      event.stopPropagation();
      event.preventDefault();
      // Reset camera position
      camera.reset();
    default:
      console.log(event.keyCode);
  }
}

function onKeyUp(camera, event) {
  switch (event.keyCode) {
    case 87 /*W*/:
    case 83 /*S*/:
      camera.movement.forward = 0;
      camera.isMoving = false;
      break;
    case 65 /*A*/:
    case 68 /*D*/:
      camera.movement.right = 0;
      camera.isMoving = false;
      break;
    case 32 /*SPACE*/:
    case 17 /*CTRL*/:
      camera.movement.up = 0;
      camera.isMoving = false;
      break;
  }
}

// Zoom

let endScroll = null;

function onScroll(camera, event) {
  const dir = event.deltaY < 0 ? 1 : -1;
  camera.movement.forward =
    dir *
    DEFAULT_MOVEMENT_STEP *
    // Normalize the camera speed
    ((DEFAULT_MOVEMENT_SPEED /
      Math.sqrt(
        Math.pow(camera.movement.speed, 2) +
          Math.pow(DEFAULT_MOVEMENT_SPEED, 2),
      )) *
      // Multiply the normalized speed by a factor
      ZOOM_FACTOR);
  camera.isMoving = true;

  clearTimeout(endScroll);
  endScroll = setTimeout(() => {
    camera.movement.forward = 0;
    camera.isMoving = false;
  }, 100);
}

// Looking

function onMouseDown(camera, event) {
  if (!camera.isLooking) {
    camera.isLooking = true;
  }
}

function onMouseMove(camera, event) {
  if (camera.isLooking) {
    if (
      camera.events.prevMouseX !== null &&
      camera.events.prevMouseY !== null
    ) {
      const dx = event.clientX - camera.events.prevMouseX;
      const dy = event.clientY - camera.events.prevMouseY;

      camera.yaw += dx * camera.sensitivity;
      camera.pitch -= dy * camera.sensitivity;

      camera.roll(camera.pitch, camera.yaw);
    }
    camera.events.prevMouseX = event.clientX;
    camera.events.prevMouseY = event.clientY;
  }
}

function onMouseUp(camera, event) {
  if (camera.isLooking) {
    camera.events.prevMouseX = null;
    camera.events.prevMouseY = null;
    camera.isLooking = false;
  }
}

import * as THREE from "three";

export const DEFAULT_MOUSE_SENSITIVITY = 0.05;
export const DEFAULT_MOVEMENT_SPEED = 2;
export const DEFAULT_MOVEMENT_STEP = 2;
export const ZOOM_FACTOR = 8;

export function setDefaultState(camera) {
  camera.state = {
    direction: {
      pitch: 0,
      yaw: 0,
      sensitivity: DEFAULT_MOUSE_SENSITIVITY,
    },

    events: {
      prevMouseX: null,
      prevMouseY: null,
    },

    movement: {
      forward: 0,
      right: 0,
      up: 0,
      speed: DEFAULT_MOVEMENT_SPEED,
    },

    default: {
      direction: {
        zoom: 1,
        pitch: 0,
        yaw: 0,
        lookAt: calculateLookAt(camera, 0, 0),
        sensitivity: DEFAULT_MOUSE_SENSITIVITY,
      },
      movement: {
        speed: DEFAULT_MOVEMENT_SPEED,
      },
    },
    flags: {
      isLooking: false,
      originChanged: false,
      isMoving: false,
      isLocked: false,
    },
  };
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

  camera.position.add(moveDirection.multiplyScalar(speed));
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
      camera.state.movement.forward = DEFAULT_MOVEMENT_STEP;
      camera.state.flags.isMoving = true;
      break;
    case 83 /*S*/:
      event.stopPropagation();
      event.preventDefault();
      camera.state.movement.forward = -DEFAULT_MOVEMENT_STEP;
      camera.state.flags.isMoving = true;
      break;
    case 65 /*A*/:
      event.stopPropagation();
      event.preventDefault();
      camera.state.movement.right = -DEFAULT_MOVEMENT_STEP;
      camera.state.flags.isMoving = true;
      break;
    case 68 /*D*/:
      event.stopPropagation();
      event.preventDefault();
      camera.state.movement.right = DEFAULT_MOVEMENT_STEP;
      camera.state.flags.isMoving = true;
      break;
    case 32 /*SPACE*/:
      event.stopPropagation();
      event.preventDefault();
      camera.state.movement.up = DEFAULT_MOVEMENT_STEP;
      camera.state.flags.isMoving = true;
      break;
    case 17 /*CTRL*/:
      event.stopPropagation();
      event.preventDefault();
      camera.state.movement.up = -DEFAULT_MOVEMENT_STEP;
      camera.state.flags.isMoving = true;
      break;
    case 61 /*=*/:
      event.stopPropagation();
      event.preventDefault();
      camera.state.movement.speed += DEFAULT_MOVEMENT_SPEED;
      break;
    case 173 /*-*/:
      event.stopPropagation();
      event.preventDefault();
      camera.state.movement.speed = Math.max(
        0,
        camera.state.movement.speed - DEFAULT_MOVEMENT_SPEED,
      );
      break;
    case 48 /*0*/:
      event.stopPropagation();
      event.preventDefault();
      // Reset speed
      camera.state.movement.speed = camera.state.default.movement.speed;
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
      camera.state.movement.forward = 0;
      camera.state.flags.isMoving = false;
      break;
    case 65 /*A*/:
    case 68 /*D*/:
      camera.state.movement.right = 0;
      camera.state.flags.isMoving = false;
      break;
    case 32 /*SPACE*/:
    case 17 /*CTRL*/:
      camera.state.movement.up = 0;
      camera.state.flags.isMoving = false;
      break;
  }
}

// Zoom

let endScroll = null;

function onScroll(camera, event) {
  const dir = event.deltaY < 0 ? 1 : -1;
  camera.state.movement.forward =
    dir *
    DEFAULT_MOVEMENT_STEP *
    // Normalize the camera speed
    ((DEFAULT_MOVEMENT_SPEED /
      Math.sqrt(
        Math.pow(camera.state.movement.speed, 2) +
          Math.pow(DEFAULT_MOVEMENT_SPEED, 2),
      )) *
      // Multiply the normalized speed by a factor
      ZOOM_FACTOR);
  camera.state.flags.isMoving = true;

  clearTimeout(endScroll);
  endScroll = setTimeout(() => {
    camera.state.movement.forward = 0;
    camera.state.flags.isMoving = false;
  }, 100);
}

// Looking

function onMouseDown(camera, event) {
  if (!camera.state.flags.isLooking) {
    camera.state.flags.isLooking = true;
  }
}

function onMouseMove(camera, event) {
  if (camera.state.flags.isLooking) {
    if (
      camera.state.events.prevMouseX !== null &&
      camera.state.events.prevMouseY !== null
    ) {
      const dx = event.clientX - camera.state.events.prevMouseX;
      const dy = event.clientY - camera.state.events.prevMouseY;

      camera.state.direction.yaw += dx * camera.state.direction.sensitivity;
      camera.state.direction.pitch -= dy * camera.state.direction.sensitivity;

      camera.roll(camera.state.direction.pitch, camera.state.direction.yaw);
    }
    camera.state.events.prevMouseX = event.clientX;
    camera.state.events.prevMouseY = event.clientY;
  }
}

function onMouseUp(camera, event) {
  if (camera.state.flags.isLooking) {
    camera.state.events.prevMouseX = null;
    camera.state.events.prevMouseY = null;
    camera.state.flags.isLooking = false;
  }
}

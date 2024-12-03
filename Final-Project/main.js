import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { OrthographicCamera, PerspectiveCamera } from "./camera.js";
import { initSolarSystem } from "./solarSystem.js";
import { Body } from "./body.js";
import { GUI } from "lil-gui";
import { Planet } from "./planet.js";

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let FOLLOW_WIDTH;
let FOLLOW_HEIGHT;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

const fov = 50;
const near = 1;
const far = 1_000_000_000;

let rootContainer, stats, gui, labelRenderer;
let userCamera, userScene, userRenderer;
let followCamera, followScene, followRenderer;

let selectedObject = null;
const cameraFlags = {
  user: {
    lockCamera: false,
    lockRotation: false,
    lockPosition: false,
  },
  follow: {
    lockCamera: true,
    lockRotation: true,
    lockPosition: true,
    focus: false,
  },
};

const objectNames = [
  "Sun",
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

const objectsStates = objectNames.map((name) => {
  return { name: name, focus: false, lookAt: false };
});

init();

function init() {
  rootContainer = document.createElement("div");
  rootContainer.setAttribute("id", "solar-canvas");
  document.body.appendChild(rootContainer);

  // Camera
  userCamera = new PerspectiveCamera(fov, aspect, near, far, {
    enableEvents: true,
  });
  userCamera.setOrigin(-6000, 5000, 0);
  userCamera.setDefaultRoll(-45, 0);
  userCamera.reset();

  // Scene
  userScene = new THREE.Scene();
  initSolarSystem(userScene);

  userRenderer = initRenderer(rootContainer, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Label renderer
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  document.body.appendChild(labelRenderer.domElement);

  // Extras
  stats = new Stats();
  rootContainer.appendChild(stats.dom);

  // Events
  window.addEventListener(
    "resize",
    () => {
      console.log("Resizing");
      SCREEN_WIDTH = window.innerWidth;
      SCREEN_HEIGHT = window.innerHeight;
      aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      userRenderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      labelRenderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    },
    true,
  );
}

function initRenderer(container, width, height) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setAnimationLoop(animate);
  renderer.setScissorTest(true);
  container.appendChild(renderer.domElement);
  return renderer;
}

function animate() {
  render();
  stats.update();
}

let objectRoot = null;
let lastTime = Date.now();

function render() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;

  updateSceneObjects(dt);

  updateUserCamera();
  updateUserRenderer();
  updateFollowCamera();
  updateFollowRenderer();
}

function updateUserCamera() {
  userCamera.setAspect(aspect);
  userCamera.update();
}

function updateUserRenderer() {
  userRenderer.setClearColor(0x000000, 1);
  userRenderer.setScissor(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  userRenderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  userRenderer.render(userScene, userCamera);
  labelRenderer.render(userScene, userCamera);
}

function updateSceneObjects(dt) {
  userScene.traverse(function (obj) {
    if (obj.isGroup) {
      for (let i = 0; i < obj.children.length; i++) {
        const sun = obj.children[i];
        if (!(sun instanceof Body)) {
          break;
        }
        if (!objectRoot) {
          objectRoot = obj;
          initFollowCamera();
          gui = initGUI();
          // Set default follow object
          selectFollowObject("follow", objectRoot, "Sun");
          userCamera.addEventListener("update", function (event) {
            gui.controllers.forEach((controller) => controller.updateDisplay());
          });
        }
        sun.update(dt);
        for (let j = 0; j < sun.children.length; j++) {
          const planetGroup = sun.children[j];
          if (!planetGroup.isGroup) {
            if (planetGroup instanceof Body) {
              planetGroup.update(dt);
            }
            continue;
          }
          planetGroup.children.forEach((planet) => {
            planet.update(dt);
          });
        }
      }
    }
  });
}

function updateFollowRenderer() {
  followRenderer?.setClearColor(0x000000, 1);
  followRenderer?.setScissor(0, 0, FOLLOW_WIDTH, FOLLOW_HEIGHT);
  followRenderer?.setViewport(0, 0, FOLLOW_WIDTH, FOLLOW_HEIGHT);
  followRenderer?.render(followScene, followCamera);
}

function getObjectByName(root, name) {
  function findObject(group, name) {
    if (group.name === name) {
      return group;
    }

    //TODO: THIS IS HORRIBLE. FIX LATER
    for (let i = 0; i < group.children.length; i++) {
      const obj = group.children[i];
      if (!(obj instanceof Object) && !(obj instanceof Planet)) {
        continue;
      }

      if (obj.name === name) {
        return obj;
      }
      for (let j = 0; j < obj.children.length; j++) {
        let object;
        if (obj.isGroup) {
          object = findObject(obj, name);
        } else {
          object = findObject(obj.children[j], name);
        }
        if (object) {
          return object;
        }
      }
    }
    return null;
  }

  return findObject(root, name);
}

function onSelectedObjectUpdate(event) {
  selectedObject.rotation.copy(event.rotation);
  selectedObject.position.copy(event.position);
}

function fitObjectInViewport(camera, object) {
  const paddingFactor = 1.5;
  let scale;
  if (camera.isOrthographic) {
    scale =
      camera.getViewportDimensions().width /
      (2 * object.radius * paddingFactor);
  } else {
    let position = new THREE.Vector3();
    object.getWorldPosition(position);
    const distance = object.radius * 10;
    camera.setPosition(-distance, distance, 0);

    const { width, height } = camera.getViewportDimensions(distance);
    const diameter = object.radius * 2;
    const maxViewportDimension = Math.min(width, height);

    scale = maxViewportDimension / (diameter * paddingFactor);
  }
  camera.setZoom(scale);
}

function selectFollowObject(cameraName, objectParent, objectName) {
  const obj = getObjectByName(objectParent, objectName);
  if (!obj) {
    return;
  }

  if (cameraName === "follow") {
    if (selectedObject) {
      // Remove existing event listener
      const prevObj = getObjectByName(objectParent, selectedObject.name);
      if (prevObj.hasEventListener("update", onSelectedObjectUpdate)) {
        prevObj.removeEventListener("update", onSelectedObjectUpdate);
      }

      // Erase all objects
      followScene.children = [];
    }

    obj.addEventListener("update", onSelectedObjectUpdate);

    selectedObject = obj.clone(selectedObject);
    followScene.add(selectedObject);
  }

  const hasFocus = objectsStates.find(
    (state) => state.name === obj.name && state.focus,
  );
  if (cameraName === "follow" || (cameraName === "user" && hasFocus)) {
    fitObjectInViewport(getCameraByName(cameraName), obj);
  }
}

function updateFollowCamera() {
  if (!selectedObject || !followCamera) {
    return;
  }

  if (cameraFlags["follow"].lockPosition) {
    followCamera.setPosition(
      selectedObject.position.x - far / 100,
      selectedObject.position.y + far / 100,
      selectedObject.position.z,
    );
  }

  if (cameraFlags["follow"].lockRotation) {
    followCamera.lookAtObject(selectedObject);
  }

  const curr = getObjectByName(objectRoot, selectedObject.name);
  let position = new THREE.Vector3();
  position = curr.getWorldPosition(position);

  // position = userCamera.worldToLocal(position);
  if (cameraFlags["user"].lockCamera || cameraFlags["user"].lockPosition) {
  }

  if (
    objectsStates.find(
      (state) => state.focus && state.name === selectedObject.name,
    )
  ) {
    userCamera.lookAt(position);
  }
}

function initFollowRenderer() {
  const container = document.createElement("div");
  container.id = "follow-camera";
  container.style.width = FOLLOW_WIDTH;
  container.style.height = FOLLOW_WIDTH;
  container.style.borderWidth = "1px";
  container.style.border = "solid";
  container.style.borderColor = "#1c1c1c";
  followRenderer = initRenderer(container, FOLLOW_WIDTH, FOLLOW_WIDTH);
  return followRenderer;
}

function initFollowCamera() {
  followCamera = new OrthographicCamera(-2, 2, 2, -2, near, far);
  followScene = new THREE.Scene();
}

function initGUI() {
  const gui = new GUI();
  const guiDom = gui.domElement;
  // Stop the events from being captured by the canvas
  guiDom.addEventListener("mousedown", (e) => e.stopPropagation());
  guiDom.addEventListener("mouseover", (e) => e.stopPropagation());
  guiDom.addEventListener("click", (e) => e.stopPropagation());
  guiDom.addEventListener("drag", (e) => e.stopPropagation());
  guiDom.addEventListener("wheel", (e) => e.stopPropagation());

  FOLLOW_WIDTH = guiDom.offsetWidth - 5;
  FOLLOW_HEIGHT = FOLLOW_WIDTH;

  const renderer = initFollowRenderer();
  guiDom.appendChild(renderer.domElement.parentElement);

  gui.title("Solar Perspective");

  // Camera Settings
  const cameraFolder = gui.addFolder("Camera Settings").close();
  const userFolder = cameraFolder.addFolder("User").close();
  makeCameraSettingsFolder(userFolder, "user");
  const followFolder = cameraFolder.addFolder("Follow").close();
  makeCameraSettingsFolder(followFolder, "follow");

  // Objects
  const objectsFolder = gui.addFolder("Objects").close();
  makeObjectFolder(objectsFolder, objectRoot, "Sun");
  makeObjectFolder(objectsFolder, objectRoot, "Mercury");
  makeObjectFolder(objectsFolder, objectRoot, "Venus");
  makeObjectFolder(objectsFolder, objectRoot, "Earth");
  makeObjectFolder(objectsFolder, objectRoot, "Mars");
  makeObjectFolder(objectsFolder, objectRoot, "Jupiter");
  makeObjectFolder(objectsFolder, objectRoot, "Saturn");
  makeObjectFolder(objectsFolder, objectRoot, "Uranus");
  makeObjectFolder(objectsFolder, objectRoot, "Neptune");

  return gui;
}

function getCameraByName(name) {
  switch (name) {
    case "user":
      return userCamera;
    case "follow":
      return followCamera;
  }
}

function makeCameraSettingsFolder(controller, name) {
  // Lock Camera
  controller
    .add(cameraFlags[name], "lockCamera")
    .listen()
    .onChange((value) => {
      console.log(name);
      if (controller.property === "User") {
        if (value) {
          const parent = getObjectByName(objectRoot, selectedObject.name);
          const camera = getCameraByName(name);
          parent.add(camera);
          fitObjectInViewport(camera, parent);
        } else {
          const camera = getCameraByName(name);
          const position = new THREE.Vector3();
          camera.getWorldPosition(position);
          camera.parent = null;
          camera.position.copy(position);
        }
      }
      cameraFlags[name].lockCamera = value;
      cameraFlags[name].lockPosition = value;
      cameraFlags[name].lockRotation = value;
    });

  // Zoom
  controller
    .add(getCameraByName(name), "zoom", 0.01, 50)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.setZoom(value);
      camera.update();
    });

  const rollFolder = controller.addFolder("Roll").close();
  rollFolder
    .add(getCameraByName(name).state.direction, "pitch", -180, 180)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.roll(value, camera.state.direction.yaw);
    });
  rollFolder
    .add(getCameraByName(name).state.direction, "yaw", -180, 180)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.roll(camera.state.direction.pitch, value);
    });

  // Rotation
  const rotationFolder = controller.addFolder("Rotation").close();
  rotationFolder
    .add(cameraFlags[name], "lockRotation")
    .listen()
    .onChange((value) => {
      cameraFlags[name].lockRotation = value;
      if (!value) {
        cameraFlags[name].lockCamera = false;
      } else if (
        cameraFlags[name].lockRotation &&
        cameraFlags[name].lockPosition
      ) {
        cameraFlags[name].lockCamera = true;
      }
    });
  rotationFolder
    .add(getCameraByName(name).rotation, "x", -far, far)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.setRotation(value, camera.rotation.y, camera.rotation.z);
    });
  rotationFolder
    .add(getCameraByName(name).rotation, "y", -far, far)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.setRotation(camera.rotation.x, value, camera.rotation.z);
    });
  rotationFolder
    .add(getCameraByName(name).rotation, "z", -far, far)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.setRotation(camera.rotation.x, camera.rotation.y, value);
    });

  // Position
  const positionFolder = controller.addFolder("Position").close();
  positionFolder
    .add(cameraFlags[name], "lockPosition")
    .listen()
    .onChange((value) => {
      cameraFlags[name].lockPosition = value;
      if (!value) {
        cameraFlags[name].lockCamera = false;
      } else if (
        cameraFlags[name].lockRotation &&
        cameraFlags[name].lockPosition
      ) {
        cameraFlags[name].lockCamera = true;
      }
    });
  positionFolder
    .add(getCameraByName(name).position, "x", -far, far)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.setPosition(value, camera.position.y, camera.position.z);
    });
  positionFolder
    .add(getCameraByName(name).position, "y", -far, far)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.setPosition(camera.position.x, value, camera.position.z);
    });
  positionFolder
    .add(getCameraByName(name).position, "z", -far, far)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.setPosition(camera.position.x, camera.position.y, value);
    });
}

function makeObjectFolder(contoller, objectRoot, objectName) {
  const object = getObjectByName(objectRoot, objectName);

  const objectFolder = contoller.addFolder(objectName).close();
  objectFolder.onOpenClose((con) => {
    if (!con._closed) {
      selectFollowObject("follow", objectRoot, objectName);
    }
  });
  objectFolder
    .add(
      objectsStates.find((state) => state.name === objectName),
      "focus",
    )
    .listen()
    .onChange((value) => {
      const settings = getGUIControllerByName(gui, "Camera Settings");
      const userSettings = getGUIControllerByName(settings, "User");
      setGUIControllerValue(userSettings, "lockCamera", value);
      if (value) {
        objectsStates.forEach(
          (state) => (state.focus = state.name === objectName),
        );
      } else {
        objectsStates.forEach((state) => (state.focus = false));
      }
    });
  objectFolder
    .add(
      objectsStates.find((state) => state.name === objectName),
      "lookAt",
    )
    .listen()
    .onChange((value) => {
      if (value) {
        userCamera.lookAt(object.position);
      }
      objectsStates.find((state) => state.name).lookAt = value;
    });
  objectFolder.add({ showAxes: true }, "showAxes").onChange((value) => {
    object.showAxes(value);
    // Update the object on the follow camera
    if (selectedObject && selectedObject.name === objectName) {
      selectFollowObject("follow", objectRoot, objectName);
    }
  });
  objectFolder.add(object, "distance").listen().disable();
  objectFolder.add(object, "radius").listen().disable();
  objectFolder.add(object, "rotationSpeed").listen().disable();
  objectFolder.add(object, "orbitAngle").listen().disable();
  objectFolder.add(object, "period").listen().disable();

  const objectPositionFolder = objectFolder.addFolder("Position");
  objectPositionFolder.add(object.position, "x").listen().disable();
  objectPositionFolder.add(object.position, "y").listen().disable();
  objectPositionFolder.add(object.position, "z").listen().disable();

  const objectRotationFolder = objectFolder.addFolder("Rotation");
  objectRotationFolder.add(object.rotation, "x").listen().disable();
  objectRotationFolder.add(object.rotation, "y").listen().disable();
  objectRotationFolder.add(object.rotation, "z").listen().disable();
}

function setGUIControllerValue(root, fieldName, value) {
  const controller = root.controllers.find(
    (ctrl) => ctrl.property === fieldName,
  );
  if (controller) {
    controller.setValue(value);
    controller.updateDisplay();
  } else {
    console.warn(
      `field "${fieldName}" not found in controller "${root._title}".`,
    );
  }
}

function getGUIControllerByName(root, name) {
  if (root?._title === name) {
    return root;
  }

  if (root.folders) {
    for (const key in root.folders) {
      const childFolder = root.folders[key];
      const result = getGUIControllerByName(childFolder, name);
      if (result) {
        return result;
      }
    }
  }

  throw new Error(`Cannot find controller with name "${name}"`);
}

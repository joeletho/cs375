import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { OrthographicCamera, PerspectiveCamera } from "./camera.js";
import { initSolarSystem } from "./solarSystem.js";
import { Body } from "./body.js";
import { GUI } from "lil-gui";
import { Planet } from "./planet.js";
import { Sun } from "./sun.js";

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let FOLLOW_WIDTH;
let FOLLOW_HEIGHT;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

const fov = 50;
const near = 1;
const far = 1_000_000_000;

let rootContainer;
let stats;
let gui;

let userCamera;
let userScene;
let userRenderer;
let userLabelRenderer;

let previewCamera;
let previewScene;
let previewRenderer;
let previewLabelRenderer;

let previewObject = null;
let focusedObject = null;
let lookingAt = false;

const cameraFlags = {
  user: {
    lockCamera: false,
    lockRotation: false,
    lockPosition: false,
    focus: false,
  },
  preview: {
    lockCamera: true,
    lockRotation: true,
    lockPosition: true,
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

let sceneInitialized = false;

init();

function init() {
  rootContainer = document.createElement("div");
  rootContainer.setAttribute("id", "solar-canvas");
  document.body.appendChild(rootContainer);

  // Camera
  userCamera = new PerspectiveCamera(fov, aspect, near, far, {
    enableEvents: true,
  });
  userCamera.roll(-45, 0);

  // Scene
  userScene = new THREE.Scene();
  initSolarSystem(function (solarSystem) {
    solarSystem.updateMatrixWorld(true);
    userScene.add(solarSystem);
    solarSystemRoot = solarSystem;
    // Update the parent for any children that were added async
    initPreviewCamera();
    gui = initGUI();
    // Set default focus and preview objects
    selectFocusObject(solarSystemRoot, "Sun");
    selectPreviewObject(solarSystemRoot, "Sun");

    // Listen for world changes to manually update the GUI values
    userCamera.addEventListener("update", function (event) {
      gui.controllers.forEach((controller) => controller.updateDisplay());
    });
    sceneInitialized = true;
  });

  userRenderer = initRenderer(rootContainer, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Label renderer
  userLabelRenderer = initLabelRenderer(
    rootContainer,
    window.innerWidth,
    window.innerHeight,
  );

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
      userLabelRenderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    },
    true,
  );
  // Notify the user before closing the window
  window.addEventListener("beforeunload", (event) => {
    event.preventDefault();
    event.stopPropagation();
    return null;
  });
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

function initLabelRenderer(container, width, height) {
  userLabelRenderer = new CSS2DRenderer();
  userLabelRenderer.setSize(width, height);
  userLabelRenderer.domElement.style.position = "absolute";
  userLabelRenderer.domElement.style.top = "0px";
  container.appendChild(userLabelRenderer.domElement);
  return userLabelRenderer;
}

function animate() {
  render();
  stats.update();
}

let solarSystemRoot = null;
let lastTime = Date.now();

function render() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;

  updateSceneObjects(dt);
  updateUserCamera();
  updateUserRenderer();
  updatePreviewCamera();
  updatePreviewRenderer();
}

function updateUserCamera() {
  userCamera.setAspect(aspect);

  if (lookingAt) {
    const lookingObjectState = objectsStates.find((state) => state.lookAt);
    const object = getObjectByName(solarSystemRoot, lookingObjectState.name);
    const objectWorldPosition = new THREE.Vector3();
    object.getWorldPosition(objectWorldPosition);

    if (!focusedObject || focusedObject.name !== lookingObjectState.name) {
      userCamera.lookAt(object.position);
    } else {
      let cameraPosition = new THREE.Vector3();

      if (focusedObject.name === "Sun") {
        const distanceFromPlanet = object.radius * 10;
        const directionToPlanet = new THREE.Vector3(1, 0, 0);
        cameraPosition = objectWorldPosition
          .clone()
          .add(directionToPlanet.multiplyScalar(-distanceFromPlanet));
      } else {
        const sunPosition = getObjectByName(
          solarSystemRoot,
          "Sun",
        ).position.clone();
        const directionToPlanet = new THREE.Vector3()
          .subVectors(objectWorldPosition, sunPosition)
          .normalize();
        const distanceFromPlanet = object.radius * 10;
        cameraPosition = objectWorldPosition
          .clone()
          .add(directionToPlanet.multiplyScalar(-distanceFromPlanet));
      }

      userCamera.position.copy(cameraPosition);
      userCamera.lookAt(objectWorldPosition);
    }
  }

  userCamera.update();
}

function updateUserRenderer() {
  userRenderer.setClearColor(0x000000, 1);
  userRenderer.setScissor(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  userRenderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  userRenderer.render(userScene, userCamera);
  userLabelRenderer.render(userScene, userCamera);
}

function updateSceneObjects(dt) {
  if (!sceneInitialized) {
    return;
  }
  userScene.traverse(function (obj) {
    if (obj.isGroup) {
      for (let i = 0; i < obj.children.length; i++) {
        const sun = obj.children[i];
        if (!(sun instanceof Sun)) {
          continue;
        }
        sun.update(dt);
        break;
      }
    }
  });
}

function updatePreviewRenderer() {
  previewRenderer?.setClearColor(0x000000, 1);
  previewRenderer?.setScissor(0, 0, FOLLOW_WIDTH, FOLLOW_HEIGHT);
  previewRenderer?.setViewport(0, 0, FOLLOW_WIDTH, FOLLOW_HEIGHT);
  previewRenderer?.render(previewScene, previewCamera);
}

function getObjectByName(root, name) {
  if (!root) {
    return null;
  }

  return root.getObjectByName(name, true);
}

function onSelectedObjectUpdate(event) {
  previewObject.rotation.copy(event.rotation);
}

function fitPreviewObjectInViewport(camera, object) {
  const paddingFactor = 2;
  let scale;
  scale =
    camera.getViewportDimensions().width / (2 * object.radius * paddingFactor);
  camera.setZoom(scale);
}

function selectFocusObject(objectParent, objectName) {
  objectsStates.forEach((state) => (state.focus = state.name === objectName));
  focusedObject = getObjectByName(objectParent, objectName);
}

function onFocusObjectChange(objectName, focused) {
  const settings = getGUIControllerByName(gui, "Camera Settings");
  const userSettings = getGUIControllerByName(settings, "User");
  setGUIControllerValue(userSettings, "lockCamera", focused);

  const objects = getGUIControllerByName(gui, "Objects");
  const objectSettings = getGUIControllerByName(objects, objectName);
  setGUIControllerValue(objectSettings, "lookAt", focused);

  if (focused) {
    selectFocusObject(solarSystemRoot, objectName);
  } else {
    focusedObject = null;
    objectsStates.forEach((state) => (state.focus = false));
  }
}

function onLookAtObjectChange(objectName, lookAt) {
  const object = getObjectByName(solarSystemRoot, objectName);
  objectsStates.forEach((state) => {
    if (state.name === objectName) {
      if (lookAt) {
        userCamera.lookAt(object.position);
      }
      state.lookAt = lookAt;
      lookingAt = lookAt;
    } else {
      state.lookAt = false;
    }
  });
}

function selectPreviewObject(objectParent, objectName) {
  const obj = getObjectByName(objectParent, objectName);
  if (!obj) {
    return;
  }

  if (previewObject) {
    // Remove the old object
    previewScene.remove(previewObject);

    // Remove existing event listener
    const prevObj = getObjectByName(objectParent, previewObject.name);
    if (prevObj.hasEventListener("update", onSelectedObjectUpdate)) {
      prevObj.removeEventListener("update", onSelectedObjectUpdate);
    }
  }

  obj.addEventListener("update", onSelectedObjectUpdate);

  previewObject = obj.clone();
  previewScene.add(previewObject);

  fitPreviewObjectInViewport(previewCamera, previewObject);
}

function updatePreviewCamera() {
  if (!previewObject || !previewCamera) {
    return;
  }

  if (cameraFlags["preview"].lockPosition) {
    previewCamera.setPosition(
      previewObject.position.x - far / 100,
      previewObject.position.y + far / 100,
      previewObject.position.z,
    );
  }

  if (cameraFlags["preview"].lockRotation) {
    previewCamera.lookAt(previewObject.position);
  }
}

function initPreviewRenderer() {
  const container = document.createElement("div");
  container.id = "preview-camera";
  container.style.width = FOLLOW_WIDTH;
  container.style.height = FOLLOW_WIDTH;
  container.style.borderWidth = "1px";
  container.style.border = "solid";
  container.style.borderColor = "#1c1c1c";
  previewRenderer = initRenderer(container, FOLLOW_WIDTH, FOLLOW_WIDTH);
  return previewRenderer;
}

function initPreviewCamera() {
  previewCamera = new OrthographicCamera(-2, 2, 2, -2, near, far);
  previewCamera.setPosition(0, 0, 0);

  const pointLight = new THREE.AmbientLight(0xffffff, 2);
  previewCamera.add(pointLight);
  previewScene = new THREE.Scene();
  previewScene.add(previewCamera);
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

  previewRenderer = initPreviewRenderer();
  guiDom.appendChild(previewRenderer.domElement.parentElement);

  gui.title("Solar Perspective");

  // Camera Settings
  const cameraFolder = gui.addFolder("Camera Settings").close();
  const userFolder = cameraFolder.addFolder("User").close();
  makeCameraSettingsFolder(userFolder, "user");
  const previewFolder = cameraFolder.addFolder("Preview").close();
  makeCameraSettingsFolder(previewFolder, "preview");

  // Objects
  const objectsFolder = gui.addFolder("Objects").close();
  makeObjectFolder(objectsFolder, solarSystemRoot, "Sun");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Mercury");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Venus");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Earth");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Mars");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Jupiter");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Saturn");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Uranus");
  makeObjectFolder(objectsFolder, solarSystemRoot, "Neptune");

  return gui;
}

function getCameraByName(name) {
  switch (name) {
    case "user":
      return userCamera;
    case "preview":
      return previewCamera;
  }
}

function makeCameraSettingsFolder(controller, name) {
  // Lock Camera
  controller
    .add(cameraFlags[name], "lockCamera")
    .listen()
    .onChange((value) => {
      if (value) {
        if (controller.property === "User") {
        } else {
          fitPreviewObjectInViewport(previewCamera, previewObject);
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
    .add(getCameraByName(name), "pitch", -180, 180)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.roll(value, camera.yaw);
    });
  rollFolder
    .add(getCameraByName(name), "yaw", -180, 180)
    .listen()
    .onChange((value) => {
      const camera = getCameraByName(name);
      camera.roll(camera.pitch, value);
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
      selectPreviewObject(objectRoot, objectName);
    }
  });
  objectFolder
    .add(
      objectsStates.find((state) => state.name === objectName),
      "focus",
    )
    .listen()
    .onChange((value) => {
      onFocusObjectChange(objectName, value);
    });
  objectFolder
    .add(
      objectsStates.find((state) => state.name === objectName),
      "lookAt",
    )
    .listen()
    .onChange((value) => {
      onLookAtObjectChange(objectName, value);
    });
  objectFolder.add({ showAxes: true }, "showAxes").onChange((value) => {
    object.showAxes(value);
    // Update the object on the preview camera
    if (previewObject && previewObject.name === objectName) {
      selectPreviewObject(objectRoot, objectName);
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
  return null;
}

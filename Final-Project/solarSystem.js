import * as THREE from "three";
import { Body } from "./body";
import { Planet } from "./planet";

import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Sun } from "./sun";

const METER = 7.187005893344844e-7 / 0.5;
const KM = 1000 * METER;

const SUN_RADIUS = 6.957 * 10 ** 8 * METER;
const AU = 149597870700 * METER;

const EARTH_RADIUS = 6378 * KM;
const MERCURY_RADIUS = EARTH_RADIUS * 0.3;
const VENUS_RADIUS = EARTH_RADIUS;
const MARS_RADIUS = EARTH_RADIUS * 0.5;
const JUPITER_RADIUS = EARTH_RADIUS * 11;
const SATURN_RADIUS = EARTH_RADIUS * 9;
const SATURN_RING_INNER = SATURN_RADIUS + 7000 * KM;
const SATURN_RING_OUTER = SATURN_RADIUS + 80_000 * KM;
const URANUS_RADIUS = EARTH_RADIUS * 4;
const URANUS_RING_INNER = URANUS_RADIUS + 38_000 * KM;
const URANUS_RING_OUTER = URANUS_RADIUS + 98_000 * KM;
const NEPTUNE_RADIUS = EARTH_RADIUS * 4;

const SUN_DISTANCE = 0;
const EARTH_DISTANCE = AU;
const MERCURY_DISTANCE = AU * 0.4;
const VENUS_DISTANCE = AU * 0.72;
const MARS_DISTANCE = AU * 1.4;
const JUPITER_DISTANCE = AU * 5;
const SATURN_DISTANCE = AU * 9.5;
const URANUS_DISTANCE = AU * 19;
const NEPTUNE_DISTANCE = AU * 30;

const EARTH_PERIOD = 60; // Earth completes 1 revolution in 60 seconds

const SUN_ROTATION_SPEED = 1e-4; // 27 Earth days (in real time)
const EARTH_ROTATION_SPEED = SUN_ROTATION_SPEED * 27;
const MERCURY_ROTATION_SPEED = EARTH_ROTATION_SPEED * 0.017;
const VENUS_ROTATION_SPEED = EARTH_ROTATION_SPEED * 0.004;
const MARS_ROTATION_SPEED = EARTH_ROTATION_SPEED * 9.75;
const JUPITER_ROTATION_SPEED = EARTH_ROTATION_SPEED * 2.42;
const SATURN_ROTATION_SPEED = EARTH_ROTATION_SPEED * 2.275;
const URANUS_ROTATION_SPEED = EARTH_ROTATION_SPEED * 1.39;
const NEPTUNE_ROTATION_SPEED = EARTH_ROTATION_SPEED * 1.5;

const MERCURY_PERIOD = EARTH_PERIOD * 0.2; // Mercury takes about 0.2 Earth years
const VENUS_PERIOD = EARTH_PERIOD * 0.6; // Venus takes about 0.6 Earth years
const MARS_PERIOD = EARTH_PERIOD * 1.88; // Mars takes about 1.88 Earth years
const JUPITER_PERIOD = EARTH_PERIOD * 11.86; // Jupiter takes about 11.86 Earth years
const SATURN_PERIOD = EARTH_PERIOD * 29.46; // Saturn takes about 29.46 Earth years
const URANUS_PERIOD = EARTH_PERIOD * 84.02; // Uranus takes about 84.02 Earth years
const NEPTUNE_PERIOD = EARTH_PERIOD * 164.79; // Neptune takes about 164.79 Earth years

export async function initSolarSystem(onload) {
  async function andThenGodSneezed() {
    const stars = createStars();
    const solarSystem = new THREE.Group();
    solarSystem.add(stars);

    const sun = createSun();
    const planets = new THREE.Group();
    planets.name = "Planets";

    planets.add(createMercury());
    planets.add(createVenus());
    planets.add(createEarth());
    planets.add(createMars());
    planets.add(createJupiter());
    planets.add(createSaturn());
    planets.add(createUranus());
    planets.add(createNeptune());

    sun.add(planets);
    solarSystem.add(sun);
    return solarSystem;
  }
  onload(await andThenGodSneezed());
}

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < 10000; i++) {
    vertices.push(THREE.MathUtils.randFloatSpread(100000)); // x
    vertices.push(THREE.MathUtils.randFloatSpread(100000)); // y
    vertices.push(THREE.MathUtils.randFloatSpread(100000)); // z
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x888888, size: 10 }),
  );
}

function createSun() {
  const texturePath = "textures/sun.jpg";
  const sun = new Sun({
    name: "Sun",
    texturePath: texturePath,
    radius: SUN_RADIUS,
    origin: SUN_DISTANCE,
    color: 0xffbe33,
    lightColor: 0xffffff,
    lightIntensity: 12,
  });
  sun.setPeriod(0);
  sun.setRotationSpeed(SUN_ROTATION_SPEED);

  return sun;
}

function createPlanet({
  name,
  texturePath,
  color,
  radius,
  distance,
  axisX,
  axisY,
  axisZ,
  ringTexturePath,
  ringInnerRadius,
  ringOuterRadius,
  ringColor = 0xffffff,
  ringHeight,
  ringTransparent,
  ringOpacity,
  ringAxisX,
  ringAxisY,
  ringAxisZ,
}) {
  const planet = new Planet({
    name: name,
    texturePath: texturePath,
    color: color,
    radius: radius,
    distance: distance,
    axisX: axisX,
    axisY: axisY,
    axisZ: axisZ,
    ring: {
      texturePath: ringTexturePath,
      innerRadius: ringInnerRadius,
      outerRadius: ringOuterRadius,
      color: ringColor,
      height: ringHeight,
      transparent: ringTransparent,
      opacity: ringOpacity,
      axisX: ringAxisX,
      axisY: ringAxisY,
      axisZ: ringAxisZ,
    },
  });

  const labelDiv = document.createElement("div");
  labelDiv.className = "planet-label";
  labelDiv.textContent = name;
  labelDiv.style.color = "white";
  labelDiv.style.backgroundColor = "transparent";
  const label = new CSS2DObject(labelDiv);

  label.position.set(0, radius * 1.5, 0); // Position the label just above the planet
  planet.add(label);

  return planet;
}

function createMercury() {
  const texturePath = "textures/mercury.jpg";
  const mercury = createPlanet({
    name: "Mercury",
    texturePath: texturePath,
    radius: MERCURY_RADIUS,
    distance: MERCURY_DISTANCE,
    axisX: THREE.MathUtils.degToRad(-0.1),
  });
  mercury.setPeriod(MERCURY_PERIOD);
  mercury.setRotationSpeed(MERCURY_ROTATION_SPEED);
  return mercury;
}

function createVenus() {
  const texturePath = "textures/venus.jpg";
  const venus = createPlanet({
    name: "Venus",
    texturePath: texturePath,
    color: 0xffe67e,
    radius: VENUS_RADIUS,
    distance: VENUS_DISTANCE,
    axisZ: THREE.MathUtils.degToRad(3),
  });
  venus.setPeriod(VENUS_PERIOD);
  venus.setRotationSpeed(VENUS_ROTATION_SPEED);
  return venus;
}

function createEarth() {
  const earthTexturePath = "textures/earth.jpg";
  const earth = createPlanet({
    name: "Earth",
    texturePath: earthTexturePath,
    color: 0x73b3ff,
    radius: EARTH_RADIUS,
    distance: EARTH_DISTANCE,
    axisZ: THREE.MathUtils.degToRad(-23),
  });
  earth.setRotationSpeed(EARTH_ROTATION_SPEED);
  earth.setPeriod(EARTH_PERIOD);

  const moonTexturePath = "textures/luna.jpg";
  const moon = createPlanet({
    name: "Luna",
    texturePath: moonTexturePath,
    radius: EARTH_RADIUS * 0.25,
    distance: 384400 * KM,
  });
  moon.setRotationSpeed(0);
  moon.setPeriod(2);
  earth.add(moon);
  return earth;
}

function createMars() {
  const marsTexturePath = "textures/mars.jpg";
  const mars = createPlanet({
    name: "Mars",
    texturePath: marsTexturePath,
    color: 0xfd9696,
    radius: MARS_RADIUS,
    distance: MARS_DISTANCE,
    axisZ: THREE.MathUtils.degToRad(-25),
  });

  mars.setRotationSpeed(MARS_ROTATION_SPEED);
  mars.setPeriod(MARS_PERIOD);

  const phobosTexturePath = "textures/ceres.jpg";
  const phobos = createPlanet({
    name: "Phobos",
    texturePath: phobosTexturePath,
    radius: 110 * METER,
    distance: MARS_RADIUS * 8,
  });
  phobos.setRotationSpeed(0);
  phobos.setPeriod(2);
  mars.add(phobos);

  const deimosTexturePath = "textures/haumea.jpg";
  const deimos = createPlanet({
    name: "Deimos",
    texturePath: deimosTexturePath,
    radius: 60 * METER,
    distance: MARS_RADIUS * 6,
  });
  deimos.setRotationSpeed(0);
  deimos.setPeriod(2);
  mars.add(deimos);
  return mars;
}

function createJupiter() {
  const texturePath = "textures/jupiter.jpg";
  const jupiter = createPlanet({
    name: "Jupiter",
    texturePath: texturePath,
    color: 0xffbd7b,
    radius: JUPITER_RADIUS,
    distance: JUPITER_DISTANCE,
    axisZ: THREE.MathUtils.degToRad(-3),
  });
  jupiter.setRotationSpeed(JUPITER_ROTATION_SPEED);
  jupiter.setPeriod(JUPITER_PERIOD);
  return jupiter;
}

function createSaturn() {
  const ringTexturePath = "textures/saturn_ring.png";
  const saturnTexturePath = "textures/saturn.jpg";
  const saturn = createPlanet({
    name: "Saturn",
    texturePath: saturnTexturePath,
    color: 0xffd77b,
    radius: SATURN_RADIUS,
    distance: SATURN_DISTANCE,
    axisZ: THREE.MathUtils.degToRad(-27),
    ringTexturePath: ringTexturePath,
    ringInnerRadius: SATURN_RING_INNER,
    ringOuterRadius: SATURN_RING_OUTER,
    ringHeight: 10,
    ringTransparent: true,
  });
  saturn.setRotationSpeed(SATURN_ROTATION_SPEED);
  saturn.setPeriod(SATURN_PERIOD);
  return saturn;
}

function createUranus() {
  const ringTexturePath = "textures/saturn_ring.png";
  const uranusTexturePath = "textures/uranus.jpg";
  const uranus = createPlanet({
    name: "Uranus",
    texturePath: uranusTexturePath,
    color: 0xbae6ff,
    radius: URANUS_RADIUS,
    distance: URANUS_DISTANCE,
    axisZ: THREE.MathUtils.degToRad(-97.77),
    ringTexturePath: ringTexturePath,
    ringInnerRadius: URANUS_RING_INNER,
    ringOuterRadius: URANUS_RING_OUTER,
    ringHeight: 10,
    ringTransparent: true,
    ringOpacity: 0.2,
  });
  uranus.setRotationSpeed(URANUS_ROTATION_SPEED);
  uranus.setPeriod(URANUS_PERIOD);
  return uranus;
}

function createNeptune() {
  const texturePath = "textures/neptune.jpg";
  const neptune = createPlanet({
    name: "Neptune",
    texturePath: texturePath,
    color: 0xb1ccff,
    radius: NEPTUNE_RADIUS,
    distance: NEPTUNE_DISTANCE,
    axisZ: THREE.MathUtils.degToRad(-30),
  });
  neptune.setRotationSpeed(NEPTUNE_ROTATION_SPEED);
  neptune.setPeriod(NEPTUNE_PERIOD);
  return neptune;
}

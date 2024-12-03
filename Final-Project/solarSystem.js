import * as THREE from "three";
import { Body } from "./body";
import { Planet } from "./planet";

import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

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
const URANUS_RADIUS = EARTH_RADIUS * 4;
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

export function initSolarSystem(scene) {
  const stars = createStars();
  scene.add(stars);

  const sun = createSun();
  sun.add(createMercury());
  sun.add(createVenus());
  sun.add(createEarth());
  sun.add(createMars());
  sun.add(createJupiter());
  sun.add(createSaturn());
  sun.add(createUranus());
  sun.add(createNeptune());

  const group = new THREE.Group();
  group.add(sun);
  scene.add(group);
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
  const sun = createBody("Sun", 0xffff00, SUN_RADIUS, SUN_DISTANCE);
  sun.setPeriod(0);
  sun.setRotationSpeed(SUN_ROTATION_SPEED);
  return sun;
}

function createBody(name, color, radius, distance) {
  const body = new Body(name, color, radius, distance);

  const labelDiv = document.createElement("div");
  labelDiv.className = "planet-label";
  labelDiv.textContent = name;
  labelDiv.style.color = "white";
  labelDiv.style.backgroundColor = "transparent";
  const label = new CSS2DObject(labelDiv);

  label.position.set(0, radius * 1.5, 0); // Position the label just above the planet
  body.add(label);

  return body;
}

function createPlanetGroup(planetName, color, radius, distance, moons = null) {
  const planet = new Planet(planetName, color, radius, distance);

  if (moons) {
    if (!Array.isArray(moons)) {
      planet.add(moons);
    } else {
      moons.forEach((moon, _) => {
        planet.add(moon);
      });
    }
  }

  const labelDiv = document.createElement("div");
  labelDiv.className = "planet-label";
  labelDiv.textContent = planetName;
  labelDiv.style.color = "white";
  labelDiv.style.backgroundColor = "transparent";
  const label = new CSS2DObject(labelDiv);

  label.position.set(0, radius * 5, 0); // Position the label just above the planet

  planet.add(label);

  return planet;
}

function createMercury() {
  const mercury = createPlanetGroup(
    "Mercury",
    0x8a7f80,
    MERCURY_RADIUS,
    MERCURY_DISTANCE,
  );
  mercury.setPeriod(MERCURY_PERIOD);
  mercury.setRotationSpeed(MERCURY_ROTATION_SPEED);
  return mercury;
}

function createVenus() {
  const venus = createPlanetGroup(
    "Venus",
    0xffc87c,
    VENUS_RADIUS,
    VENUS_DISTANCE,
  );
  venus.setPeriod(VENUS_PERIOD);
  venus.setRotationSpeed(VENUS_ROTATION_SPEED);
  return venus;
}

function createEarth() {
  const moon = createBody("Luna", 0xa9a9a9, EARTH_RADIUS * 0.25, 384400 * KM);
  moon.setRotationSpeed(0);
  moon.setPeriod(2);

  const earth = createPlanetGroup(
    "Earth",
    0x6495ed,
    EARTH_RADIUS,
    EARTH_DISTANCE,
    moon,
  );
  earth.setRotationSpeed(EARTH_ROTATION_SPEED);
  earth.setPeriod(EARTH_PERIOD);

  return earth;
}

function createMars() {
  const phobos = createBody("Phobos", undefined, 110 * METER, 38440 * METER);
  phobos.setRotationSpeed(0);
  phobos.setPeriod(2);

  const deimos = createBody("Deimos", undefined, 60 * METER, 38440 * METER);
  deimos.setRotationSpeed(0);
  deimos.setPeriod(2);

  const mars = createPlanetGroup("Mars", 0x6495ed, MARS_RADIUS, MARS_DISTANCE, [
    phobos,
    deimos,
  ]);
  mars.setRotationSpeed(MARS_ROTATION_SPEED);
  mars.setPeriod(MARS_PERIOD);
  return mars;
}

function createJupiter() {
  const jupiter = createPlanetGroup(
    "Jupiter",
    0x6495ed,
    JUPITER_RADIUS,
    JUPITER_DISTANCE,
  );
  jupiter.setRotationSpeed(JUPITER_ROTATION_SPEED);
  jupiter.setPeriod(JUPITER_PERIOD);
  return jupiter;
}

function createSaturn() {
  const saturn = createPlanetGroup(
    "Saturn",
    0x6495ed,
    SATURN_RADIUS,
    SATURN_DISTANCE,
  );
  saturn.setRotationSpeed(SATURN_ROTATION_SPEED);
  saturn.setPeriod(SATURN_PERIOD);
  return saturn;
}

function createUranus() {
  const uranus = createPlanetGroup(
    "Uranus",
    0x6495ed,
    URANUS_RADIUS,
    URANUS_DISTANCE,
  );
  uranus.setRotationSpeed(URANUS_ROTATION_SPEED);
  uranus.setPeriod(URANUS_PERIOD);
  return uranus;
}

function createNeptune() {
  const neptune = createPlanetGroup(
    "Neptune",
    0x6495ed,
    NEPTUNE_RADIUS,
    NEPTUNE_DISTANCE,
  );
  neptune.setRotationSpeed(NEPTUNE_ROTATION_SPEED);
  neptune.setPeriod(NEPTUNE_PERIOD);
  return neptune;
}

import { Body } from "./body";
import * as THREE from "three";

export class Planet extends Body {
  constructor({
    name = "",
    texturePath = null,
    color = null,
    radius = 1,
    distance = 0,
    axisX,
    axisY,
    axisZ,
    ring = {
      texturePath,
      innerRadius,
      outerRadius,
      color: 0xffffff,
      transparent: true,
      opacity,
      height,
      axisX,
      axisY,
      axisZ,
    },
  }) {
    super({ name, color, radius, distance });
    this.texturePath = texturePath;

    if (radius > 0) {
      let texture = null;
      let loader = null;
      if (texturePath) {
        loader = new THREE.TextureLoader();
        texture = loader.load(texturePath);
      }
      // Planet main geometry
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        map: texture,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.add(mesh);

      // Halo effect (optional)
      if (color) {
        const haloGeometry = new THREE.SphereGeometry(radius * 1.03, 32, 32);
        const haloMaterial = new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
        });
        const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
        this.add(haloMesh);
      }

      if (axisX) {
        this.rotateX(axisX);
      }
      if (axisY) {
        this.rotateY(axisY);
      }
      if (axisZ) {
        this.rotateZ(axisZ);
      }

      this.ringData = ring;
      // Ring geometry
      if (ring.texturePath) {
        if (!loader) {
          loader = new THREE.TextureLoader();
        }
        const ringTexture = loader.load(ring.texturePath);

        ringTexture.minFilter = THREE.LinearFilter;
        ringTexture.magFilter = THREE.LinearFilter;
        ringTexture.generateMipmaps = false;
        ringTexture.wrapS = THREE.RepeatWrapping;
        ringTexture.wrapT = THREE.RepeatWrapping;
        ringTexture.needsUpdate = true;

        const ringGeometry = new THREE.CylinderGeometry(
          ring.innerRadius,
          ring.outerRadius,
          ring.height,
          64,
          1,
          true,
        );
        this.#adjustRingGeometry(ringGeometry);

        const ringMaterial = new THREE.MeshPhysicalMaterial({
          alphaMap: ringTexture,
          transmission: 0.9,
          side: THREE.DoubleSide,
          color: ring.color,
          transparent: ring.transparent ?? true,
          opacity: ring.opacity ?? 1.0,
        });

        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.name = `Ring_${this.id}`;

        if (ring.axisX) {
          ringMesh.rotateX(ring.axisX);
        }
        if (ring.axisY) {
          ringMesh.rotateY(ring.axisY);
        }
        if (ring.axisZ) {
          ringMesh.rotateZ(ring.axisZ);
        }

        this.add(ringMesh);
      }
    }
  }

  #adjustRingGeometry(geometry) {
    let pos = geometry.attributes.position;
    let v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      geometry.attributes.uv.setXY(i, v3.length() < 4 ? 0 : 1, 1);
    }
  }

  copy(object, recursive = true) {
    super.copy(object, recursive);

    if (object instanceof Planet) {
      const loader = new THREE.TextureLoader();
      this.ringData = object.ringData
        ? {
            ...object.ringData,
            texturePath: object.ringData.texturePath,
          }
        : null;

      const sourcePlanetMesh = object.children.find(
        (child) => child instanceof THREE.Mesh && child.material.map,
      );
      const planetMesh = this.children.find(
        (child) => child instanceof THREE.Mesh && child.material.map,
      );

      if (sourcePlanetMesh && planetMesh) {
        const texturePath = object.texturePath;
        const texture = loader.load(texturePath);
        planetMesh.material.map = texture;
        planetMesh.material.needsUpdate = true;
      }

      const sourceHaloMesh = object.children.find(
        (child) => child instanceof THREE.Mesh && child.material.color,
      );
      const haloMesh = this.children.find(
        (child) => child instanceof THREE.Mesh && child.material.color,
      );

      if (sourceHaloMesh && haloMesh) {
        const newHaloMaterial = new THREE.MeshStandardMaterial({
          color: sourceHaloMesh.material.color.clone(),
          transparent: sourceHaloMesh.material.transparent ?? true,
          opacity: sourceHaloMesh.material.opacity ?? 0.2,
          blending: sourceHaloMesh.material.blending,
        });

        haloMesh.material = newHaloMaterial;
        haloMesh.material.needsUpdate = true;
      }

      const sourceRingMesh = object.children.find((child) =>
        child.name.startsWith("Ring"),
      );
      const ringMesh = this.children.find((child) =>
        child.name.startsWith("Ring"),
      );

      if (sourceRingMesh && ringMesh) {
        const ringTexture = loader.load(object.ringData.texturePath);
        const newRingMaterial = new THREE.MeshPhysicalMaterial({
          alphaMap: ringTexture,
          transmission: sourceRingMesh.material.transmission,
          side: sourceRingMesh.material.side,
          color: sourceRingMesh.material.color.clone(),
          transparent: sourceRingMesh.material.transparent ?? true,
          opacity: sourceRingMesh.material.opacity ?? 1.0,
        });

        ringMesh.material = newRingMaterial;
        ringMesh.material.needsUpdate = true; // Ensure the ring texture is updated
      }
    }

    return this;
  }

  clone(recursive = true) {
    const cloned = new Planet({
      name: this.name,
      texturePath: this.texturePath,
      color: this.color,
      radius: this.radius,
      distance: this.distance,
      axisX: this.rotation.x,
      axisY: this.rotation.y,
      axisZ: this.rotation.z,
      ring: this.ringData,
    });

    return cloned;
  }
}

import * as THREE from "three";
import { Body } from "./body";

export class Sun extends Body {
  constructor({
    name = "",
    texturePath = null,
    color = null,
    radius = 10,
    distance = 0,
    lightColor = null,
    lightIntensity = 20,
  }) {
    super({ name, color, radius, distance });
    this.texturePath = texturePath;

    if (radius > 0) {
      let texture = null;
      if (texturePath) {
        texture = new THREE.TextureLoader().load(texturePath);
      }
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
      });
      this.add(new THREE.Mesh(geometry, material));
      const haloGeometry = new THREE.SphereGeometry(radius * 1.01, 32, 32);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
      this.add(haloMesh);

      this.light = new THREE.PointLight(lightColor, lightIntensity, 0, 0.1);
      this.light.name = `PointLight_${this.id}`;
      this.light.position.set(0, 0, 0);
      this.add(this.light);

      this.lightHelper = new THREE.PointLightHelper(this.light, 10);
      this.lightHelper.name = `PointLightHelper_${this.id}`;
      this.add(this.lightHelper);
    }
  }

  update(dt) {
    super.update(dt);

    this.children.forEach((child) => {
      if (child.isGroup) {
        child.children.forEach((maybePlanet) => {
          if (maybePlanet instanceof Body) {
            maybePlanet.update(dt);
          }
        });
      } else if (typeof child.update === "function") {
        child.update();
      }
    });
  }

  copy(object, recursive = true) {
    super.copy(object, recursive);

    if (object instanceof Sun) {
      if (object.children[0] && object.children[0].material.map) {
        const texturePath = object.texturePath;
        const texture = new THREE.TextureLoader().load(texturePath);
        this.children[0].material.map = texture;
      }

      this.light = object.light.clone();
      this.add(this.light);

      this.lightHelper = new THREE.PointLightHelper(
        this.light,
        this.light.distance,
      );
      this.add(this.lightHelper);
    }

    return this;
  }

  clone(recursive = true) {
    const cloned = new Sun({
      name: this.name,
      texturePath: this.texturePath,
      color: this.color,
      radius: this.radius,
      distance: this.distance,
      lightColor: this.light.color.getHex(),
      lightIntensity: this.light.intensity,
    });

    // return cloned.copy(this, recursive);
    return cloned;
  }
}

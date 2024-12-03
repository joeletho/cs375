import { Body } from "./body";

export class Planet extends Body {
  constructor(name, color, radius, distance) {
    super(name, color, radius, distance);
  }

  update(dt) {
    super.update(dt);

    this.children.forEach((moon) => {
      if (moon instanceof Body) {
        moon.update(dt);
      }
    });
  }
}

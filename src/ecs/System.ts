import { Entity } from './Entity';

export abstract class System {
  protected entities: Entity[] = [];

  abstract readonly requiredComponents: string[];

  register(entity: Entity): void {
    if (entity.hasAll(...this.requiredComponents)) {
      this.entities.push(entity);
    }
  }

  unregister(entity: Entity): void {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
    }
  }

  abstract update(dt: number): void;
}

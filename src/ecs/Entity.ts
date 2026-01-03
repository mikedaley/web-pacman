import { Component } from './Component';

let nextId = 0;

export class Entity {
  readonly id: number;
  private components = new Map<string, Component>();
  active = true;

  constructor() {
    this.id = nextId++;
  }

  add<T extends Component>(component: T): this {
    this.components.set(component.type, component);
    return this;
  }

  get<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  has(type: string): boolean {
    return this.components.has(type);
  }

  remove(type: string): boolean {
    return this.components.delete(type);
  }

  hasAll(...types: string[]): boolean {
    return types.every((t) => this.components.has(t));
  }
}

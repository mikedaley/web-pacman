export interface State {
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  render(): void;
  handleInput?(): void;
}

export class StateMachine {
  private states = new Map<string, State>();
  private currentState: State | null = null;
  private currentName = '';

  add(name: string, state: State): void {
    this.states.set(name, state);
  }

  change(name: string): void {
    const next = this.states.get(name);
    if (!next) return;

    this.currentState?.exit?.();
    this.currentState = next;
    this.currentName = name;
    this.currentState.enter?.();
  }

  update(dt: number): void {
    this.currentState?.handleInput?.();
    this.currentState?.update(dt);
  }

  render(): void {
    this.currentState?.render();
  }

  getCurrentName(): string {
    return this.currentName;
  }
}

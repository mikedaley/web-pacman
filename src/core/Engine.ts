export type UpdateCallback = (dt: number) => void;
export type RenderCallback = () => void;

export class Engine {
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedStep = 1000 / 60;
  private running = false;
  private rafId = 0;

  private updateFn: UpdateCallback = () => {};
  private renderFn: RenderCallback = () => {};

  onUpdate(fn: UpdateCallback): void {
    this.updateFn = fn;
  }

  onRender(fn: RenderCallback): void {
    this.renderFn = fn;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop(currentTime: number): void {
    if (!this.running) return;

    const frameTime = Math.min(currentTime - this.lastTime, 250);
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedStep) {
      this.updateFn(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this.renderFn();
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }
}

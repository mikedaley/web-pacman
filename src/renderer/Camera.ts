export class Camera {
  private projection: Float32Array;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.projection = new Float32Array(16);
    this.updateProjection();
  }

  private updateProjection(): void {
    // orthographic projection matrix
    const left = 0;
    const right = this.width;
    const bottom = this.height;
    const top = 0;
    const near = -1;
    const far = 1;

    this.projection[0] = 2 / (right - left);
    this.projection[1] = 0;
    this.projection[2] = 0;
    this.projection[3] = 0;

    this.projection[4] = 0;
    this.projection[5] = 2 / (top - bottom);
    this.projection[6] = 0;
    this.projection[7] = 0;

    this.projection[8] = 0;
    this.projection[9] = 0;
    this.projection[10] = -2 / (far - near);
    this.projection[11] = 0;

    this.projection[12] = -(right + left) / (right - left);
    this.projection[13] = -(top + bottom) / (top - bottom);
    this.projection[14] = -(far + near) / (far - near);
    this.projection[15] = 1;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.updateProjection();
  }

  getProjection(): Float32Array {
    return this.projection;
  }
}

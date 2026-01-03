import { SpriteFrame } from '../utils/types';

export interface AtlasRegion {
  name: string;
  frames: SpriteFrame[];
}

export class SpriteAtlas {
  readonly texture: WebGLTexture;
  readonly width: number;
  readonly height: number;
  private regions = new Map<string, SpriteFrame[]>();

  constructor(gl: WebGLRenderingContext, image: HTMLImageElement) {
    this.width = image.width;
    this.height = image.height;

    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  defineRegion(name: string, frames: SpriteFrame[]): void {
    this.regions.set(name, frames);
  }

  defineGrid(
    name: string,
    startX: number,
    startY: number,
    frameWidth: number,
    frameHeight: number,
    count: number,
    columns: number
  ): void {
    const frames: SpriteFrame[] = [];
    for (let i = 0; i < count; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      frames.push({
        u: startX + col * frameWidth,
        v: startY + row * frameHeight,
        width: frameWidth,
        height: frameHeight,
      });
    }
    this.regions.set(name, frames);
  }

  getFrame(name: string, index = 0): SpriteFrame | null {
    const frames = this.regions.get(name);
    if (!frames || index >= frames.length) return null;
    return frames[index]!;
  }

  getFrames(name: string): SpriteFrame[] {
    return this.regions.get(name) || [];
  }

  getUV(frame: SpriteFrame): { u0: number; v0: number; u1: number; v1: number } {
    return {
      u0: frame.u / this.width,
      v0: frame.v / this.height,
      u1: (frame.u + frame.width) / this.width,
      v1: (frame.v + frame.height) / this.height,
    };
  }
}

import { AssetLoader } from './AssetLoader';

export class AudioManager {
  private context: AudioContext | null = null;
  private assets: AssetLoader;
  private gainNode: GainNode | null = null;
  private muted = false;
  private activeLoops = new Map<string, AudioBufferSourceNode>();

  constructor(assets: AssetLoader) {
    this.assets = assets;
  }

  init(): void {
    this.context = this.assets.getAudioContext();
    if (this.context) {
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }
  }

  play(name: string, loop = false): AudioBufferSourceNode | null {
    if (!this.context || !this.gainNode || this.muted) return null;

    const buffer = this.assets.getAudioBuffer(name);
    if (!buffer) return null;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(this.gainNode);
    source.start();

    if (loop) {
      this.stopLoop(name);
      this.activeLoops.set(name, source);
    }

    return source;
  }

  stopLoop(name: string): void {
    const source = this.activeLoops.get(name);
    if (source) {
      source.stop();
      this.activeLoops.delete(name);
    }
  }

  stopAllLoops(): void {
    this.activeLoops.forEach((source) => source.stop());
    this.activeLoops.clear();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : 1;
    }
  }

  toggleMute(): void {
    this.setMuted(!this.muted);
  }

  isMuted(): boolean {
    return this.muted;
  }
}

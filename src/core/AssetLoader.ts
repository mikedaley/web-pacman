export class AssetLoader {
  private images = new Map<string, HTMLImageElement>();
  private audio = new Map<string, AudioBuffer>();
  private shaders = new Map<string, string>();
  private audioContext: AudioContext | null = null;

  async loadImage(name: string, url: string): Promise<HTMLImageElement> {
    if (this.images.has(name)) {
      return this.images.get(name)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(name, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  async loadShader(name: string, url: string): Promise<string> {
    if (this.shaders.has(name)) {
      return this.shaders.get(name)!;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader: ${url}`);
    }
    const source = await response.text();
    this.shaders.set(name, source);
    return source;
  }

  async loadAudio(name: string, url: string): Promise<AudioBuffer> {
    if (this.audio.has(name)) {
      return this.audio.get(name)!;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audio.set(name, audioBuffer);
    return audioBuffer;
  }

  getImage(name: string): HTMLImageElement | undefined {
    return this.images.get(name);
  }

  getShader(name: string): string | undefined {
    return this.shaders.get(name);
  }

  getAudioBuffer(name: string): AudioBuffer | undefined {
    return this.audio.get(name);
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  async loadAll(manifest: {
    images?: { name: string; url: string }[];
    shaders?: { name: string; url: string }[];
    audio?: { name: string; url: string }[];
  }): Promise<void> {
    const promises: Promise<unknown>[] = [];

    manifest.images?.forEach(({ name, url }) => {
      promises.push(this.loadImage(name, url));
    });

    manifest.shaders?.forEach(({ name, url }) => {
      promises.push(this.loadShader(name, url));
    });

    manifest.audio?.forEach(({ name, url }) => {
      promises.push(this.loadAudio(name, url));
    });

    await Promise.all(promises);
  }
}

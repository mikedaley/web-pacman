export class AssetLoader {
  private images = new Map<string, HTMLImageElement>();
  private shaders = new Map<string, string>();

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

  getImage(name: string): HTMLImageElement | undefined {
    return this.images.get(name);
  }

  getShader(name: string): string | undefined {
    return this.shaders.get(name);
  }

  async loadAll(manifest: {
    images?: { name: string; url: string }[];
    shaders?: { name: string; url: string }[];
  }): Promise<void> {
    const promises: Promise<unknown>[] = [];

    manifest.images?.forEach(({ name, url }) => {
      promises.push(this.loadImage(name, url));
    });

    manifest.shaders?.forEach(({ name, url }) => {
      promises.push(this.loadShader(name, url));
    });

    await Promise.all(promises);
  }
}

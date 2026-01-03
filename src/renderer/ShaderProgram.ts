export class ShaderProgram {
  readonly program: WebGLProgram;
  private gl: WebGLRenderingContext;
  private uniformLocations = new Map<string, WebGLUniformLocation>();
  private attribLocations = new Map<string, number>();

  constructor(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string) {
    this.gl = gl;

    const vert = this.compile(gl.VERTEX_SHADER, vertexSrc);
    const frag = this.compile(gl.FRAGMENT_SHADER, fragmentSrc);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vert);
    gl.attachShader(this.program, frag);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(this.program);
      throw new Error(`Shader link failed: ${info}`);
    }

    gl.deleteShader(vert);
    gl.deleteShader(frag);
  }

  private compile(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${info}`);
    }
    return shader;
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  getAttribLocation(name: string): number {
    if (!this.attribLocations.has(name)) {
      const loc = this.gl.getAttribLocation(this.program, name);
      this.attribLocations.set(name, loc);
    }
    return this.attribLocations.get(name)!;
  }

  getUniformLocation(name: string): WebGLUniformLocation {
    if (!this.uniformLocations.has(name)) {
      const loc = this.gl.getUniformLocation(this.program, name);
      if (loc) this.uniformLocations.set(name, loc);
    }
    return this.uniformLocations.get(name)!;
  }

  setUniform1i(name: string, value: number): void {
    this.gl.uniform1i(this.getUniformLocation(name), value);
  }

  setUniformMatrix4fv(name: string, value: Float32Array): void {
    this.gl.uniformMatrix4fv(this.getUniformLocation(name), false, value);
  }
}

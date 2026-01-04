precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);

    // Treat black pixels as transparent (color key transparency)
    float brightness = texColor.r + texColor.g + texColor.b;
    if (brightness < 0.1) {
        discard;
    }

    gl_FragColor = clamp(texColor * v_color, 0.0, 1.0);
}

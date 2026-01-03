attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec4 a_color;

uniform mat4 u_projection;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
    gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
    v_color = a_color;
}

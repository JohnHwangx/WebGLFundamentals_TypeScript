import webgl_01_fundamental from "./1_Fundamentals/01_fundamentals";
import webgl_02_2d_rectangle from "./1_Fundamentals/02_2d_rectangle";
import webgl_03_2d_rectangle_top_left from "./1_Fundamentals/03_2d_rectangle_top_left";
import webgl_04_2d_rectangles from "./1_Fundamentals/04_2d_rectangles"
import webgl_08_01_3d_textures from "./8_Textures/01_3d_textures"
import webgl_08_02_3d_textures_texture_coords_mapped from './8_Textures/02_3d_textures_texture_coords_mapped'
import webgl_08_03_3d_textures_repear_clamp from './8_Textures/03_3d_textures_repear_clamp'
import webgl_08_04_3d_textures_mips from './8_Textures/04-3d-textures-mips'
import webgl_08_05_3d_textures_mips_tri_linear from './8_Textures/05_3d_textures_mips_tri_linear'
import webgl_08_06_3d_textures_good_npot from './8_Textures/06_3d_textures_good_npot'
import webgl_08_07_3d_textures_texture_atlas from './8_Textures/07_3d_textures_texture_atlas'
import webgl_08_08_data_texture_3x2 from './8_Textures/08_data_texture_3x2'
import webgl_08_09_2_textures from './8_Textures/09_2_textures'
import webgl_08_11_clipspace_rectangles from './8_Textures/11_clipspace_rectangles'
import webgl_08_12_clipspace_rectangles_with_varying from './8_Textures/12_clipspace_rectangles_with_varying'
import webgl_08_13_clipspace_rectangles_with_varying_non_1_w from './8_Textures/13_clipspace_rectangles_with_varying_non_1_w'
import webgl_08_14_clipspace_rectangles_with_varying_non_1_w_repeat from './8_Textures/14_clipspace_rectangles_with_varying_non_1_w_repeat'
import webgl_08_15_perspective_correct_cube from './8_Textures/15_perspective_correct_cube'
import webgl_08_16_non_perspective_correct_cube from './8_Textures/16_non_perspective_correct_cube'
import webgl_08_17_planar_projection_setup from './8_Textures/17_planar_projection_setup'
import webgl_08_18_planer_projection from './8_Textures/18_planer_projection'
import webgl_08_19_planar_projection_with_lines from './8_Textures/19_planar_projection_with_lines'
import webgl_08_20_planar_projection_with_projection_matrix_0_to_1 from './8_Textures/20_planar_projection_with_projection_matrix_0_to_1'
import webgl_08_21_planar_projection_with_projection_matrix from './8_Textures/21_planar_projection_with_projection_matrix'
import webgl_09_1_render_to_texture from './9_Rendering To a Texture/1_render_to_texture'
import webgl_09_2_render_to_texture_3_cubes_no_depth_buffer from './9_Rendering To a Texture/2_render_to_texture_3_cubes_no_depth_buffer'
import webgl_09_3_render_to_texture_3_cubes_with_depth_buffer from './9_Rendering To a Texture/3_render_to_texture_3_cubes_with_depth_buffer'
import webgl_10_1_shadows_depth_texture from './A_Shadows/1_shadows_depth_texture'
import webgl_10_2_shadows_basic from './A_Shadows/2_shadows_basic'
import webgl_10_3_shadows_basic_w_bias from './A_Shadows/3_shadows_basic_w_bias'
import webgl_10_4_shadows_w_spot_light from './A_Shadows/4_shadows_w_spot_light'
import webgl_10_5_shadows_w_directional_light from './A_Shadows/5_shadows_w_directional_light'
import webgl_15_1_instanced_drawing_not_instanced from './15_Optimization/1_instanced-drawing-not-instanced'
import webgl_15_2_instanced_drawing from './15_Optimization/2_instanced-drawing'
import webgl_15_3_instanced_drawing_projection_view from './15_Optimization/3_instanced-drawing-projection-view'
import webgl_15_4_instanced_drawing_vao_not_instanced from './15_Optimization/4_instanced_drawing_vao_not_instanced'
import webgl_15_5_instanced_drawing_vao from './15_Optimization/5_instanced_drawing_vao'
import webgl_15_6_2d_rectangles_indexed from './15_Optimization/6_2d_rectangles_indexed'
import webgl_15_7_2d_cross_indexed_rotate from './15_Optimization/7_2d_cross_indexed_rotate'
import webgl_15_6_2d_cross_indexed from './15_Optimization/6.5_2d_cross_indexed'
import webgl_15_8_instanced_drawing_vao_indexed_not_instanced from './15_Optimization/8_instanced_drawing_vao_indexed_not_instanced'
import webgl_15_9_instanced_drawing_vao_indexed from './15_Optimization/9_instanced_drawing_vao_indexed'
import webgl_15_10_2d_cross_indexed_vao_instanced from './15_Optimization/10_2d_cross_indexed_vao_instanced'
import webgl_15_11_instanced_drawing_texture from './15_Optimization/11_instanced_drawing_texture'
import webgl_15_12_instanced_drawing_texture_instanced from './15_Optimization/12_instanced_drawing_texture_instanced'
import webgl_15_13_cube_vbo_subdata from './15_Optimization/13_cube_vbo_subdata'
import webgl_15_14_cube_vbo_subdata_instanced from './15_Optimization/14_cube_vbo_subdata_instanced'

export {
    webgl_01_fundamental,
    webgl_02_2d_rectangle,
    webgl_03_2d_rectangle_top_left,
    webgl_04_2d_rectangles,
    webgl_08_01_3d_textures,
    webgl_08_02_3d_textures_texture_coords_mapped,
    webgl_08_03_3d_textures_repear_clamp,
    webgl_08_04_3d_textures_mips,
    webgl_08_05_3d_textures_mips_tri_linear,
    webgl_08_06_3d_textures_good_npot,
    webgl_08_07_3d_textures_texture_atlas,
    webgl_08_08_data_texture_3x2,
    webgl_08_09_2_textures,
    webgl_08_11_clipspace_rectangles,
    webgl_08_12_clipspace_rectangles_with_varying,
    webgl_08_13_clipspace_rectangles_with_varying_non_1_w,
    webgl_08_14_clipspace_rectangles_with_varying_non_1_w_repeat,
    webgl_08_15_perspective_correct_cube,
    webgl_08_16_non_perspective_correct_cube,
    webgl_08_17_planar_projection_setup,
    webgl_08_18_planer_projection,
    webgl_08_19_planar_projection_with_lines,
    webgl_08_20_planar_projection_with_projection_matrix_0_to_1,
    webgl_08_21_planar_projection_with_projection_matrix,
    webgl_09_1_render_to_texture,
    webgl_09_2_render_to_texture_3_cubes_no_depth_buffer,
    webgl_09_3_render_to_texture_3_cubes_with_depth_buffer,
    webgl_10_1_shadows_depth_texture,
    webgl_10_2_shadows_basic,
    webgl_10_3_shadows_basic_w_bias,
    webgl_10_4_shadows_w_spot_light,
    webgl_10_5_shadows_w_directional_light,
    webgl_15_1_instanced_drawing_not_instanced,
    webgl_15_2_instanced_drawing,
    webgl_15_3_instanced_drawing_projection_view,
    webgl_15_4_instanced_drawing_vao_not_instanced,
    webgl_15_5_instanced_drawing_vao,
    webgl_15_6_2d_rectangles_indexed,
    webgl_15_6_2d_cross_indexed,
    webgl_15_7_2d_cross_indexed_rotate,
    webgl_15_8_instanced_drawing_vao_indexed_not_instanced,
    webgl_15_9_instanced_drawing_vao_indexed,
    webgl_15_10_2d_cross_indexed_vao_instanced,
    webgl_15_11_instanced_drawing_texture,
    webgl_15_12_instanced_drawing_texture_instanced,
    webgl_15_13_cube_vbo_subdata,
    webgl_15_14_cube_vbo_subdata_instanced,
}
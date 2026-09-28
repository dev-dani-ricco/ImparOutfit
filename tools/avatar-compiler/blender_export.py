import bpy, json, sys
from pathlib import Path

argv = sys.argv
request_path = Path(argv[argv.index("--") + 1])
request = json.loads(request_path.read_text(encoding="utf-8"))
obj = request["obj"]
output = request["output"]
color = request["skinColor"].lstrip("#")
rgb = tuple(int(color[i:i+2], 16) / 255 for i in (0, 2, 4))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=obj)
body = next((o for o in bpy.context.scene.objects if o.type == "MESH"), None)
if body is None:
    raise RuntimeError("No body mesh imported")

body.name = "IMPAR_Avatar_Body_CC0"
for poly in body.data.polygons:
    poly.use_smooth = True

material = bpy.data.materials.new("IMPAR_Skin")
material.diffuse_color = (*rgb, 1.0)
material.use_nodes = True
bsdf = material.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.52
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.06
body.data.materials.append(material)

bpy.context.view_layer.objects.active = body
body.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.delete_loose(use_verts=True, use_edges=True, use_faces=False)
bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.export_scene.gltf(
    filepath=output,
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_normals=True,
    export_materials="EXPORT",
    export_apply=True,
)
print("IMPAR_AVATAR_GLTF_EXPORTED", output)

import bpy, math
from pathlib import Path
ROOT=Path(r"C:\Users\NewBio Digital\ImparOutfit")
OUT=ROOT/"frontend"/"assets"/"models"/"garments"
OUT.mkdir(parents=True,exist_ok=True)

def reset():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def material():
    m=bpy.data.materials.new("IMPAR_GarmentProxy")
    m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=(0.28,0.045,0.11,1)
    b.inputs["Roughness"].default_value=.68
    b.inputs["Metallic"].default_value=0
    return m

def smooth(o,w=.025):
    if o.type!='MESH': return
    for p in o.data.polygons:p.use_smooth=True
    mod=o.modifiers.new("SoftEdges",'BEVEL');mod.width=w;mod.segments=3
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)

def cyl(name,r,d,loc,scale=(1,1,1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=d,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return o

def cube(name,loc,scale,w=.05):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);smooth(o,w);return o

def torus(name,maj,minr,loc,rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=maj,minor_radius=minr,major_segments=64,minor_segments=16,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;return o

def export(kind,objs):
    m=material()
    for o in objs:
        if o.type=='MESH':o.data.materials.append(m)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0]
    bpy.ops.object.join();obj=bpy.context.object;obj.name="IMPAR_"+kind.upper()+"_PROXY"
    out=OUT/(kind+".glb")
    bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_apply=True)
    print("EXPORTED",kind,out.stat().st_size)

def top():
    reset();t=cyl("Torso",.65,1.25,(0,.25,0),(1,1,.62))
    l=cyl("SleeveL",.19,.95,(-.72,.28,0),(1,1,.9));l.rotation_euler[2]=math.radians(-9)
    r=cyl("SleeveR",.19,.95,(.72,.28,0),(1,1,.9));r.rotation_euler[2]=math.radians(9)
    c=torus("Collar",.22,.035,(0,.88,0),(math.radians(90),0,0))
    for o in [t,l,r]:smooth(o,.018)
    export("top",[t,l,r,c])

def pants():
    reset();w=cube("Waist",(0,.8,0),(.78,.28,.42),.055)
    l=cyl("LegL",.28,1.75,(-.26,-.15,0),(.85,1,.78));r=cyl("LegR",.28,1.75,(.26,-.15,0),(.85,1,.78))
    smooth(l,.018);smooth(r,.018);export("pants",[w,l,r])

def skirt():
    reset();bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=.88,radius2=.55,depth=1.55,location=(0,.05,0))
    o=bpy.context.object;o.name="Skirt";o.scale=(1,1,.68);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);smooth(o,.018);export("skirt",[o])

def dress():
    reset();t=cyl("DressTop",.61,.95,(0,.72,0),(1,1,.62));smooth(t,.018)
    bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=.92,radius2=.58,depth=1.75,location=(0,-.53,0))
    s=bpy.context.object;s.name="DressSkirt";s.scale=(1,1,.68);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);smooth(s,.018)
    export("dress",[t,s])

def bag():
    reset();b=cube("BagBody",(0,0,0),(1.1,.85,.38),.09);h=torus("Handle",.44,.055,(0,.72,0),(math.radians(90),0,0));export("bag",[b,h])

def shoe():
    reset();b=cube("ShoeBase",(0,-.05,0),(1.45,.38,.62),.13)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(.55,.02,0))
    t=bpy.context.object;t.name="Toe";t.scale=(.7,.38,.62);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    export("shoe",[b,t])

for fn in [top,pants,skirt,dress,bag,shoe]:fn()

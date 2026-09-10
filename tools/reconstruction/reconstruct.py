"""Local experimental SfM + rectified stereo. Never substitutes a generic mesh.
All images/work products remain under the caller's private job directory.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

import cv2
import numpy as np
import pycolmap
import trimesh

VERSION = "cpu-sfm-sgbm-v1"
cv2.setNumThreads(2)


class CaptureFailure(Exception):
    def __init__(self, code, guidance, metrics=None):
        self.code, self.guidance, self.metrics = code, guidance, metrics or {}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def grid_mesh(points, colors, valid, stride=3):
    """Measured disparity samples form triangles; no hull/box/prior is fabricated."""
    points, colors, valid = points[::stride, ::stride], colors[::stride, ::stride], valid[::stride, ::stride]
    h, w = valid.shape
    ids = np.arange(h*w).reshape(h, w)
    a, b, c, d = ids[:-1, :-1], ids[:-1, 1:], ids[1:, :-1], ids[1:, 1:]
    faces = np.concatenate([np.stack([a,b,c],-1).reshape(-1,3), np.stack([b,d,c],-1).reshape(-1,3)])
    vertices = points.reshape(-1,3)
    faces = faces[np.all(valid.reshape(-1)[faces],axis=1)]
    if not len(faces):
        return None
    tri = vertices[faces]
    edges = np.stack([np.linalg.norm(tri[:,0]-tri[:,1],axis=1),np.linalg.norm(tri[:,0]-tri[:,2],axis=1),np.linalg.norm(tri[:,1]-tri[:,2],axis=1)],axis=1)
    # Reject depth discontinuities, relative to observed scene extent, not invented meters.
    size = np.linalg.norm(np.ptp(vertices[valid.reshape(-1)],axis=0))
    area = np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)
    faces = faces[(np.max(edges,axis=1)<size*.04)&(area>1e-12)]
    if not len(faces):
        return None
    used, remap = np.unique(faces,return_inverse=True)
    return trimesh.Trimesh(vertices=vertices[used],faces=remap.reshape(-1,3),
                           vertex_colors=colors.reshape(-1,3)[used],process=False)


def foreground(image):
    # Experimental segmentation only. Human must reject retained background/missing surfaces.
    h,w=image.shape[:2]
    mask=np.zeros((h,w),np.uint8)
    cv2.grabCut(image,mask,(int(w*.04),int(h*.04),int(w*.92),int(h*.92)),
                np.zeros((1,65)),np.zeros((1,65)),3,cv2.GC_INIT_WITH_RECT)
    return ((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD)).astype(np.uint8)


def stereo_mesh(left,right,K1,K2,R,T,world_R,world_t):
    h,w=left.shape[:2]
    if right.shape[:2]!=(h,w) or np.linalg.norm(T)<1e-6:
        return None,0
    r1,r2,p1,p2,Q,_,_=cv2.stereoRectify(K1,None,K2,None,(w,h),R,np.asarray(T).reshape(3,1),flags=cv2.CALIB_ZERO_DISPARITY,alpha=0)
    # SGBM assumes a horizontal baseline. Vertical pairs are explicitly rejected.
    if abs(p2[1,3])>abs(p2[0,3]):
        return None,0
    map1=cv2.initUndistortRectifyMap(K1,None,r1,p1,(w,h),cv2.CV_32FC1)
    map2=cv2.initUndistortRectifyMap(K2,None,r2,p2,(w,h),cv2.CV_32FC1)
    l=cv2.remap(left,*map1,cv2.INTER_LINEAR)
    r=cv2.remap(right,*map2,cv2.INTER_LINEAR)
    disparities=max(16,min(128,(w//4//16)*16))
    minimum=-disparities if p2[0,3]>0 else 0
    matcher=cv2.StereoSGBM_create(minDisparity=minimum,numDisparities=disparities,blockSize=5,
                                 P1=8*25,P2=32*25,disp12MaxDiff=1,uniquenessRatio=12,
                                 speckleWindowSize=100,speckleRange=2,mode=cv2.STEREO_SGBM_MODE_SGBM_3WAY)
    disparity=matcher.compute(cv2.cvtColor(l,cv2.COLOR_BGR2GRAY),cv2.cvtColor(r,cv2.COLOR_BGR2GRAY)).astype(np.float32)/16
    xyz=cv2.reprojectImageTo3D(disparity,Q)
    mask=cv2.remap(foreground(left),*map1,cv2.INTER_NEAREST).astype(bool)
    valid=(disparity>minimum)&(np.abs(disparity)>.5)&np.isfinite(xyz).all(axis=2)&(xyz[:,:,2]>0)&mask
    if np.count_nonzero(valid)<100:
        return None,int(np.count_nonzero(valid))
    z=xyz[:,:,2][valid]
    lo,hi=np.percentile(z,[2,98])
    valid&=(xyz[:,:,2]>=lo)&(xyz[:,:,2]<=hi)
    world=(np.where(valid[:,:,None],xyz,0)@r1-world_t)@world_R
    return grid_mesh(world,cv2.cvtColor(l,cv2.COLOR_BGR2RGB),valid),int(np.count_nonzero(valid))


def reconstruct(manifest, work):
    policy=manifest["policy"]
    metrics={"category":manifest["category"],"pipeline_version":VERSION,"reconstruction_success":False,
             "first_pass_success":False,"recapture_required":False,"manual_correction":False}
    image_dir=work/"images"
    image_dir.mkdir()
    seen=set()
    sharpness=[]
    for i,asset in enumerate(manifest["inputs"]):
        source=Path(asset["path"]).resolve()
        # Manifest built by trusted worker; validate bytes again across process boundary.
        actual=digest(source)
        if actual!=asset["sha256"] or actual in seen:
            raise CaptureFailure("INPUT_INTEGRITY",["Substitua a captura repetida ou corrompida."],metrics)
        seen.add(actual)
        img=cv2.imread(str(source))
        if img is None or min(img.shape[:2])<policy["minImageSide"]:
            raise CaptureFailure("INPUT_RESOLUTION",["Recapture com pelo menos 480 pixels no menor lado."],metrics)
        gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
        score=float(cv2.Laplacian(gray,cv2.CV_64F).var())
        sharpness.append(score)
        if score<policy["minSharpness"]:
            raise CaptureFailure("BLUR_OR_LOW_TEXTURE",["Recapture com foco e luz difusa; superfície sem textura pode impedir correspondências."],{**metrics,"sharpness":sharpness})
        scale=min(1,960/max(img.shape[:2]))
        if scale<1:
            img=cv2.resize(img,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(image_dir/f"{i:03d}.png"),img)
    metrics["sharpness"]=sharpness
    metrics["inputHashes"]=sorted(seen)
    database=work/"features.db"
    sparse=work/"sparse";sparse.mkdir()
    extraction=pycolmap.FeatureExtractionOptions()
    extraction.use_gpu=False;extraction.num_threads=2;extraction.max_image_size=960
    extraction.sift.max_num_features=4096
    reader=pycolmap.ImageReaderOptions();reader.camera_model="SIMPLE_RADIAL"
    pycolmap.extract_features(database,image_dir,camera_mode=pycolmap.CameraMode.SINGLE,
                             reader_options=reader,extraction_options=extraction,device=pycolmap.Device.cpu)
    matching=pycolmap.FeatureMatchingOptions();matching.use_gpu=False;matching.num_threads=2
    pycolmap.match_exhaustive(database,matching_options=matching,device=pycolmap.Device.cpu)
    options=pycolmap.IncrementalPipelineOptions()
    options.num_threads=2;options.random_seed=0;options.max_num_models=1
    options.max_runtime_seconds=1200;options.min_model_size=3
    models=pycolmap.incremental_mapping(database,image_dir,sparse,options=options)
    if not models:
        raise CaptureFailure("SFM_NO_MODEL",["Nenhuma geometria foi recuperada. Mantenha a peça imóvel e aumente sobreposição/textura."],metrics)
    index,rec=max(models.items(),key=lambda p:p[1].num_reg_images())
    metrics.update(registeredImages=rec.num_reg_images(),registeredRatio=rec.num_reg_images()/len(manifest["inputs"]),
                   sparsePoints=rec.num_points3D(),reprojectionError=float(rec.compute_mean_reprojection_error()))
    if metrics["registeredRatio"]<policy["minRegisteredRatio"]:
        raise CaptureFailure("SFM_COVERAGE",["Vistas não registradas: recapture regiões sem sobreposição, reflexivas ou deformadas."],metrics)
    dense=work/"undistorted"
    undistort=pycolmap.UndistortCameraOptions();undistort.max_image_size=640
    pycolmap.undistort_images(dense,sparse/str(index),image_dir,undistort_options=undistort,num_threads=2)
    return reconstruct_surface(work,dense,metrics,seen,policy)


def reconstruct_surface(work,dense,metrics,seen,policy):
    rec=pycolmap.Reconstruction(dense/"sparse")
    images=sorted(rec.images.values(),key=lambda x:x.name)
    meshes=[];pairs=[]
    for i in range(min(len(images)-1,24)):
        a,b=images[i],images[i+1]
        left=cv2.imread(str(dense/"images"/a.name));right=cv2.imread(str(dense/"images"/b.name))
        ca,cb=rec.cameras[a.camera_id],rec.cameras[b.camera_id]
        ra,rb=a.cam_from_world(),b.cam_from_world()
        R1,R2=ra.rotation.matrix(),rb.rotation.matrix()
        t1,t2=ra.translation,rb.translation
        R=R2@R1.T;T=t2-R@t1
        mesh,count=stereo_mesh(left,right,ca.calibration_matrix(),cb.calibration_matrix(),R,T,R1,t1)
        pairs.append({"left":a.name,"right":b.name,"validPixels":count,"triangles":len(mesh.faces) if mesh is not None else 0})
        if mesh is not None:
            meshes.append(mesh)
    metrics["stereoPairs"]=pairs
    if not meshes:
        raise CaptureFailure("DENSE_NO_SURFACE",["Estéreo não recuperou superfície. Refaça vistas próximas, com foco, textura e peça estática."],metrics)
    mesh=trimesh.util.concatenate(meshes)
    mesh.remove_unreferenced_vertices()
    if len(mesh.faces)>policy["maxTriangles"]:
        raise CaptureFailure("MESH_BUDGET",["Mesh excedeu orçamento da POC; ajuste resolução/pares no worker."],metrics)
    # Original camera frame retained; origin is centered, dimensions remain arbitrary SfM units.
    mesh.vertices-=mesh.bounds.mean(axis=0)
    raw=trimesh.exchange.gltf.export_glb(trimesh.Scene(mesh))
    output=work/"reconstruction.glb";output.write_bytes(raw)
    metrics.update(reconstruction_success=True,triangles=len(mesh.faces),vertices=len(mesh.vertices),
                   invalidGeometry=0,dimensionsInSfmUnits=mesh.extents.tolist(),textureMode="VERTEX_COLOR",
                   geometryCompleteness="UNVERIFIED",categoryConfidence="USER_DECLARED",scaleConfidence=None,
                   manualInspectionRequired=True)
    return {"status":"QUALITY_CHECK","metrics":metrics,"output":"reconstruction.glb","sha256":digest(output),
            "provenance":{"pipelineVersion":VERSION,"inputHashes":sorted(seen),"technique":"COLMAP_CPU_SGBM",
                          "geometry":"MULTIVIEW_TRIANGULATION","material":"VERTEX_COLOR"}}


def main():
    parser=argparse.ArgumentParser();parser.add_argument("--manifest",required=True);args=parser.parse_args()
    manifest_path=Path(args.manifest).resolve();work=manifest_path.parent
    start=time.monotonic()
    manifest=json.loads(manifest_path.read_text(encoding="utf-8-sig"))
    try:
        result=reconstruct(manifest,work)
    except CaptureFailure as error:
        result={"status":"NEEDS_MORE_INPUT","error_code":error.code,"guidance":error.guidance,
                "metrics":{**error.metrics,"recapture_required":True,"failure_reason":error.code}}
    except Exception as error:
        # Do not export paths, raw captures, stack traces or private data to API/logs.
        result={"status":"FAILED","error_code":"PIPELINE_EXCEPTION","exceptionType":type(error).__name__,
                "metrics":{"reconstruction_success":False,"first_pass_success":False,"failure_reason":"PIPELINE_EXCEPTION"}}
    result.setdefault("metrics",{})["processing_duration"]=round(time.monotonic()-start,3)
    (work/"result.json").write_text(json.dumps(result,allow_nan=False,indent=2),encoding="utf-8")
    print(json.dumps({"status":result["status"],"duration":result["metrics"]["processing_duration"],
                      "code":result.get("error_code")}))


if __name__=="__main__":
    main()

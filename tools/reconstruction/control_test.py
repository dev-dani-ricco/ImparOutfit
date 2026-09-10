"""Reproducible SYNTHETIC control; never evidence for a physical item/family."""
import json, math, hashlib, time, sys
from pathlib import Path
import cv2
import numpy as np
import reconstruct

root=Path(__file__).resolve().parents[2]
work=root/"private"/"reconstruction-control"/str(time.time_ns())
work.mkdir(parents=True)
rng=np.random.default_rng(20260909)
K=np.array([[850.,0,480],[0,850,360],[0,0,1.]])
faces=[
 (np.array([[-.45,-.55,.3],[.45,-.55,.3],[.45,.55,.3],[-.45,.55,.3]]),[0,0,1]),
 (np.array([[.45,-.55,-.3],[-.45,-.55,-.3],[-.45,.55,-.3],[.45,.55,-.3]]),[0,0,-1]),
 (np.array([[.45,-.55,.3],[.45,-.55,-.3],[.45,.55,-.3],[.45,.55,.3]]),[1,0,0]),
 (np.array([[-.45,-.55,-.3],[-.45,-.55,.3],[-.45,.55,.3],[-.45,.55,-.3]]),[-1,0,0]),
 (np.array([[-.45,.55,.3],[.45,.55,.3],[.45,.55,-.3],[-.45,.55,-.3]]),[0,1,0]),
]
textures=[]
for _ in faces:
 texture=np.full((512,512,3),210,np.uint8)
 for k in range(600):
  x,y=rng.integers(8,504,2);color=rng.integers(10,180,3).tolist()
  cv2.circle(texture,(int(x),int(y)),int(rng.integers(2,7)),color,-1)
 textures.append(texture)
inputs=[]
views=int(sys.argv[1]) if len(sys.argv)>1 else 12
for i in range(views):
 angle=i*2*math.pi/views
 camera=np.array([2.2*math.sin(angle),(.15 if i%2 else .5) if views==12 else .35,2.2*math.cos(angle)])
 forward=-camera/np.linalg.norm(camera);right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right)
 down=np.cross(forward,right);R=np.stack([right,down,forward]);t=-R@camera
 image=np.full((720,960,3),245,np.uint8)
 for idx in sorted(range(len(faces)),key=lambda k:np.linalg.norm(faces[k][0].mean(axis=0)-camera),reverse=True):
  vertices,normal=faces[idx]
  if np.dot(np.array(normal),camera-vertices.mean(axis=0))<=0:continue
  projected=(vertices@R.T+t)@K.T;uv=(projected[:,:2]/projected[:,2:]).astype(np.float32)
  H=cv2.getPerspectiveTransform(np.float32([[0,0],[511,0],[511,511],[0,511]]),uv)
  warped=cv2.warpPerspective(textures[idx],H,(960,720))
  mask=cv2.warpPerspective(np.ones((512,512),np.uint8),H,(960,720)).astype(bool)
  image[mask]=warped[mask]
 path=work/f"control-{i:02d}.png";cv2.imwrite(str(path),image)
 inputs.append({"path":str(path),"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"azimuth":i*360/views,"elevation":"MID" if views!=12 or i%2 else "HIGH"})
policy=json.loads((root/"backend/src/reconstruction/policy.json").read_text(encoding="utf-8-sig"))
manifest={"category":"SYNTHETIC_CONTROL","policy":policy,"inputs":inputs,"source":"SYNTHETIC_RENDER_NOT_PHYSICAL"}
(work/"manifest.json").write_text(json.dumps(manifest),encoding="utf8")
print(str(work),flush=True)
start=time.monotonic()
try:
 result=reconstruct.reconstruct(manifest,work)
except reconstruct.CaptureFailure as e:
 result={"status":"NEEDS_MORE_INPUT","error_code":e.code,"guidance":e.guidance,"metrics":{**e.metrics,"recapture_required":True}}
except Exception as e:
 result={"status":"FAILED","error_code":type(e).__name__,"diagnostic":str(e)}
result["source"]="SYNTHETIC_RENDER_NOT_PHYSICAL";result["duration_seconds"]=time.monotonic()-start
(work/"result.json").write_text(json.dumps(result,indent=2,allow_nan=False),encoding="utf8")
print(json.dumps(result),flush=True)

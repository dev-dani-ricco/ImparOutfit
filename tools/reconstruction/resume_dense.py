"""Resume only dense processing, verifying original input hashes and SfM coverage."""
import sys,json,time
from pathlib import Path
import pycolmap
from reconstruct import digest,reconstruct_surface,CaptureFailure
work=Path(sys.argv[1]).resolve()
manifest=json.loads((work/'manifest.json').read_text(encoding='utf-8-sig'))
seen={digest(Path(i['path'])) for i in manifest['inputs']}
assert seen=={i['sha256'] for i in manifest['inputs']},'Changed inputs'
r=pycolmap.Reconstruction(work/'undistorted/sparse')
metrics={'registeredImages':r.num_reg_images(),'registeredRatio':r.num_reg_images()/len(manifest['inputs']),'sparsePoints':r.num_points3D(),'reprojectionError':float(r.compute_mean_reprojection_error()),'first_pass_success':False,'manual_correction':True}
assert metrics['registeredRatio']>=manifest['policy']['minRegisteredRatio'],'Insufficient registered cameras'
start=time.monotonic();result=reconstruct_surface(work,work/'undistorted',metrics,seen,manifest['policy'])
result['duration_seconds']=time.monotonic()-start;result['source']=manifest.get('source','CAPTURE_MANIFEST');result['resume']='DENSE_AFTER_INTEGRATION_FIX'
(work/'result-resumed.json').write_text(json.dumps(result,indent=2,allow_nan=False),encoding='utf8')
print(json.dumps({'state':result['status'],'duration':result['duration_seconds'],'metrics':result['metrics']}))

"""Reproducible private experiment runner; missing data is NOT_RUN, not a failed family."""
import argparse,json,time
from pathlib import Path
from reconstruct import reconstruct,digest,CaptureFailure
parser=argparse.ArgumentParser()
parser.add_argument("--manifest",required=True);parser.add_argument("--output",required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parents[2];out=Path(args.output).resolve()
if not out.is_relative_to(root/"private"):
    raise SystemExit("Output must be inside ignored private/; never publish capture binaries.")
out.mkdir(parents=True,exist_ok=False)
manifest_path=Path(args.manifest).resolve()
manifest=json.loads(manifest_path.read_text(encoding="utf-8-sig"))
policy=json.loads((root/"backend/src/reconstruction/policy.json").read_text(encoding="utf-8-sig"))
start=time.monotonic()
raw=manifest.get("inputs",[])
if not raw:
    result={"status":"NOT_RUN","code":"NO_REAL_CAPTURE_INPUTS","category":manifest["category"],"photo_count":0,"duration_seconds":None}
else:
    if manifest.get("source")!="REAL_PHYSICAL_CAPTURE":
        raise SystemExit("Manifest must explicitly identify the provenance of physical capture; synthetic controls use control_test.py.")
    inputs=[]
    for asset in raw:
        path=(manifest_path.parent/asset["path"]).resolve()
        inputs.append({**asset,"path":str(path),"sha256":digest(path)})
    m={**manifest,"inputs":inputs,"policy":policy}
    (out/"manifest.json").write_text(json.dumps(m,indent=2),encoding="utf8")
    try:
        if len(inputs)<policy["minPhotos"] or len({i["sha256"] for i in inputs})!=len(inputs):
            raise CaptureFailure("CAPTURE_INCOMPLETE",["Fotos insuficientes ou repetidas."])
        if len({int(i["azimuth"])//45 for i in inputs})<policy["minAzimuthSectors"] or len({i["elevation"] for i in inputs})<policy["minElevationLevels"]:
            raise CaptureFailure("CAPTURE_COVERAGE",["Complete a volta e fotografe em outra altura."])
        result=reconstruct(m,out)
    except CaptureFailure as e:
        result={"status":"NEEDS_MORE_INPUT","code":e.code,"guidance":e.guidance,"metrics":{**e.metrics,"recapture_required":True}}
    except Exception as e:
        result={"status":"FAILED","code":"PIPELINE_EXCEPTION","exceptionType":type(e).__name__}
    result["duration_seconds"]=time.monotonic()-start
    result["category"]=manifest["category"];result["photo_count"]=len(inputs)
(out/"experiment.json").write_text(json.dumps(result,indent=2,allow_nan=False),encoding="utf8")
print(json.dumps({"category":result["category"],"status":result["status"],"code":result.get("code"),"photo_count":result["photo_count"],"duration_seconds":result["duration_seconds"]}))

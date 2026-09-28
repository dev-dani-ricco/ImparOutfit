#!/usr/bin/env python3
import argparse, gzip, hashlib, json, os, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENDOR = ROOT / "vendor" / "makehuman-hm08"
TARGETS = VENDOR / "targets"
BASE_OBJ = VENDOR / "base.obj"
LICENSE = VENDOR / "LICENSE.ASSETS.md"

FACE_TARGETS = {
    "oval": "head-oval.target.gz",
    "round": "head-round.target.gz",
    "square": "head-square.target.gz",
    "heart": "head-invertedtriangular.target.gz",
    "long": "head-rectangular.target.gz",
}
SKIN = {
    "porcelain": "#F1C9B5",
    "light": "#E4B49C",
    "medium": "#C68E6D",
    "tan": "#A96F52",
    "deep": "#744633",
    "rich": "#4C2D24",
}

def clamp(v, lo=-1.0, hi=1.0):
    return max(lo, min(hi, float(v)))

def signed_pair(value, decrease, increase):
    value = clamp(value)
    if value < 0:
        return [(decrease, abs(value))]
    if value > 0:
        return [(increase, value)]
    return []

def read_target(path):
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#") or line.startswith('"'):
                continue
            parts = line.split()
            if len(parts) < 4:
                continue
            idx = int(parts[0])
            x = float(parts[1])
            y = -float(parts[3])
            z = float(parts[2])
            yield idx, x, y, z

def parse_base_obj():
    vertices = []
    passthrough = []
    faces_by_group = {}
    current_group = None
    for raw in BASE_OBJ.read_text(encoding="utf-8").splitlines():
        if raw.startswith("v "):
            _, x, y, z = raw.split()[:4]
            vertices.append([float(x), float(y), float(z)])
            continue
        if raw.startswith("g "):
            current_group = raw[2:].strip()
            faces_by_group.setdefault(current_group, [])
            continue
        if raw.startswith("f "):
            if current_group:
                faces_by_group.setdefault(current_group, []).append(raw)
            continue
        if raw.startswith(("vt ", "vn ", "#")):
            passthrough.append(raw)
    return vertices, passthrough, faces_by_group

def apply_target(vertices, filename, weight):
    if weight <= 0:
        return
    path = TARGETS / filename
    if not path.exists():
        raise FileNotFoundError(f"Missing approved target: {filename}")
    for idx, x, y, z in read_target(path):
        if idx >= len(vertices):
            continue
        vertices[idx][0] += x * weight
        vertices[idx][1] += y * weight
        vertices[idx][2] += z * weight

def profile_targets(profile):
    result = []
    bust = clamp((float(profile.get("bust", 94)) - 94) / 35)
    waist = clamp((float(profile.get("waist", 76)) - 76) / 35)
    hips = clamp((float(profile.get("hips", 104)) - 104) / 40)
    height = clamp((float(profile.get("height", 168)) - 168) / 30)
    shoulders = clamp(float(profile.get("shoulders", 0)) / 50)
    torso = clamp(float(profile.get("torso", 0)) / 50)
    thighs = clamp(float(profile.get("thighs", 0)) / 50)
    head_width = clamp(float(profile.get("headWidth", 0)) / 50)
    jaw = clamp(float(profile.get("jaw", 0)) / 50)
    chin = clamp(float(profile.get("chin", 0)) / 50)
    face_depth = clamp(float(profile.get("faceDepth", 0)) / 50)

    result += signed_pair(bust, "measure-bust-circ-decr.target.gz", "measure-bust-circ-incr.target.gz")
    result += signed_pair(waist, "measure-waist-circ-decr.target.gz", "measure-waist-circ-incr.target.gz")
    result += signed_pair(hips, "measure-hips-circ-decr.target.gz", "measure-hips-circ-incr.target.gz")
    result += signed_pair(shoulders, "measure-shoulder-dist-decr.target.gz", "measure-shoulder-dist-incr.target.gz")
    result += signed_pair(torso, "torso-scale-horiz-decr.target.gz", "torso-scale-horiz-incr.target.gz")
    result += signed_pair(thighs, "measure-thigh-circ-decr.target.gz", "measure-thigh-circ-incr.target.gz")
    result += signed_pair(head_width, "head-scale-horiz-decr.target.gz", "head-scale-horiz-incr.target.gz")
    result += signed_pair(face_depth, "head-scale-depth-decr.target.gz", "head-scale-depth-incr.target.gz")
    result += signed_pair(jaw, "chin-width-decr.target.gz", "chin-width-incr.target.gz")
    result += signed_pair(chin, "chin-height-decr.target.gz", "chin-height-incr.target.gz")
    result += signed_pair(
        height,
        "female-young-averagemuscle-averageweight-minheight.target.gz",
        "female-young-averagemuscle-averageweight-maxheight.target.gz",
    )
    face = FACE_TARGETS.get(profile.get("faceShape", "oval"))
    if face:
        result.append((face, 0.7))
    return result

def write_body_obj(vertices, passthrough, faces, output):
    body_faces = faces.get("body")
    if not body_faces:
        raise RuntimeError("CC0 MakeHuman basemesh does not contain expected 'body' group")
    with output.open("w", encoding="utf-8", newline="\n") as fh:
        fh.write("# IMPAR Outfit compiled from MakeHuman hm08 CC0 basemesh\n")
        fh.write("# Source license: tools/avatar-compiler/vendor/makehuman-hm08/LICENSE.ASSETS.md\n")
        for x, y, z in vertices:
            fh.write(f"v {x:.6f} {y:.6f} {z:.6f}\n")
        for line in passthrough:
            if line.startswith("#"):
                continue
            fh.write(line + "\n")
        fh.write("g body\n")
        for face in body_faces:
            fh.write(face + "\n")

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--blender", default=os.environ.get("BLENDER_BIN", r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"))
    args = ap.parse_args()

    if not BASE_OBJ.exists() or not LICENSE.exists():
        raise SystemExit("Approved MakeHuman CC0 vendor assets are missing")

    profile_path = Path(args.profile)
    output = Path(args.output).resolve()
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    output.parent.mkdir(parents=True, exist_ok=True)

    vertices, passthrough, faces = parse_base_obj()
    applied = []
    for filename, weight in profile_targets(profile):
        if weight <= 0:
            continue
        apply_target(vertices, filename, weight)
        applied.append({"target": filename, "weight": round(weight, 4)})

    with tempfile.TemporaryDirectory(prefix="impar-avatar-") as tmp:
        tmp = Path(tmp)
        obj = tmp / "body.obj"
        request = tmp / "request.json"
        write_body_obj(vertices, passthrough, faces, obj)
        request.write_text(json.dumps({
            "obj": str(obj),
            "output": str(output),
            "skinColor": SKIN.get(profile.get("skinTone", "medium"), SKIN["medium"]),
        }), encoding="utf-8")
        blender_script = ROOT / "blender_export.py"
        command = [args.blender, "-b", "--python", str(blender_script), "--", str(request)]
        completed = subprocess.run(command, text=True)
        if completed.returncode != 0 or not output.exists():
            raise SystemExit(f"Blender export failed with code {completed.returncode}")

    provenance = {
        "schemaVersion": 1,
        "provider": "MAKEHUMAN_CC0",
        "compilerVersion": "1.0.0",
        "source": "makehumancommunity/mpfb2 hm08 basemesh + approved targets",
        "license": "CC0-1.0",
        "profileSha256": hashlib.sha256(json.dumps(profile, sort_keys=True).encode()).hexdigest(),
        "outputSha256": sha256(output),
        "targets": applied,
        "productionAllowed": True,
    }
    provenance_path = output.with_suffix(output.suffix + ".provenance.json")
    provenance_path.write_text(json.dumps(provenance, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "provenance": str(provenance_path), "sha256": provenance["outputSha256"]}))

if __name__ == "__main__":
    main()

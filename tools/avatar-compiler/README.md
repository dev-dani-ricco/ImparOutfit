# IMPAR Avatar Compiler

Headless compiler for production-safe human body assets.

Source family: MakeHuman / MPFB hm08 graphical assets, vendored here under CC0. The compiler refuses to work without the vendored license and required source files.

## Usage

PowerShell:

python compile_avatar.py --profile sample-profile.json --output ../../frontend/assets/models/impar-human-cc0.glb

The output is accompanied by a provenance JSON file containing provider, license, applied targets and SHA-256 checksum.

## Important

- michelle.glb is not a production asset because its provenance is unknown.
- This compiler produces the body mesh only. Hair is currently a separately controlled mobile layer.
- Future hair, eyes and skin asset packs must be individually provenance-reviewed before they become production defaults.
- A compiled avatar is a visual representation, not a biometric scan.

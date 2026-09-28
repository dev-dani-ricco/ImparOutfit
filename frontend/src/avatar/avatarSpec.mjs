export const HAIR_STYLES = [
  { id: 'buzzed', label: 'Curto', asset: 'Hair_Buzzed' },
  { id: 'parted', label: 'Partido', asset: 'Hair_SimpleParted' },
  { id: 'long', label: 'Longo', asset: 'Hair_Long' },
  { id: 'buns', label: 'Coques', asset: 'Hair_Buns' },
];

export const FACE_SHAPES = [
  { id: 'oval', label: 'Oval' },
  { id: 'round', label: 'Redondo' },
  { id: 'square', label: 'Quadrado' },
  { id: 'diamond', label: 'Diamante' },
  { id: 'triangular', label: 'Triangular' },
];

export const SKIN_TONES = ['#F4D7C4','#E8BDA2','#D79B76','#B97855','#875139','#4E2E23'];
export const HAIR_COLORS = ['#1F1714','#3B271E','#6A452D','#A56C3F','#D5B17A','#7B2C23'];
export const EYE_COLORS = ['#2E211B','#4E382D','#6C5439','#6A7652','#4B6975','#718CA3'];

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0.5));
const numberFrom = (value, fallback) => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const signed = (value) => clamp01(value) * 2 - 1;
const pair = (weight, positive, negative, scale = 1) => {
  const v = signed(weight) * scale;
  return v >= 0 ? { [positive]: v } : { [negative]: -v };
};
const symmetricPair = (weight, posL, posR, negL, negR, scale = 1) => {
  const v = signed(weight) * scale;
  return v >= 0
    ? { [posL]: v, [posR]: v }
    : { [negL]: -v, [negR]: -v };
};

export function normalizeAvatarSpec(profile = {}) {
  const legacyHair = { Curto: 'buzzed', Longo: 'long', Coque: 'buns', Cacheado: 'parted' }[profile.hairStyle];
  const controls = profile.avatarControls || {};
  const face = controls.face || {};
  const body = controls.body || {};
  const appearance = controls.appearance || {};

  return {
    version: 2,
    heightCm: numberFrom(profile.height, 168),
    measurements: {
      bust: numberFrom(profile.bust, 94),
      waist: numberFrom(profile.waist, 76),
      hips: numberFrom(profile.hips, 104),
    },
    body: {
      presentation: body.presentation || 'feminine',
      weight: clamp01(body.weight ?? 0.48),
      muscle: clamp01(body.muscle ?? 0.42),
      shoulders: clamp01(body.shoulders ?? 0.5),
      chest: clamp01(body.chest ?? 0.5),
      waist: clamp01(body.waist ?? 0.45),
      hips: clamp01(body.hips ?? 0.55),
      belly: clamp01(body.belly ?? 0.42),
      arms: clamp01(body.arms ?? 0.48),
      armsLength: clamp01(body.armsLength ?? 0.5),
      thighs: clamp01(body.thighs ?? 0.5),
      calves: clamp01(body.calves ?? 0.5),
      glutes: clamp01(body.glutes ?? 0.5),
      legsLength: clamp01(body.legsLength ?? 0.5),
    },
    face: {
      shape: face.shape || 'oval',
      width: clamp01(face.width ?? 0.5),
      jaw: clamp01(face.jaw ?? 0.45),
      chin: clamp01(face.chin ?? 0.5),
      chinProjection: clamp01(face.chinProjection ?? 0.5),
      cheek: clamp01(face.cheek ?? 0.5),
      forehead: clamp01(face.forehead ?? 0.5),
      noseBridge: clamp01(face.noseBridge ?? 0.5),
      noseWidth: clamp01(face.noseWidth ?? 0.5),
      noseLength: clamp01(face.noseLength ?? 0.5),
      noseProjection: clamp01(face.noseProjection ?? 0.5),
      eyesSize: clamp01(face.eyesSize ?? 0.5),
      eyesSpacing: clamp01(face.eyesSpacing ?? 0.5),
      eyesHeight: clamp01(face.eyesHeight ?? 0.5),
      mouthWidth: clamp01(face.mouthWidth ?? 0.5),
      lipFullness: clamp01(face.lipFullness ?? 0.5),
    },
    appearance: {
      skinTone: appearance.skinTone || '#D79B76',
      eyeColor: appearance.eyeColor || '#4E382D',
      hairStyle: appearance.hairStyle || legacyHair || 'parted',
      hairColor: appearance.hairColor || '#3B271E',
    },
  };
}

export function avatarSpecToProfile(profile, spec) {
  return {
    ...profile,
    height: String(Math.round(spec.heightCm)),
    bust: String(Math.round(spec.measurements.bust)),
    waist: String(Math.round(spec.measurements.waist)),
    hips: String(Math.round(spec.measurements.hips)),
    hairStyle: HAIR_STYLES.find((hair) => hair.id === spec.appearance.hairStyle)?.label || 'Partido',
    avatarControls: {
      face: { ...spec.face },
      body: { ...spec.body },
      appearance: { ...spec.appearance },
    },
    avatarConfiguredAt: profile.avatarConfiguredAt || new Date().toISOString(),
    avatarUpdatedAt: new Date().toISOString(),
    avatarProvider: 'MAKEHUMAN_CC0',
    avatarVersion: '3.0.0',
    avatarEngine: 'makehuman-parametric-v3',
  };
}

export function avatarMorphWeights(spec) {
  const morphs = {};
  const add = (next) => Object.assign(morphs, next);

  if (spec.body.presentation === 'masculine') morphs.bodyMasculine = 0.86;
  else if (spec.body.presentation === 'neutral') {
    morphs.bodyFeminine = 0.35;
    morphs.bodyMasculine = 0.35;
  } else morphs.bodyFeminine = 0.86;

  add(pair(spec.body.weight, 'bodyHeavier', 'bodyThinner', 0.82));
  add(pair(spec.body.muscle, 'bodyMuscular', 'bodySofter', 0.74));
  add(pair(spec.body.shoulders, 'shouldersWider', 'shouldersNarrower', 0.72));
  add(pair(spec.body.chest, 'chestDeeper', 'chestNarrower', 0.55));
  add(pair(spec.body.waist, 'waistWider', 'waistNarrower', 0.68));
  add(pair(spec.body.hips, 'hipsWider', 'hipsNarrower', 0.72));
  add(pair(spec.body.belly, 'bellyBigger', 'bellyToned', 0.55));
  add(pair(spec.body.arms, 'armsThicker', 'armsThinner', 0.58));
  add(pair(spec.body.armsLength, 'armsLonger', 'armsShorter', 0.44));
  add(pair(spec.body.thighs, 'thighsThicker', 'thighsThinner', 0.58));
  add(pair(spec.body.calves, 'calvesThicker', 'calvesThinner', 0.52));
  add(pair(spec.body.glutes, 'gluteusBigger', 'gluteusSmaller', 0.54));
  add(pair(spec.body.legsLength, 'legsLonger', 'legsShorter', 0.48));

  const bustDelta = (spec.measurements.bust - 94) / 28;
  if (bustDelta >= 0) morphs.bustBigger = Math.min(0.85, bustDelta);
  else morphs.bustSmaller = Math.min(0.85, -bustDelta);

  const waistDelta = (spec.measurements.waist - 76) / 30;
  if (waistDelta >= 0) morphs.waistWider = Math.max(morphs.waistWider || 0, Math.min(0.86, waistDelta));
  else morphs.waistNarrower = Math.max(morphs.waistNarrower || 0, Math.min(0.86, -waistDelta));

  const hipDelta = (spec.measurements.hips - 104) / 32;
  if (hipDelta >= 0) morphs.hipsWider = Math.max(morphs.hipsWider || 0, Math.min(0.86, hipDelta));
  else morphs.hipsNarrower = Math.max(morphs.hipsNarrower || 0, Math.min(0.86, -hipDelta));

  const heightBias = Math.min(1, Math.abs(spec.heightCm - 168) / 22);
  if (spec.heightCm >= 168) morphs.heightTaller = heightBias * 0.62;
  else morphs.heightShorter = heightBias * 0.62;

  const shapeMorph = { oval: 'headOval', round: 'headRound', square: 'headSquare', diamond: 'headDiamond', triangular: 'headTriangular' }[spec.face.shape];
  if (shapeMorph) morphs[shapeMorph] = 0.64;

  add(pair(spec.face.width, 'headWider', 'headNarrower', 0.62));
  add(pair(spec.face.jaw, 'jawWider', 'jawNarrower', 0.65));
  add(pair(spec.face.chin, 'jawChinLonger', 'jawChinShorter', 0.55));
  add(pair(spec.face.chinProjection, 'jawChinForward', 'jawChinBack', 0.5));
  add(symmetricPair(spec.face.cheek, 'cheekFullerLeft', 'cheekFullerRight', 'cheekHollowLeft', 'cheekHollowRight', 0.55));
  add(pair(spec.face.forehead, 'foreheadTaller', 'foreheadShorter', 0.52));
  add(pair(spec.face.noseBridge, 'noseBridgeWider', 'noseBridgeNarrower', 0.5));
  add(pair(spec.face.noseWidth, 'noseWider', 'noseNarrower', 0.62));
  add(pair(spec.face.noseLength, 'noseLonger', 'noseShorter', 0.6));
  add(pair(spec.face.noseProjection, 'noseForward', 'noseBackward', 0.52));
  add(symmetricPair(spec.face.eyesSize, 'eyeBiggerLeft', 'eyeBiggerRight', 'eyeSmallerLeft', 'eyeSmallerRight', 0.5));
  add(symmetricPair(spec.face.eyesSpacing, 'eyeOutwardLeft', 'eyeOutwardRight', 'eyeInwardLeft', 'eyeInwardRight', 0.48));
  add(symmetricPair(spec.face.eyesHeight, 'eyeHigherLeft', 'eyeHigherRight', 'eyeLowerLeft', 'eyeLowerRight', 0.42));
  add(pair(spec.face.mouthWidth, 'mouthWider', 'mouthNarrower', 0.52));

  const lips = signed(spec.face.lipFullness) * 0.56;
  if (lips >= 0) {
    morphs.mouthUpperLipFuller = lips;
    morphs.mouthLowerLipFuller = lips;
  } else {
    morphs.mouthUpperLipThinner = -lips;
    morphs.mouthLowerLipThinner = -lips;
  }

  return morphs;
}

export function garmentFitScale(category, spec) {
  const bust = spec.measurements.bust / 94;
  const waist = spec.measurements.waist / 76;
  const hips = spec.measurements.hips / 104;
  const height = spec.heightCm / 168;
  const table = {
    TOP: [Math.max(bust, 0.92 + spec.body.shoulders * 0.16), height, bust],
    PANTS: [hips, height, Math.max(waist, hips)],
    DRESS: [Math.max(bust, hips), height, Math.max(bust, hips)],
    FOOTWEAR: [1, Math.sqrt(height), 1],
    BAG: [1, 1, 1],
    ACCESSORY: [1, 1, 1],
  };
  return (table[category] || [1, 1, 1]).map((value) => Math.min(1.24, Math.max(0.82, value)));
}

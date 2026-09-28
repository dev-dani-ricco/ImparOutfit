export const FACE_SHAPES = [
  { id: 'oval', label: 'Oval', headWidth: 0, jaw: 0, chin: 0.02, faceDepth: 0 },
  { id: 'round', label: 'Redondo', headWidth: 0.1, jaw: 0.08, chin: -0.03, faceDepth: 0.03 },
  { id: 'heart', label: 'Coração', headWidth: 0.08, jaw: -0.12, chin: 0.06, faceDepth: 0 },
  { id: 'square', label: 'Quadrado', headWidth: 0.06, jaw: 0.16, chin: 0.01, faceDepth: 0.01 },
  { id: 'long', label: 'Alongado', headWidth: -0.06, jaw: -0.02, chin: 0.08, faceDepth: 0.02 },
];

export const SKIN_TONES = [
  { id: 'porcelain', label: 'Muito clara', color: '#F1C9B5' },
  { id: 'light', label: 'Clara', color: '#E4B49C' },
  { id: 'medium', label: 'Média', color: '#C68E6D' },
  { id: 'tan', label: 'Morena', color: '#A96F52' },
  { id: 'deep', label: 'Escura', color: '#744633' },
  { id: 'rich', label: 'Muito escura', color: '#4C2D24' },
];

export const HAIR_STYLES = [
  { id: 'short', label: 'Curto' },
  { id: 'bob', label: 'Bob' },
  { id: 'long', label: 'Longo' },
  { id: 'waves', label: 'Ondulado' },
  { id: 'curls', label: 'Cacheado' },
  { id: 'bun', label: 'Coque' },
  { id: 'ponytail', label: 'Rabo de cavalo' },
];

export const HAIR_COLORS = [
  { id: 'black', label: 'Preto', color: '#171313' },
  { id: 'dark-brown', label: 'Castanho escuro', color: '#35251F' },
  { id: 'brown', label: 'Castanho', color: '#60402D' },
  { id: 'auburn', label: 'Ruivo', color: '#8B3E25' },
  { id: 'blonde', label: 'Loiro', color: '#C8A66D' },
  { id: 'platinum', label: 'Platinado', color: '#D8D0C4' },
];

export const BODY_PRESETS = [
  { id: 'balanced', label: 'Equilibrado', shoulders: 0, torso: 0, thighs: 0 },
  { id: 'soft', label: 'Curvas suaves', shoulders: -0.03, torso: 0.08, thighs: 0.1 },
  { id: 'athletic', label: 'Atlético', shoulders: 0.12, torso: -0.04, thighs: 0.08 },
  { id: 'petite', label: 'Petite', shoulders: -0.08, torso: -0.08, thighs: -0.05 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

export function getAvatarParameters(profile = {}) {
  const facePreset = FACE_SHAPES.find((item) => item.id === profile.faceShape) || FACE_SHAPES[0];
  const bodyPreset = BODY_PRESETS.find((item) => item.id === profile.bodyPreset) || BODY_PRESETS[0];
  const skin = SKIN_TONES.find((item) => item.id === profile.skinTone) || SKIN_TONES[2];
  const hair = HAIR_COLORS.find((item) => item.id === profile.hairColor) || HAIR_COLORS[1];

  return {
    provider: profile.avatarProvider || 'PARAMETRIC_LOCAL_V2',
    version: profile.avatarVersion || '2.0.0',
    body: {
      bust: clamp((Number(profile.bust || 94) - 94) / 38, -0.55, 1),
      waist: clamp((Number(profile.waist || 76) - 76) / 38, -0.55, 1),
      hips: clamp((Number(profile.hips || 104) - 104) / 42, -0.55, 1),
      height: clamp((Number(profile.height || 168) - 168) / 32, -0.55, 0.75),
      shoulders: clamp((Number(profile.shoulders || 0) / 100) + bodyPreset.shoulders, -0.45, 0.55),
      torso: clamp((Number(profile.torso || 0) / 100) + bodyPreset.torso, -0.4, 0.45),
      thighs: clamp((Number(profile.thighs || 0) / 100) + bodyPreset.thighs, -0.4, 0.5),
    },
    face: {
      headWidth: clamp((Number(profile.headWidth || 0) / 100) + facePreset.headWidth, -0.35, 0.4),
      jaw: clamp((Number(profile.jaw || 0) / 100) + facePreset.jaw, -0.35, 0.4),
      chin: clamp((Number(profile.chin || 0) / 100) + facePreset.chin, -0.3, 0.35),
      faceDepth: clamp((Number(profile.faceDepth || 0) / 100) + facePreset.faceDepth, -0.25, 0.3),
    },
    appearance: {
      skinTone: skin.color,
      hairColor: hair.color,
      hairStyle: profile.hairStyleId || 'bun',
    },
  };
}

export function withProfessionalAvatarDefaults(profile = {}) {
  return {
    ...profile,
    avatarProvider: profile.avatarProvider || 'MAKEHUMAN_CC0',
    avatarVersion: profile.avatarVersion || '3.0.0',
    faceShape: profile.faceShape || 'oval',
    bodyPreset: profile.bodyPreset || 'balanced',
    skinTone: profile.skinTone || 'medium',
    hairStyleId: profile.hairStyleId || 'bun',
    hairColor: profile.hairColor || 'dark-brown',
    shoulders: String(profile.shoulders ?? 0),
    torso: String(profile.torso ?? 0),
    thighs: String(profile.thighs ?? 0),
    headWidth: String(profile.headWidth ?? 0),
    jaw: String(profile.jaw ?? 0),
    chin: String(profile.chin ?? 0),
    faceDepth: String(profile.faceDepth ?? 0),
  };
}

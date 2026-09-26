export const AVATAR_PROVIDERS = {
  PARAMETRIC: 'PARAMETRIC',
  AVATURN: 'AVATURN',
};

export function realisticAvatarFromExport(data = {}) {
  const url = data.url || data.avatarUrl || data.modelUrl || null;
  if (!url) throw new Error('O provedor não retornou um modelo 3D utilizável.');
  return {
    provider: AVATAR_PROVIDERS.AVATURN,
    url,
    urlType: data.urlType || null,
    avatarId: data.avatarId || null,
    sessionId: data.sessionId || null,
    bodyId: data.bodyId || null,
    gender: data.gender || null,
    supportsFaceAnimations: Boolean(data.avatarSupportsFaceAnimations),
    exportedAt: new Date().toISOString(),
    version: 1,
  };
}

export function avatarEngine(profile = {}) {
  return profile.realisticAvatar?.url ? AVATAR_PROVIDERS.AVATURN : AVATAR_PROVIDERS.PARAMETRIC;
}

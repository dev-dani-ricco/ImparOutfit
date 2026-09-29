export default ({config})=>({
  ...config,
  extra:{
    ...config.extra,
    demoMode:process.env.EXPO_PUBLIC_DEMO_MODE==='true',
    demoAutoResume:process.env.EXPO_PUBLIC_DEMO_AUTO_RESUME==='true',
    realisticAvatarEnabled:process.env.EXPO_PUBLIC_REALISTIC_AVATAR_ENABLED==='true',
    avaturnProjectUrl:process.env.EXPO_PUBLIC_AVATURN_PROJECT_URL||config.extra?.avaturnProjectUrl||'',
    apiUrl:process.env.EXPO_PUBLIC_API_URL||config.extra?.apiUrl||'http://localhost:4000/api'
  }
});

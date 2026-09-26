export default ({config})=>({
  ...config,
  extra:{
    ...config.extra,
    demoMode:process.env.EXPO_PUBLIC_DEMO_MODE==='true',
    demoAutoResume:process.env.EXPO_PUBLIC_DEMO_AUTO_RESUME==='true',
    apiUrl:process.env.EXPO_PUBLIC_API_URL||config.extra?.apiUrl||'http://localhost:4000/api'
  }
});

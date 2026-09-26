export default ({config})=>({
  ...config,
  extra:{
    ...config.extra,
    demoMode:process.env.EXPO_PUBLIC_DEMO_MODE==='true',
    apiUrl:process.env.EXPO_PUBLIC_API_URL||config.extra?.apiUrl||'http://localhost:4000/api'
  }
});

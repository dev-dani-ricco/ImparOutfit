import 'dotenv/config';

const controller=new AbortController();
const timer=setTimeout(()=>controller.abort(),20000);
try{
  const res=await fetch(process.env.OMNIROUTE_BASE_URL+'/v1/chat/completions',{
    method:'POST',
    headers:{
      Authorization:'Bearer '+process.env.OMNIROUTE_API_KEY,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      model:process.env.IMPAR_ANALYSIS_MODEL,
      messages:[
        {role:'system',content:'Return one JSON object only.'},
        {role:'user',content:'Return a JSON object with status equal to ok.'}
      ],
      max_tokens:500,
      temperature:0,
      stream:false
    }),
    signal:controller.signal
  });
  const body=await res.json().catch(()=>null);
  console.log('STATUS='+res.status);
  console.log('MODEL='+(body?.model||''));
  console.log('HAS_CONTENT='+Boolean(body?.choices?.[0]?.message?.content));
  console.log('FINISH='+(body?.choices?.[0]?.finish_reason||''));
}catch(error){
  console.log('PROBE_ERROR='+(error?.name||'ERROR'));
}finally{
  clearTimeout(timer);
}

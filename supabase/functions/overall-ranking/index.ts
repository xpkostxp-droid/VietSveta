import {createClient} from 'npm:@supabase/supabase-js@2.95.0';
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'Access-Control-Allow-Origin':'https://xpkostxp-droid.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({error:'method'},405);
 try{
  const text=await req.text();if(text.length>2000)return reply({error:'size'},413);
  const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');if(!token)return reply({error:'Войди в приложение'},401);
  const {data:{user},error}=await admin.auth.getUser(token);if(error||!user)return reply({error:'Войди снова'},401);
  const {data:profile,error:profileError}=await admin.from('participants').select('id').eq('user_id',user.id).eq('active',true).single();
  if(profileError||!profile)return reply({error:'Нет доступа к рейтингу'},403);
  const body=JSON.parse(text);if(body.action!=='overall-ranking')return reply({error:'action'},400);
  const {data,error:statsError}=await admin.rpc('get_overall_medal_ranking');if(statsError)throw statsError;
  return reply({...data,viewer_id:profile.id});
 }catch{return reply({error:'Не удалось загрузить рейтинг. Попробуй ещё раз.'},500);}
});

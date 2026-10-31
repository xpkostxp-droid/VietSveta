import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const cors = {'Access-Control-Allow-Origin':'https://xpkostxp-droid.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({error:'method'},405);
 try {
  if(Number(req.headers.get('content-length')??0)>12000)return reply({error:'size'},413);
  const text=await req.text();if(text.length>12000)return reply({error:'size'},413);
  const body=JSON.parse(text);
  if(body.action==='roster'){
   const {data,error}=await admin.from('participants').select('id,display_name,is_admin').eq('active',true).order('created_at');
   if(error)throw error;return reply({participants:data});
  }
  if(body.action==='login'){
   if(typeof body.id!=='string'||typeof body.pin!=='string'||!/^\d{4}$/.test(body.pin))return reply({error:'Нужен четырёхзначный код'},400);
   const {data:c,error}=await admin.rpc('verify_member_pin',{p_id:body.id,p_pin:body.pin});
   if(error)throw error;
   if(c.error)return reply({error:c.error==='locked'?'Слишком много попыток. Подожди 15 минут.':'Неверное имя или код'},c.error==='locked'?429:401);
   const auth = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data,error:authError}=await auth.auth.signInWithPassword({email:c.email,password:c.password});
   if(authError||!data.session)return reply({error:'Не удалось войти. Попробуй позже.'},503);
   const {data:profile}=await admin.from('participants').select('id,display_name,is_admin,user_id,course_group,ranking_since').eq('user_id',data.user.id).eq('active',true).single();
   if(!profile)return reply({error:'Нет доступа'},403);
   return reply({session:{access_token:data.session.access_token,refresh_token:data.session.refresh_token},profile});
  }
  const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');
  if(!token)return reply({error:'Войди в приложение'},401);
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return reply({error:'Войди снова'},401);
  const {data:profile}=await admin.from('participants').select('id,display_name,is_admin,user_id,course_group,ranking_since').eq('user_id',user.id).eq('active',true).single();
  if(!profile)return reply({error:'Учётная запись отключена'},403);
  if(body.action==='profile')return reply({profile});
  if(body.action==='leaderboard'){
   if(!['questions-15','questions-24','harvest-40','harvest-fruits','harvest-vegetables','adjectives-tetris','adjectives-rope','adjectives-cannon','lesson5-professions','lesson5-work','lesson7-countries','lesson7-travel','lesson8-people','lesson9-phone'].includes(body.game))return reply({error:'game'},400);
   const {data:players,error:playersError}=await admin.from('participants').select('id,display_name,user_id,ranking_since').eq('active',true).eq('is_admin',false);
   if(playersError)throw playersError;
   const rows=await Promise.all((players??[]).map(async p=>{
    let query=admin.from('game_attempts').select('correct,correct_time_ms').eq('game',body.game).eq('user_id',p.user_id).gte('created_at',p.ranking_since??'1970-01-01T00:00:00Z');
    if(body.game==='harvest-fruits'||body.game==='harvest-vegetables'){
     const expected=body.game==='harvest-fruits'?[22,40]:[18,32];
     if(body.total!==undefined&&!expected.includes(body.total))throw new Error('total');
     query=query.eq('total',body.total??expected[0]);
    }
    const {data,error}=await query.order('correct',{ascending:false}).order('correct_time_ms').limit(1);
    if(error)throw error;
    return {id:p.id,name:p.display_name,best:data?.[0]??null};
   }));
   rows.sort((a,b)=>!a.best?(b.best?1:0):!b.best?-1:b.best.correct-a.best.correct||a.best.correct_time_ms-b.best.correct_time_ms);
   return reply({rows});
  }
  if(!profile.is_admin)return reply({error:'Только для администратора'},403);
  if(body.action==='admin-overview'){
   const {data:participants,error}=await admin.from('participants').select('id,display_name,user_id,is_admin,active');if(error)throw error;
   const {data:states}=await admin.from('learning_state').select('user_id,data,updated_at');
   const {data:attempts}=await admin.from('game_attempts').select('*').order('created_at',{ascending:false}).limit(300);
   return reply({participants,states,attempts});
  }
  if(body.action==='reset-pin'){
   if(typeof body.id!=='string'||typeof body.pin!=='string'||!/^\d{4}$/.test(body.pin))return reply({error:'Нужен код из четырёх цифр'},400);
   const {error}=await admin.rpc('reset_member_pin',{p_id:body.id,p_pin:body.pin});if(error)throw error;
   return reply({ok:true});
  }
  return reply({error:'action'},400);
 }catch{return reply({error:'Сервис временно недоступен. Попробуй ещё раз.'},500);}
});

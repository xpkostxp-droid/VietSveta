export type BattleRecord={id:string;played_at:string;host_id:string;guest_id:string;host_name:string;guest_name:string;score_host:number;score_guest:number;topic:string};
export type BattleStats={viewer_id:string;matches:BattleRecord[]};
export function battleRanking(matches:BattleRecord[]){
 const players=new Map<string,{id:string;name:string;played:number;wins:number;losses:number}>();
 for(const m of matches){
  if(m.host_id==='admin'||m.guest_id==='admin'||m.host_id===m.guest_id||m.score_host===m.score_guest)continue;
  for(const [id,name,won] of [[m.host_id,m.host_name,m.score_host>m.score_guest],[m.guest_id,m.guest_name,m.score_guest>m.score_host]] as const){
   const row=players.get(id)??{id,name,played:0,wins:0,losses:0};
   row.played++;if(won)row.wins++;else row.losses++;players.set(id,row);
  }
 }
 const rows=[...players.values()].sort((a,b)=>b.wins-a.wins||a.losses-b.losses||a.id.localeCompare(b.id));
 let place=0;
 return rows.map((row,i)=>{const prev=rows[i-1];if(!prev||prev.wins!==row.wins||prev.losses!==row.losses)place=i+1;return {...row,place};});
}
export function battleOpponents(matches:BattleRecord[],id:string){
 const rows=new Map<string,{id:string;name:string;played:number;wins:number;losses:number;last:string;score:string}>();
 for(const m of [...matches].sort((a,b)=>b.played_at.localeCompare(a.played_at)||b.id.localeCompare(a.id))){
  if(m.host_id==='admin'||m.guest_id==='admin'||m.host_id!==id&&m.guest_id!==id||m.score_host===m.score_guest)continue;
  const host=m.host_id===id,opponent=host?m.guest_id:m.host_id,own=host?m.score_host:m.score_guest,other=host?m.score_guest:m.score_host;
  const row=rows.get(opponent)??{id:opponent,name:host?m.guest_name:m.host_name,played:0,wins:0,losses:0,last:m.played_at,score:`${own}:${other}`};
  row.played++;if(own>other)row.wins++;else row.losses++;rows.set(opponent,row);
 }
 return [...rows.values()];
}

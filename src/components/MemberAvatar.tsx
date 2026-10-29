const avatars: Record<string,string> = { 'sergey-k': `${import.meta.env.BASE_URL}avatars/sergey-k.webp` };
export function MemberAvatar({id,name,size=32,className=''}:{id?:string;name:string;size?:number;className?:string}) {
 const src=id?avatars[id]:undefined;
 return <span className={`member-avatar ${className}`} aria-hidden="true" style={{width:size,height:size,flexBasis:size}}>
  {src?<img src={src} alt="" width={size} height={size}/>:name.trim().charAt(0)}
 </span>;
}

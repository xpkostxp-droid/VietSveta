export const adjectiveSets = [
 {title:'Размер, предметы и сравнение',words:[
 ['to','большой'],['nhỏ','маленький'],['cao','высокий'],['thấp','низкий'],['dài','длинный'],['ngắn','короткий'],['dày','толстый — о предмете'],['mỏng','тонкий'],['rộng','просторный'],['chật','тесный'],['cứng','твёрдый'],['mềm','мягкий'],['mới','новый'],['cũ','старый — о предмете'],['đắt','дорогой'],['rẻ','дешёвый'],['bằng nhau','равные'],['giống nhau','похожие']]},
 {title:'Люди, качества и оценки',words:[
 ['béo','толстый — о человеке'],['gầy','худой'],['lớn','взрослый'],['trẻ','молодой'],['già','старый — о человеке'],['yếu','слабый'],['khỏe','здоровый / сильный'],['giàu','богатый'],['nghèo','бедный'],['đẹp','красивый'],['xấu','некрасивый'],['nổi tiếng','известный'],['hay','интересный / хороший'],['tốt','хороший'],['ổn','нормальный'],['cởi chuồng','голый / без одежды'],['miễn phí','бесплатный'],['đầy đủ','полный / в полном объёме']]},
 {title:'Вкусы, ощущения и погода',words:[
 ['ngon','вкусный'],['ngọt','сладкий'],['chua','кислый'],['đắng','горький'],['mặn','солёный'],['cay','острый'],['nhạt','пресный'],['chát','терпкий / вяжущий'],['bùi','с ореховым, крахмалистым вкусом'],['nhiều nước','сочный'],['chín','спелый'],['nóng','горячий'],['lạnh','холодный'],['mát','прохладный'],['khô','сухой'],['ẩm','влажный'],['nắng','солнечный']]}
] as const;
export const shuffleItems=<T,>(items:readonly T[]):T[]=>{
 const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
};
export function adjectiveTasks(count:number){
 const a=shuffleItems(Array.from({length:count},(_,i)=>i));
 const b=shuffleItems(a);return a.flatMap((word,i)=>[{word,reverse:false},{word:b[i],reverse:true}]);
}
export interface WordBlock {correct:boolean;label:string}
export function landWordBlock(board:WordBlock[],block:WordBlock){
 const next=[...board,block];
 const clear=next.length%5===0&&next.slice(-5).every(b=>b.correct);
 return {board:clear?next.slice(0,-5):next.slice(-30),clear};
}

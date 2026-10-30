export const phoneDigitWords = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
export function phoneNumbers(): string[] {
  const prefixes = ['084', '091', '093', '098', '032', '035', '056', '070', '079'];
  return ['0867217623', ...prefixes.map(prefix => prefix + Array.from({length:7},()=>Math.floor(Math.random()*10)).join(''))];
}

export function phoneBlitzNumbers(): string[] {
 const make = () => '0' + String(3 + Math.floor(Math.random()*7)) + Array.from({length:8},()=>Math.floor(Math.random()*10)).join('');
 const first=make();let second=make();
 if(second===first)second=second.slice(0,9)+String((Number(second[9])+1)%10);
 return [first,second];
}

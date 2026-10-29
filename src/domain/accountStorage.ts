export interface CloudEntry { value: unknown; modified: number }
export type AccountEntries = Record<string, CloudEntry>;
let owner: string | null = null;
export function setStorageOwner(id: string | null) { owner = id; }
export function storageOwner() { return owner; }
function key(id: string) { return `vietSveta.account.${id}.v1`; }
export function accountEntries(id = owner): AccountEntries {
 if (!id) return {};
 try { const data=JSON.parse(localStorage.getItem(key(id))??'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}; } catch { return {}; }
}
export function mergeEntries(local: AccountEntries, remote: AccountEntries): AccountEntries {
 const result={...local};
 for(const [k,v] of Object.entries(remote))if(v&&typeof v.modified==='number'&&'value' in v&&(!result[k]||v.modified>result[k].modified))result[k]=v;
 return result;
}
export function applyAccountEntries(id:string, remote:AccountEntries) {
 const merged=mergeEntries(accountEntries(id),remote);
 localStorage.setItem(key(id),JSON.stringify(merged));return merged;
}
export function accountRead(name:string):unknown {return owner?accountEntries()[name]?.value:undefined;}
export function accountWrite(name:string,value:unknown) {
 if(!owner)return;
 const entries=accountEntries();entries[name]={value,modified:Math.max(Date.now(),(entries[name]?.modified??0)+1)};
 localStorage.setItem(key(owner),JSON.stringify(entries));
 window.dispatchEvent(new CustomEvent('vietsveta-progress',{detail:owner}));
}

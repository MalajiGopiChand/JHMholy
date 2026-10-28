export const classes=[{id:'beginner',name:'Beginner'},{id:'primary',name:'Primary'},{id:'secondary',name:'Secondary'}];
export function normalizePhone(value){const digits=String(value||'').replace(/[\s()+-]/g,'');const n=digits.length===10?'91'+digits:digits;if(!/^91[6-9]\d{9}$/.test(n))throw new Error('Enter a valid Indian mobile number, including +91 if needed.');return '+'+n;}
export const phoneAlias=value=>'t_'+normalizePhone(value).slice(1)+'@teachers.holy.invalid';
export function localDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function recentSunday(now=new Date()){const date=new Date(localDate(now)+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-date.getUTCDay());return date.toISOString().slice(0,10);}
export function isSunday(date=localDate()){return /^\d{4}-\d{2}-\d{2}$/.test(date)&&new Date(date+'T00:00:00Z').getUTCDay()===0;}
export function validBirthDate(date,today=localDate()){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today||date<'1900-01-01')return false;const d=new Date(date+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===date;}
export function permittedDate(date,today,special=false){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===date&&date<=today&&(d.getUTCDay()===0||special);}
export function percentage(p,a){return p+a?Math.round(p/(p+a)*100)+'%':'—';}
export function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function csv(rows){return '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');}

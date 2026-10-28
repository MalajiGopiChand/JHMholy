export function normalizePhone(value){const d=String(value||'').replace(/[\s()+-]/g,'');const n=d.length===10?'91'+d:d;if(!/^91[6-9]\d{9}$/.test(n))throw new Error('Enter a valid Indian mobile number.');return '+'+n;}
export const phoneAlias=v=>'t_'+normalizePhone(v).slice(1)+'@teachers.holy.invalid';
export function localDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function permittedDate(date,today,special=false){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===date&&date<=today&&(d.getUTCDay()===0||special);}
export function isSunday(date=localDate()){return /^\d{4}-\d{2}-\d{2}$/.test(date)&&new Date(date+'T00:00:00Z').getUTCDay()===0;}
export function validBirthDate(date,today=localDate()){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today||date<'1900-01-01')return false;const d=new Date(date+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===date;}
export function attendancePolicy(date,today,admin=false,correction=false){return permittedDate(date,today)&&(correction?admin:(isSunday(today)&&(admin||date===today)));}

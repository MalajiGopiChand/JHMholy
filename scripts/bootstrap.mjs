import {createRequire} from 'node:module';
const require=createRequire(new URL('../functions/package.json',import.meta.url));
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore}=require('firebase-admin/firestore');
const emulator=!!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const projectId=process.env.GCLOUD_PROJECT||(emulator?'demo-holy-ministries':'jhmholy');
if(emulator&&projectId!=='demo-holy-ministries')throw new Error('Emulator bootstrap must target demo-holy-ministries.');
initializeApp(emulator?{projectId}:{projectId,credential:applicationDefault()});
const email=process.env.ADMIN_EMAIL||'holy@gmail.com',password=process.env.ADMIN_INITIAL_PASSWORD||'holy@123';
if(!email||!password||password.length<8)throw new Error('Set server-only ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD (at least 8 characters).');
const auth=getAuth(),db=getFirestore();let user;
try{
  user=await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid,{admin:true});
  await db.doc('admins/'+user.uid).set({fullName:'Holy Admin',email,role:'ADMIN',active:true,bootstrapSource:'holy-ministries-v1',updatedAt:new Date().toISOString()},{merge:true});
  console.log('Administrator already existed. Admin claims and admin profile verified successfully.');
}catch(e){
  if(e.code!=='auth/user-not-found')throw e;
  user=await auth.createUser({email,password,displayName:'Holy Admin'});
  try{
    await auth.setCustomUserClaims(user.uid,{admin:true});
    await db.doc('admins/'+user.uid).set({fullName:'Holy Admin',email,role:'ADMIN',active:true,bootstrapSource:'holy-ministries-v1',createdAt:new Date().toISOString()});
  }catch(err){
    await auth.deleteUser(user.uid);
    throw err;
  }
  console.log('Administrator created successfully with email: ' + email);
}
console.log('Administrator ready: ' + email);

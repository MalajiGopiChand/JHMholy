import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc} from 'firebase/firestore';
const env=await initializeTestEnvironment({projectId:'demo-holy-ministries',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}});
try{
  await env.withSecurityRulesDisabled(async c=>{
    const db=c.firestore();
    await setDoc(doc(db,'teachers/pending'),{approvalStatus:'pending'});
    await setDoc(doc(db,'teachers/approved'),{approvalStatus:'approved',allowedPlaceIds:['gannavaram']});
    await setDoc(doc(db,'sync/changes'),{at:1});
    await setDoc(doc(db,'students/child'),{name:'Test only',placeId:'gannavaram'});
    await setDoc(doc(db,'finance/entry'),{amountPaise:1000});
  });
  const pending=env.authenticatedContext('pending').firestore(),
        approved=env.authenticatedContext('approved').firestore(),
        anon=env.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(pending,'teachers/pending')));
  await assertFails(getDoc(doc(pending,'teachers/approved')));
  await assertFails(getDoc(doc(pending,'students/child')));
  await assertFails(setDoc(doc(pending,'teachers/pending'),{approvalStatus:'approved'}));
  await assertFails(getDoc(doc(anon,'students/child')));
  await assertSucceeds(getDoc(doc(approved,'sync/changes')));
  await assertFails(getDoc(doc(approved,'finance/entry')));

  await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'admins/rules-admin'),{active:true}));
  const administrator=env.authenticatedContext('rules-admin',{admin:true}).firestore();
  const holyAdmin=env.authenticatedContext('holy-admin-uid',{email:'holy@gmail.com'}).firestore();

  await assertSucceeds(getDoc(doc(administrator,'students/child')));
  await assertSucceeds(getDoc(doc(administrator,'finance/entry')));
  await assertSucceeds(getDoc(doc(holyAdmin,'students/child')));
  await assertSucceeds(getDoc(doc(holyAdmin,'finance/entry')));

  for(const context of [anon,pending]) {
    await assertFails(getDoc(doc(context,'students/child')));
    await assertFails(getDoc(doc(context,'finance/entry')));
  }

  await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'teachers/approved'),{approvalStatus:'disabled'}));
  await assertFails(getDoc(doc(approved,'students/child')));
  console.log('Firestore rule checks passed, including holy@gmail.com admin and revocation without token refresh.');
}finally{await env.cleanup();}

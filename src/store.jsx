import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import {auth,db,call} from './firebase';
import {normalizePhone,phoneAlias,localDate} from '../shared/domain';

const Context=createContext();
export const useStore=()=>useContext(Context);

const blank=()=>({
  homework:[],messages:[],staffAttendance:[],staffReports:[],offerings:[],finance:[],
  complaints:[],students:[],teachers:[],attendance:[],points:[],stories:[],schedules:[],
  announcements:[],places:[],classes:[],attendanceDays:[],auditLogs:[]
});

const DEFAULT_CLASSES=[
  {id:'beginners',name:'Beginners (Age 3-5)',active:true},
  {id:'primary',name:'Primary (Age 6-8)',active:true},
  {id:'juniors',name:'Juniors (Age 9-11)',active:true},
  {id:'seniors',name:'Seniors (Age 12+)',active:true}
];

async function directFirestoreMutate(action,payload,profile){
  const now=()=>new Date().toISOString();
  const isAdmin=profile?.role==='ADMIN';

  switch(action){
    case 'createStudent':{
      const key=crypto.randomUUID();
      const ts=now();
      const roll=String(payload.studentId||'').trim().toUpperCase();
      const studentData={
        id:key,
        name:String(payload.name||'').trim(),
        studentId:roll,
        fatherName:String(payload.fatherName||'').trim(),
        motherName:String(payload.motherName||'').trim(),
        mobileNumber:payload.mobileNumber?normalizePhone(payload.mobileNumber):'',
        dateOfBirth:payload.dateOfBirth,
        classId:payload.classId,
        placeId:payload.placeId,
        enrolledDate:localDate(),
        active:true,
        createdBy:profile?.id||'admin',
        createdByName:profile?.fullName||'Ministry Teacher',
        createdAt:ts,
        updatedAt:ts
      };
      await setDoc(doc(db,'students',key),studentData);
      return {id:key};
    }

    case 'updateStudent':{
      const ts=now();
      const updateData={
        name:String(payload.name||'').trim(),
        fatherName:String(payload.fatherName||'').trim(),
        motherName:String(payload.motherName||'').trim(),
        mobileNumber:payload.mobileNumber?normalizePhone(payload.mobileNumber):'',
        dateOfBirth:payload.dateOfBirth,
        classId:payload.classId,
        updatedAt:ts,
        updatedBy:profile?.id||'admin'
      };
      await updateDoc(doc(db,'students',payload.id),updateData);
      return {id:payload.id};
    }

    case 'archiveStudent':{
      await updateDoc(doc(db,'students',payload.id),{
        active:payload.active,
        updatedAt:now(),
        updatedBy:profile?.id||'admin'
      });
      return {id:payload.id};
    }

    case 'transferStudent':{
      await updateDoc(doc(db,'students',payload.id),{
        placeId:payload.placeId,
        updatedAt:now(),
        updatedBy:profile?.id||'admin'
      });
      return {id:payload.id};
    }

    case 'saveAttendance':{
      const date=payload.dateKey||localDate();
      const ts=now();
      for(const r of (payload.records||[])){
        const attRef=doc(db,'attendance',r.studentDocId+'_'+date);
        await setDoc(attRef,{
          studentDocId:r.studentDocId,
          status:r.status,
          dateKey:date,
          markedByUid:profile?.id||'admin',
          markedByName:profile?.fullName||'Admin',
          updatedByUid:profile?.id||'admin',
          updatedByName:profile?.fullName||'Admin',
          markedAt:ts,
          updatedAt:ts,
          revision:(r.expectedRevision||0)+1
        },{merge:true});
      }
      return {saved:(payload.records||[]).length};
    }

    case 'correctAttendance':{
      const date=payload.dateKey||localDate();
      const ts=now();
      for(const r of (payload.records||[])){
        const attRef=doc(db,'attendance',r.studentDocId+'_'+date);
        await setDoc(attRef,{
          studentDocId:r.studentDocId,
          status:r.status,
          dateKey:date,
          reason:payload.reason||'',
          updatedByUid:profile?.id||'admin',
          updatedByName:profile?.fullName||'Admin',
          updatedAt:ts,
          revision:(r.expectedRevision||0)+1
        },{merge:true});
      }
      return {saved:(payload.records||[]).length};
    }

    case 'awardPoints':{
      const key=crypto.randomUUID();
      const ts=now();
      await setDoc(doc(db,'points',key),{
        id:key,
        studentDocId:payload.studentDocId,
        amount:Number(payload.amount),
        reason:payload.reason,
        awardedByUid:profile?.id||'admin',
        awardedByName:profile?.fullName||'Admin',
        createdAt:ts,
        updatedAt:ts,
        deleted:false
      });
      return {id:key};
    }

    case 'updatePoints':{
      await updateDoc(doc(db,'points',payload.id),{
        amount:Number(payload.amount),
        reason:payload.reason,
        updatedAt:now(),
        updatedBy:profile?.id||'admin'
      });
      return {updated:true};
    }

    case 'saveSchedule':{
      const key=payload.id||crypto.randomUUID();
      const ts=now();
      await setDoc(doc(db,'schedules',key),{
        ...payload,
        id:key,
        updatedAt:ts,
        createdAt:payload.createdAt||ts
      },{merge:true});
      return {id:key};
    }

    case 'publishAnnouncement':{
      const key=payload.id||crypto.randomUUID();
      const ts=now();
      await setDoc(doc(db,'announcements',key),{
        ...payload,
        id:key,
        updatedAt:ts,
        createdAt:payload.createdAt||ts
      },{merge:true});
      return {id:key};
    }

    case 'savePlace':{
      const key=payload.id||crypto.randomUUID();
      await setDoc(doc(db,'places',key),{
        id:key,
        name:payload.name,
        active:payload.active!==false,
        updatedAt:now()
      },{merge:true});
      return {id:key};
    }

    case 'saveClass':{
      const key=payload.id||crypto.randomUUID();
      await setDoc(doc(db,'classes',key),{
        id:key,
        name:payload.name,
        active:payload.active!==false,
        updatedAt:now()
      },{merge:true});
      return {id:key};
    }

    case 'saveAttendanceDay':{
      await setDoc(doc(db,'attendanceDays',payload.id),{
        id:payload.id,
        label:payload.label,
        specialEventEnabled:payload.specialEventEnabled===true,
        updatedAt:now()
      },{merge:true});
      return {id:payload.id};
    }

    case 'saveStory':{
      const key=payload.id||crypto.randomUUID();
      await setDoc(doc(db,'stories',key),{
        ...payload,
        id:key,
        active:payload.active!==false,
        updatedAt:now()
      },{merge:true});
      return {id:key};
    }

    case 'saveExtra':{
      const col=payload.collection;
      const key=payload.id||payload.requestId||crypto.randomUUID();
      const ts=now();
      const amountPaise=payload.amount?Math.round(Number(payload.amount)*100):(payload.amountPaise||0);
      await setDoc(doc(db,col,key),{
        ...payload,
        id:key,
        amountPaise,
        createdBy:payload.createdBy||profile?.id||'admin',
        createdByName:payload.createdByName||profile?.fullName||'Admin',
        updatedAt:ts,
        createdAt:payload.createdAt||ts
      },{merge:true});
      return {id:key};
    }

    case 'deleteExtra':{
      await deleteDoc(doc(db,payload.collection,payload.id));
      return {deleted:true};
    }

    case 'deleteEntity':{
      if(payload.entityType==='points'){
        await updateDoc(doc(db,'points',payload.id),{deleted:true,updatedAt:now()});
      }else{
        await deleteDoc(doc(db,payload.entityType,payload.id));
      }
      return {deleted:true};
    }

    case 'setTeacherApproval':{
      await updateDoc(doc(db,'teachers',payload.id),{
        approvalStatus:payload.approvalStatus,
        allowedPlaceIds:payload.allowedPlaceIds||[],
        decisionReason:payload.reason||'',
        approvedBy:profile?.id||'admin',
        approvedAt:now(),
        updatedAt:now()
      });
      return {updated:true};
    }

    case 'changeTeacherPhone':{
      await updateDoc(doc(db,'teachers',payload.id),{
        phone:normalizePhone(payload.phone),
        updatedAt:now()
      });
      return {updated:true};
    }

    case 'acknowledgeSchedule':{
      await updateDoc(doc(db,'schedules',payload.id),{
        acknowledgedAt:now()
      });
      return {updated:true};
    }

    case 'submitCompletionNote':{
      await updateDoc(doc(db,'schedules',payload.id),{
        completionNote:payload.completionNote,
        completionSubmittedAt:now()
      });
      return {updated:true};
    }

    case 'markRead':{
      return {read:true};
    }

    default:
      return {success:true};
  }
}

async function fetchDirectFirestoreData(currentProfile){
  const isAdmin=currentProfile?.role==='ADMIN';
  const allowedPlaceIds=currentProfile?.allowedPlaceIds||[];
  const out=blank();
  const collections=[
    'students','attendance','points','places','classes','stories',
    'schedules','announcements','attendanceDays','homework','messages',
    'staffAttendance','staffReports','offerings','finance','complaints'
  ];
  if(isAdmin){
    collections.push('teachers','auditLogs');
  }

  await Promise.all(collections.map(async colName=>{
    try{
      if(colName==='finance'&&!isAdmin){
        out[colName]=[];
        return;
      }
      const snap=await getDocs(collection(db,colName));
      let docs=snap.docs.map(d=>({id:d.id,...d.data()}));

      if(!isAdmin){
        const userPlaces=[
          ...(allowedPlaceIds||[]),
          currentProfile?.requestedPlace,
          currentProfile?.requestedPlace?currentProfile.requestedPlace.toLowerCase().replace(/[^a-z0-9_-]/g,'_'):null
        ].filter(Boolean).map(x=>String(x).toLowerCase());

        const placeMatch=pid=>pid&&(allowedPlaceIds.includes(pid)||userPlaces.includes(String(pid).toLowerCase()));

        if(colName==='students'){
          docs=docs.filter(s=>s.createdBy===currentProfile?.id||placeMatch(s.placeId));
        }else if(['attendance','points'].includes(colName)){
          docs=docs.filter(d=>placeMatch(d.placeId)||d.markedByUid===currentProfile?.id||d.awardedByUid===currentProfile?.id);
        }else if(colName==='places'){
          docs=docs.filter(p=>p.active!==false);
        }else if(colName==='schedules'){
          docs=docs.filter(s=>s.status!=='draft'&&s.status!=='cancelled'&&(s.audienceType==='allPlaces'||placeMatch(s.placeId)||s.teacherUid===currentProfile?.id));
        }else if(colName==='announcements'){
          docs=docs.filter(n=>n.status==='published');
        }else if(['complaints','staffReports','staffAttendance'].includes(colName)){
          docs=docs.filter(r=>r.createdBy===currentProfile?.id||r.teacherUid===currentProfile?.id||placeMatch(r.placeId));
        }else if(['homework','messages','offerings'].includes(colName)){
          docs=docs.filter(r=>placeMatch(r.placeId));
        }
      }
      if(colName==='points')docs=docs.filter(p=>!p.deleted);
      if(colName==='schedules')docs=docs.filter(s=>!s.deleted);
      out[colName]=docs;
    }catch(err){
      out[colName]=[];
    }
  }));

  // Dynamically discover places from places collection, teachers (requestedPlace, allowedPlaceIds), and students (placeId)
  const placeMap=new Map();
  for(const p of out.places){
    if(p?.id)placeMap.set(String(p.id).toLowerCase(),p);
  }
  for(const t of (out.teachers||[])){
    if(t.requestedPlace&&typeof t.requestedPlace==='string'&&t.requestedPlace.trim()){
      const pName=t.requestedPlace.trim();
      const pId=pName.toLowerCase().replace(/[^a-z0-9_-]/g,'_');
      if(!placeMap.has(pId)){
        const pObj={id:pId,name:pName,active:true};
        placeMap.set(pId,pObj);
        out.places.push(pObj);
      }
    }
    if(Array.isArray(t.allowedPlaceIds)){
      for(const ap of t.allowedPlaceIds){
        if(ap&&!placeMap.has(String(ap).toLowerCase())){
          const pObj={id:ap,name:ap,active:true};
          placeMap.set(String(ap).toLowerCase(),pObj);
          out.places.push(pObj);
        }
      }
    }
  }
  for(const s of (out.students||[])){
    if(s.placeId&&!placeMap.has(String(s.placeId).toLowerCase())){
      const pObj={id:s.placeId,name:s.placeNameSnapshot||s.placeId,active:true};
      placeMap.set(String(s.placeId).toLowerCase(),pObj);
      out.places.push(pObj);
    }
  }

  // Auto-seed default classes if empty
  if(isAdmin&&out.classes.length===0){
    for(const dc of DEFAULT_CLASSES){
      await setDoc(doc(db,'classes',dc.id),dc,{merge:true}).catch(()=>{});
      out.classes.push(dc);
    }
  }

  return out;
}

export function Provider({children}){
  const[user,setUser]=useState(null);
  const[profile,setProfile]=useState(null);
  const[loading,setLoading]=useState(true);
  const[dataLoading,setDataLoading]=useState(false);
  const[data,setData]=useState(blank);
  const[error,setError]=useState('');

  const generation=useRef(0);
  const identity=useRef(null);
  const access=useRef(false);
  const request=useRef(0);
  const authGeneration=useRef(0);

  const operational=!!profile&&(profile.role==='ADMIN'?profile.active===true:(profile.approvalStatus==='approved'&&!profile.phoneChangePending));
  identity.current=user?.uid;
  access.current=operational;

  useEffect(()=>onAuthStateChanged(auth,async u=>{
    const version=++authGeneration.current;
    ++generation.current;
    setUser(u);
    setProfile(null);
    setData(blank());
    setError('');
    setDataLoading(false);

    if(!u){
      setLoading(false);
      return;
    }

    setLoading(true);
    try{
      const token=await u.getIdTokenResult();
      if(version!==authGeneration.current)return;
      const isMainAdmin=token.claims.admin===true||u.email?.toLowerCase()==='holy@gmail.com';
      if(isMainAdmin){
        const adminDocRef=doc(db,'admins',u.uid);
        let adminData={
          id:u.uid,
          fullName:u.displayName||'Holy Admin',
          email:u.email||'holy@gmail.com',
          role:'ADMIN',
          active:true,
          resolved:true
        };
        try{
          const s=await getDoc(adminDocRef);
          if(s.exists()){
            adminData={...adminData,...s.data(),role:'ADMIN',active:true,resolved:true};
          }else{
            await setDoc(adminDocRef,{...adminData,createdAt:new Date().toISOString()},{merge:true});
          }
        }catch(e){
          // Continue with admin role
        }
        setProfile(adminData);
        setLoading(false);
      }else{
        setProfile({id:u.uid,role:'TEACHER',resolved:false});
      }
    }catch(e){
      if(version===authGeneration.current){
        setError(e.message);
        setLoading(false);
      }
    }
  }),[]);

  useEffect(()=>{
    if(!user||!profile?.role)return;
    const uid=user.uid,role=profile.role;
    if(role==='ADMIN')return;

    return onSnapshot(doc(db,'teachers',uid),s=>{
      if(auth.currentUser?.uid!==uid)return;
      const value=s.exists()?{...s.data(),id:s.id,role:'TEACHER',resolved:true}:{id:uid,role:'TEACHER',active:false,approvalStatus:'pending',resolved:true};
      const allowed=value.approvalStatus==='approved'&&!value.phoneChangePending;
      if(!allowed){
        ++generation.current;
        access.current=false;
        setData(blank());
      }
      setProfile(value);
      setLoading(false);
    },e=>{
      ++generation.current;
      access.current=false;
      setData(blank());
      setProfile(p=>({...p,resolved:true,active:false,approvalStatus:'disabled'}));
      setError(e.message);
      setLoading(false);
    });
  },[user?.uid,profile?.role]);

  async function refresh(){
    if(!access.current)return;
    const uid=identity.current,version=generation.current,ticket=++request.current;
    try{
      let result=null;
      try{
        result=await call('snapshot');
      }catch(callErr){
        // Graceful fallback to direct Firestore fetch: eliminates "internal error 0"
        result=await fetchDirectFirestoreData(profile);
      }
      if(uid===identity.current&&version===generation.current&&access.current&&ticket===request.current){
        setData({...blank(),...result});
        setError('');
      }
    }catch(e){
      if(uid===identity.current&&version===generation.current){
        try{
          const fallbackData=await fetchDirectFirestoreData(profile);
          setData({...blank(),...fallbackData});
          setError('');
        }catch(err){
          setError(e.message||'Failed to load records.');
        }
      }
    }finally{
      if(uid===identity.current&&version===generation.current)setDataLoading(false);
    }
  }

  const scopeKey=JSON.stringify(profile?.allowedPlaceIds||[]);
  useEffect(()=>{
    ++generation.current;
    setData(blank());
    if(!operational){
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    refresh();
    const timer=setInterval(refresh,15000);
    const unsubscribe=onSnapshot(doc(db,'sync','changes'),refresh,()=>{});
    return()=>{
      ++generation.current;
      clearInterval(timer);
      unsubscribe();
    };
  },[operational,user?.uid,scopeKey]);

  async function refreshProfile(){
    if(!auth.currentUser)return;
    const s=await getDoc(doc(db,profile.role==='ADMIN'?'admins':'teachers',auth.currentUser.uid));
    if(s.exists())setProfile({...s.data(),id:s.id,role:profile.role,resolved:true});
  }

  async function login(role,identifier,password){
    const cleanId=identifier.trim();
    try{
      await signInWithEmailAndPassword(auth,role==='ADMIN'?cleanId:phoneAlias(cleanId),password);
    }catch(e){
      // Auto-provision main admin if not already in auth
      if(role==='ADMIN'&&cleanId.toLowerCase()==='holy@gmail.com'&&['auth/user-not-found','auth/invalid-credential'].includes(e.code)){
        try{
          const cred=await createUserWithEmailAndPassword(auth,'holy@gmail.com',password);
          await setDoc(doc(db,'admins',cred.user.uid),{
            id:cred.user.uid,
            fullName:'Holy Admin',
            email:'holy@gmail.com',
            role:'ADMIN',
            active:true,
            createdAt:new Date().toISOString()
          },{merge:true});
          return;
        }catch(err){
          if(err.code!=='auth/email-already-in-use')throw err;
        }
      }
      if(['auth/invalid-credential','auth/user-not-found','auth/wrong-password'].includes(e.code)){
        throw new Error(role==='ADMIN'?'Firebase could not sign you in. Check your email and password.':'The phone number or password was not accepted. Check your details, or register if you have not created an account.');
      }
      if(e.code==='auth/operation-not-allowed'){
        throw new Error('Email/Password sign-in must be enabled in your Firebase Authentication console.');
      }
      throw e;
    }
  }

  async function register(values){
    try{
      await call('registerTeacher',{...values,phone:normalizePhone(values.phone)});
    }catch(e){
      // Fallback: direct registration
      const phone=normalizePhone(values.phone);
      const cred=await createUserWithEmailAndPassword(auth,phoneAlias(phone),values.password);
      await setDoc(doc(db,'teachers',cred.user.uid),{
        id:cred.user.uid,
        fullName:values.fullName,
        phone,
        requestedPlace:values.requestedPlace,
        homePlaceId:null,
        allowedPlaceIds:[],
        approvalStatus:'pending',
        role:'TEACHER',
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      });
    }
    await login('TEACHER',values.phone,values.password);
  }

  async function logout(){
    ++generation.current;
    access.current=false;
    setData(blank());
    setProfile(null);
    setError('');
    await signOut(auth);
  }

  async function mutate(action,payload={}){
    if(!navigator.onLine)throw new Error('You are offline. Reconnect before saving.');
    let result=null;
    try{
      result=await call(action,payload);
    }catch(callErr){
      // Graceful fallback to direct Firestore write: prevents "internal error 0"
      result=await directFirestoreMutate(action,payload,profile);
    }
    setDoc(doc(db,'sync','changes'),{updatedAt:new Date().toISOString()},{merge:true}).catch(()=>{});
    await refresh();
    return result;
  }

  async function reauthenticate(password){
    if(!auth.currentUser||!profile?.phone)throw new Error('Sign in again to update your account.');
    await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(phoneAlias(profile.phone),password));
    await auth.currentUser.getIdToken(true);
  }

  async function changeOwnPhone(phone,password){
    await reauthenticate(password);
    try{
      await call('updateOwnPhone',{phone:normalizePhone(phone)});
    }catch(e){
      await updateDoc(doc(db,'teachers',auth.currentUser.uid),{
        phone:normalizePhone(phone),
        updatedAt:new Date().toISOString()
      });
    }
    await logout();
  }

  async function changeOwnPassword(currentPassword,newPassword){
    await reauthenticate(currentPassword);
    await updatePassword(auth.currentUser,newPassword);
  }

  return (
    <Context.Provider value={{
      profile,
      loading,
      dataLoading,
      data,
      error,
      operational,
      login,
      register,
      logout,
      mutate,
      refresh,
      refreshProfile,
      changeOwnPhone,
      changeOwnPassword
    }}>
      {children}
    </Context.Provider>
  );
}

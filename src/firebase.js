import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
import {getFunctions,connectFunctionsEmulator,httpsCallable} from 'firebase/functions';
import {initializeAppCheck,ReCaptchaEnterpriseProvider} from 'firebase/app-check';
const e=import.meta.env;
export const app=initializeApp({apiKey:e.VITE_FIREBASE_API_KEY||'AIzaSyDzaRIk70f--iVtbD4Mc0ozkLcmANTwDi8',authDomain:e.VITE_FIREBASE_AUTH_DOMAIN||'jhmholy.firebaseapp.com',projectId:e.VITE_USE_EMULATORS==='true'?'demo-holy-ministries':e.VITE_FIREBASE_PROJECT_ID||'jhmholy',storageBucket:e.VITE_FIREBASE_STORAGE_BUCKET||'jhmholy.firebasestorage.app',messagingSenderId:e.VITE_FIREBASE_MESSAGING_SENDER_ID||'1041779426816',appId:e.VITE_FIREBASE_APP_ID||'1:1041779426816:web:28ecd02e44e9d5dca77ae5',measurementId:e.VITE_FIREBASE_MEASUREMENT_ID||'G-E84CKWF508'});
export const auth=getAuth(app),db=getFirestore(app),functions=getFunctions(app,'asia-south1');
if(e.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY)initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(e.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY),isTokenAutoRefreshEnabled:true});
if(e.VITE_USE_EMULATORS==='true'){connectAuthEmulator(auth,'http://127.0.0.1:9099');connectFirestoreEmulator(db,'127.0.0.1',8080);connectFunctionsEmulator(functions,'127.0.0.1',5001);}
// Analytics is opt-in: do not send student activity or contacts to Analytics.
export async function enableAnalytics(){const {isSupported,getAnalytics}=await import('firebase/analytics');if(await isSupported())return getAnalytics(app);}
export async function call(action,payload={}){return (await httpsCallable(functions,'ministry')({action,...payload})).data;}

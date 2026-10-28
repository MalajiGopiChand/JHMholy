import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {Provider} from './store';
import App from './App';
import './style.css';
import './mobile.css';
createRoot(document.getElementById('root')).render(<BrowserRouter><Provider><App/></Provider></BrowserRouter>);
if('serviceWorker'in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').then(r=>{r.addEventListener('updatefound',()=>{const w=r.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)window.dispatchEvent(new Event('app-update'));});});}).catch(console.error));

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],resolve:{alias:{'react-native':'react-native-web'}},build:{rollupOptions:{output:{manualChunks:{firebase:['firebase/app','firebase/auth','firebase/firestore','firebase/functions','firebase/app-check'],ui:['react','react-dom','react-native-web']}}},chunkSizeWarningLimit:800}});

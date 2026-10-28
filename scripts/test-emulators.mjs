import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/firebase-tools/lib/bin/firebase.js','emulators:exec','--project','demo-holy-ministries','--only','auth,firestore,functions','node tests/rules.emulator.mjs && node tests/integration.emulator.mjs'],{stdio:'inherit',env:{...process.env,FUNCTIONS_DISCOVERY_TIMEOUT:'60'}});
if(result.error)throw result.error;
process.exit(result.status??1);

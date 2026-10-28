# Holy Ministries mobile app

Mobile-first React + React Native for Web PWA for Jyothirmayuni Holy Ministries. Uses the supplied logo and Firebase project `jhmholy`. Installable through a published HTTPS address in Chrome on Android and Safari on iPhone; this is not an APK.

## Run

Node 22+ and npm:

```powershell
npm install
npm install --prefix functions
npm run dev
npm test
npm run build
npm run preview
```

No demo login, sample records or seeded ministry content. Administrators first add actual places/classes in Settings, then approve teachers and assign their places. Students are records, not login accounts.

## Included

- Mobile top bar, five-tab bottom navigation, large action buttons, supplied ministry logo and installation help.
- Teacher registration and pending status. Live approval opens the dashboard automatically. Rejected/disabled/pending accounts cannot access operational records.
- Student creation and full details: name, roll number, date of birth, place, class, mother, father and family phone. Teachers create; admins edit, archive, restore, transfer or delete.
- Attendance marking only on Sundays in Asia/Kolkata, enforced by server time. Teachers record current Sunday once. Admins correct/remove historical Sunday statuses with a reason and revision check. Readable history and place-wise absences every day.
- Student points: teachers award 1–100 points with a reason; admins can correct/remove entries. Retries cannot duplicate awards.
- Home announcements with admin publishing, audience, expiry, priority, read tracking and in-app badges. No device push delivery is configured.
- Sunday story titles/timetable for all places, one place, or an approved teacher. Teachers read and acknowledge their own assignments and submit completion notes; admins manage schedules and story library.
- Teacher profile: only own phone and password may change after current-password verification. Name, place, approval and role stay administrator-controlled.
- Admin teacher verification, configuration, reports/CSV, browser printing and audit history.

## Firebase activation

The public client configuration is already installed in `src/firebase.js`. Production backend/hosting deployment requires authorized Firebase credentials; the public API key cannot enable services or create an administrator.

1. Enable Email/Password in Firebase Authentication. Teachers use phone/password, backed by normalized internal email aliases; no SMS service is implied.
2. Create Firestore. Functions run in `asia-south1` and require a billing-enabled project.
3. Configure App Check/reCAPTCHA Enterprise for the deployed domain. Set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` in `.env.local`. Production callables require App Check.
4. Authenticate Firebase CLI, verify project `jhmholy`, then deploy:

```powershell
npx firebase login
npx firebase deploy --project jhmholy --only "firestore,functions"
```

5. In a private server shell, set `GOOGLE_APPLICATION_CREDENTIALS` to your authorized service-account file, `GCLOUD_PROJECT=jhmholy`, `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`. Run `npm run bootstrap`. It provisions only the administrator. No places, classes, students, teachers or topics are seeded. Repeating bootstrap does not reset passwords or promote unrelated existing accounts.
6. Build and deploy:

```powershell
npm run build
npx firebase deploy --project jhmholy --only hosting
```

Add the deployed host to Auth authorized domains and App Check configuration. If Firebase Storage is enabled, deploy `storage.rules` with `npx firebase deploy --project jhmholy --only storage`.

Full rules and permission explanation: `FIREBASE_RULES.md`, `firestore.rules`, `storage.rules`. All operational writes use callable functions with role, scope and transaction checks; direct client writes are denied, including admin writes. Passwords never enter Firestore. Analytics is opt-in and not initialized by default.

## Isolated testing

Java 21+ is required. `npm run test:emulators` runs Firestore rules and callable integration checks against `demo-holy-ministries` only. Synthetic test fixtures never enter `jhmholy`.

For manual local emulator use, set `VITE_USE_EMULATORS=true` in `.env.local`, start `npm run emulators`, bootstrap with emulator Auth/Firestore environment variables and project `demo-holy-ministries`, then run `npm run dev`. Remove emulator variables before production builds/deployment.

## Practical limits

No public deployment, real administrator provisioning, or physical-phone installation is claimed by this source build. HTTPS hosting and Firebase activation above are needed before distributing the app. Offline mode caches only the public shell, not student records; saving requires connectivity. The snapshot API suits a small ministry; larger deployments should use server pagination. Test physical-device installation and Telugu print output on the deployed app before distributing reports.

## Additional ZIP features (no parent accounts)

The existing app now includes Homework, Staff messaging, Student leaderboard, Staff attendance, Teaching reports, Teacher progress/leaderboard, Offerings, Finance, and Complaints & feedback under Home → View all. These are routes in the same app, not a separate application. Points serve as the reference app's dollar rewards; offerings/finance use INR.

Teachers can create homework, staff messages, their own attendance/reports, offerings and private complaints. Existing approval and assigned-place restrictions apply. Admins edit/delete these records, reply to complaints and manage finance. Teachers see only their own staff progress; admins see the full teacher ranking. Staff messages refresh through the existing Firestore change signal and polling fallback. No messages are sent outside the app.

Offerings and finance are separate registers; the finance screen labels this to prevent double counting. All money is stored as integer paise, and finance data is withheld from teachers. Complaints are visible only to the author and admins. New records are validated and audited by the callable; direct Firestore writes remain denied. Parent roles, registration and routes are not included.

# JHMholy

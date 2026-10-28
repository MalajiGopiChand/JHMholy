# Firebase rules and permissions

The complete deployable rules are in `firestore.rules` and `storage.rules`. Firebase Auth manages passwords separately; passwords never enter Firestore.

Teachers have read access to their assigned ministry data and may add students, initial Sunday attendance and student points. They may acknowledge their own assigned lesson and submit a completion note. They cannot edit/delete saved operational records, publish announcements, create/change schedules, assign places, self-approve, or change their profile name/place/role. Their only profile changes are their own phone number and Auth password after verifying the current password.

Admins can read, create, update and delete students, point entries, announcements, stories, schedules, configuration and teacher accounts through the app’s callable operations. Historical attendance correction/removal is audited. Student and teacher deletion preserves historical attendance/points attribution and audit records. Used places/classes cannot be deleted until live references are reassigned.

Operational writes deliberately go through the `ministry` callable rather than direct browser Firestore writes. The Admin SDK bypasses Firestore rules, so the callable independently checks Auth, live approval, role, current assigned places, valid payload fields, revisions, uniqueness, idempotency, Sunday policies, and recent authentication for a phone change. Teacher operational reads also use this callable so future/expired/private announcements are never sent to an unauthorized browser.

Direct Firestore access permits only own-profile status listeners, approved-account synchronization signals, and administrator reads. Every direct browser write is denied, including an administrator write: use the app operations to preserve transaction and audit requirements. Do not replace these rules with `allow read, write: if request.auth != null`.

Attendance marking is open only on Sundays in **Asia/Kolkata**, enforced against server time. Teachers mark only the current Sunday and cannot edit saved statuses. Admins can correct saved historical Sunday records through the Records screen on any day, with a reason and expected revision. Unmarking removes the status but retains an audit entry. Reading records and place-wise explicit absences is available every day. A special-date document does not bypass the Sunday gate in this version.

Teacher registration always creates a server-owned pending profile. Pending/rejected/disabled accounts cannot fetch operational data, even through a forged URL or an old token. A live own-profile listener automatically opens an approved teacher’s dashboard and clears operational state after access loss. Browser export files already downloaded cannot be revoked.

Sunday schedules may be published for all ministry places, a specific place, or a verified teacher at an assigned place. Only admins manage titles, timing, Bible references, notes, publishing and deletion. Drafts and other teachers’ private assignments are excluded from teacher responses.

## Deploy

1. Enable Email/Password in Firebase Auth for project `jhmholy`.
2. Configure App Check with reCAPTCHA Enterprise and set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` before building. Production callable enforcement stays enabled.
3. With authorized Firebase CLI credentials, run `npx firebase deploy --project jhmholy --only "firestore,functions"`.
4. If Storage is enabled, deploy the deny-all rules with `npx firebase deploy --project jhmholy --only storage`.
5. Bootstrap the admin using server-only environment variables as documented in `README.md`.
6. Build and deploy Hosting over HTTPS so users can install the app on phones.

The public Firebase configuration cannot enable services, deploy backend code, or create the administrator by itself. No sample student, teacher, attendance, topic, announcement or point data is seeded into the live app. Test fixtures are used only in the isolated `demo-holy-ministries` emulators.

Additional collections: homework, messages, staffAttendance, staffReports, offerings, finance, complaints and server-only staffAttendanceLocks. They use the existing default-deny Firestore rule. Read/write access is mediated by the callable: approved teachers are scoped to assigned places; staff attendance/reports and complaints are restricted to their author; finance requires admin. Only admins edit/delete. Staff attendance has a transactional teacher/date uniqueness lock. Money is stored in integer paise, and create requests are idempotent. No parent accounts are supported.

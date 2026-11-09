# Multi-user accounts and private data
Objective: replace the single shared master-password session with user accounts whose parks, attractions, visits, and ride records are private to each user.
Branch: iteration-3-dashboard. Delivery: inline slices. Test runner: Vitest, typecheck, lint, Next build, Docker Compose.

## Specs
1. **S1 — User registration**: User requirement: "ahora quiero que la aplicación te permita registrarte y crear tu propio usuario de inicio de sesión". Acceptance: a new user can register with a unique normalized email/username and a password stored only as a salted password hash; duplicate identities and weak/invalid input are rejected.
2. **S2 — User authentication**: User requirement: "la aplicación tenia que ser multiusuario". Acceptance: users can sign in and sign out with an expiring, tamper-resistant session tied to the user; the legacy shared master-password login is not used to authorize user data.
3. **S3 — Private ownership**: User requirement: "Cada usuario debe ver solo sus propios parques, visitas y atracciones". Acceptance: every park, attraction, visit, ride log, wait observation, enrichment job, alias, source, and official link is owned by a user or reachable only through a user-owned park; reads, writes, exports, backups, and deletes enforce ownership server-side.
4. **S4 — Existing data migration**: Authorized scope: migrate the current single-user data to an explicitly configured first account without exposing it to later accounts. Acceptance: startup remains compatible with the existing SQLite database and existing data has one deterministic owner.
5. **S5 — Localized auth UI**: Acceptance: registration, login, logout, validation, duplicate-account, and authentication errors are available in English and Spanish.

## Tasks
- T1 (S1-S2): Add user records, password hashing, user-bound sessions, registration/login/logout routes, and localized auth UI. Route: inline. Status: complete; typecheck/lint/tests/build green. Commit: pending.
- T2 (S3): Add ownership to the catalog graph and enforce it in repositories, actions, API routes, backups, exports, and middleware. Route: inline. Status: complete; ownership regression green. Commit: pending.
- T3 (S4): Add safe first-user migration for existing SQLite data and deployment configuration. Route: inline. Status: complete; first registered account claims legacy unowned parks. Commit: pending.
- T4 (S5): Add localized messages and end-to-end auth/isolation regression tests. Route: inline. Status: complete; 44 tests green. Commit: pending.

## Log
L1: "vale, ahora quiero que la aplicación te permita registrarte y crear tu propio usuario de inicio de sesión puedes empezar a implementar esto? Como te dije la aplicación tenia que ser multiusuario"
L2: "Cada usuario debe ver solo sus propios parques, visitas y atracciones"
L3: Implemented user accounts with scrypt password hashes, signed expiring user-bound sessions, registration/login/logout routes, bilingual auth UI, ownership filtering through the park/ride/visit graph, scoped backup/export/delete operations, and first-account migration of legacy unowned parks. Verification: typecheck, lint, build, and 44 tests pass.

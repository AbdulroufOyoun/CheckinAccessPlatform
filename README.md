# CheckinAccess Platform

Angular console for **platform owners** of CheckinAccess.

Talks to the **central** Laravel API (`http://localhost:8000/api`) with Passport `user-api` tokens.  
Tenant day-to-day operations belong in **CheckinAccessFront**.

## Stack

- Angular 21 (standalone)
- Bootstrap 5 + ng-bootstrap
- ngx-translate (AR / EN + RTL)
- Auth: login → OTP → Bearer token

## Prerequisites

| Tool | Notes |
|------|--------|
| Node.js | 20+ recommended |
| npm | Comes with Node |
| Backend | [CheckinAccess](https://github.com/AbdulroufOyoun/CheckinAccess) on `http://localhost:8000` |
| Platform user | e.g. seeded `test@gmail.com` / `123456789` with `is_platform_admin = 1` |

## First-time install

```bash
git clone https://github.com/AbdulroufOyoun/CheckinAccessPlatform.git
cd CheckinAccessPlatform
npm install
```

API base URL (edit if needed):

- `src/environments/environment.development.ts`
- `src/environments/environment.ts`

Default:

```ts
apiBaseUrl: 'http://localhost:8000/api'
```

Ensure backend central domains include `localhost`:

```env
CENTRAL_DOMAINS=localhost,127.0.0.1
APP_URL=http://localhost
```

## How to run

Start backend first:

```bash
cd ../CheckinAccess
php artisan serve --host=0.0.0.0 --port=8000
```

Then this app (port **4201** to avoid clashing with the tenant front on 4200):

```bash
cd ../CheckinAccessPlatform
npm start -- --host=0.0.0.0 --port=4201
```

Open http://localhost:4201/

### Windows PowerShell note

```powershell
npm.cmd start -- --host=0.0.0.0 --port=4201
```

## Main flows

1. Login → OTP (`data.sms` in local/dev)
2. Tenants list / create tenant + modules (`property`, `education`)
3. Tenant detail → domain, modules, activate/deactivate, create first admin
4. Open tenant admin UI on the tenant host (e.g. `http://ratco.localhost:4200`)

## Build for production

```bash
npm run build
```

## Tests

```bash
npm test
```

Backend smoke (API must be up):

```bash
cd ../CheckinAccess
php scripts/test-platform-smoke.php
```

## Related projects

| Project | Purpose |
|---------|---------|
| CheckinAccess | Laravel multi-tenant API |
| CheckinAccessFront | Tenant admin SPA (`/api/admins/*`) |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Cannot login | Seed platform user; confirm central Host is `localhost:8000` |
| Tenants empty | User needs `is_platform_admin` or proper central permissions |
| CORS errors | Serve API with `--host=0.0.0.0` and check Laravel CORS config |

## License

MIT

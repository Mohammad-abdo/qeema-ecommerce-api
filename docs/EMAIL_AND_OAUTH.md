# Email (Nodemailer) and social login

## Email — all mail via Nodemailer

Transactional email is queued on the `emails` BullMQ queue and sent by the worker using **Nodemailer**.

1. Configure SMTP in `backend/.env` (Gmail example with an [App Password](https://myaccount.google.com/apppasswords)):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Esyasatgo <your@gmail.com>"
```

2. Run the worker (required for delivery):

```bash
cd backend
npm run worker
```

Without SMTP, messages are logged to the console as `[email:dev]`.

Emails include: order shipped/delivered, welcome on register/OAuth signup.

## Social login — Google, Facebook, Apple

### Backend (`backend/.env`)

```env
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
APPLE_CLIENT_ID=....service id for Sign in with Apple (web)
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=....apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=
NEXT_PUBLIC_APPLE_CLIENT_ID=
```

### Provider setup (summary)

| Provider | Console | Redirect / origins |
|----------|---------|-------------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com/) → APIs → Credentials → OAuth client (Web) | Authorized JS origins: `http://localhost:3000` |
| **Facebook** | [Meta Developers](https://developers.facebook.com/) → App → Facebook Login | Valid OAuth redirect URIs: site URL; enable email permission |
| **Apple** | [Apple Developer](https://developer.apple.com/) → Identifiers → Services ID | Domains + return URLs for your site; Sign in with Apple |

### API

`POST /api/v1/auth/oauth`

```json
{
  "provider": "google",
  "token": "<id_token from Google>"
}
```

Facebook uses `accessToken` as `token`. Apple uses `id_token`; optional `name` on first sign-in.

Returns the same payload as email/password login (`accessToken`, `user`) and sets the `erp_access_token` httpOnly cookie.

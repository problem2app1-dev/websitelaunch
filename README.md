# Problem2App

Automation studio website with interactive invoice, payroll, warehouse enquiry, dashboard and attendance demos. Built with React, TypeScript and Vite.

## Run locally

Requires Node.js 22 and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 4173
```

## Check and build

```sh
pnpm check
pnpm test
pnpm build
```

## Deploy with Vercel

Import this repository. Keep the root directory at the repository root. `vercel.json` configures the Vite build and the `dist/public` output, including the `/examples` route. No environment variables are required for the website, PDF downloads, payroll calculations or guided demos.

Booking links point to https://calendly.com/problem2app/30min. Change booking and email details in `client/src/lib/site.ts`.

Optional live voice and email services are described in `.env.example`. Keep credentials in your deployment environment, never in Git. Vite-prefixed variables are public browser configuration, not secrets. Voice, attendance, payroll and dashboard previews use sample data; they do not connect to real business records by default.

The contact form is not displayed; customer enquiries go to Calendly. Optional server routes are retained for future integrations. The default invoice action downloads a PDF locally and Gmail opens a draft for the visitor to send.

## Included assets

Font licenses are included alongside local fonts in `client/public/fonts`. Product logos identify example integrations, not endorsements.

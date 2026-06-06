<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SEO Blueprint Generator

Generate an SEO blueprint and an HTML landing page using a user-supplied Gemini
or OpenAI API key.

## API key privacy

- Provider keys are required for each user.
- Keys are held only in browser memory and sent over a same-origin HTTPS request
  to the server function.
- Keys are never bundled into the frontend, written to storage, cached, or
  returned in responses.
- Generated HTML runs in an isolated preview without same-origin access.

Users should create restricted provider keys and revoke them when they are no
longer needed.

## Run locally

Prerequisites: Node.js and the Vercel CLI.

1. Run `npm install`.
2. Run `vercel dev`.
3. Open the local URL shown by Vercel.

The normal Vite command serves only the frontend; `vercel dev` also runs the
secure `/api/generate` function.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit`

# Discord Templates Hub

A front-end website where users can sign up, log in, and post Discord server template links.

## Features

- Sign up and login
- Only logged-in users can post templates.
- Fetch template data from Discord API.
- Show template name, usage count, channels, roles, and the user who posted it.
- Per-template delete button shown only to the template owner (other users cannot delete it from the UI).

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Notes

This is a client-only demo. Authentication and permissions are enforced in browser JavaScript/localStorage.
For production security, use a real backend/database and server-side auth.

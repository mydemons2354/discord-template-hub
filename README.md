# Discord Template Hub

Simple front-end website where people can post Discord server templates by URL.

## Features

- Add a Discord template link (`discord.new/...` or `discord.com/template/...`).
- Fetch template data from Discord API.
- Show template name, channel list, and role list.
- Save posted templates in browser `localStorage`.
- Clear all saved templates with one click.

## Run locally

Open `index.html` directly, or serve with:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

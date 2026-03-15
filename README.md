# The Inkwell — Journalism Website

A modern, mobile-ready journalism website with CMS, built as a static site for GitHub Pages deployment.

## Features

- **Home Page** — Hero section, featured articles, writer profiles
- **Creative Writing Page** — All literary essays and creative pieces
- **News Page** — Articles organised by dated News Issues
- **Writers Page** — Full writer profiles with linked articles
- **Article Page** — Single article view with reading progress bar
- **CMS Admin** — Full content management system (no server needed)

## CMS Login

Navigate to `/cms.html`

- **Username:** `admin`  
- **Password:** `inkwell2024`

> To change the password, edit the `CREDS` object in `cms.html`.

## CMS Capabilities

| Feature | Description |
|---|---|
| Articles | Create, edit, publish/unpublish, delete |
| News Issues | Organise news articles by dated issue |
| Writers | Add writer profiles with bio and avatar |
| Rich Body | HTML editor with toolbar shortcuts |
| Cover Images | URL-based image support with preview |

## GitHub Pages Deployment

1. Create a new GitHub repository
2. Upload all files maintaining the folder structure:
   ```
   index.html
   creative.html
   news.html
   writers.html
   article.html
   cms.html
   css/style.css
   js/core.js
   ```
3. Go to **Settings → Pages**
4. Set Source to **Deploy from a branch**
5. Select **main** branch, **/ (root)**
6. Save — your site will be live at `https://yourusername.github.io/repo-name/`

## Data Storage

All content is stored in the browser's `localStorage`. This means:
- Data persists across sessions on the same browser
- Each visitor/editor sees their own local copy
- For a shared CMS, consider upgrading to a backend (Supabase, Firebase, etc.)

## Customisation

### Change publication name
Search and replace `The Inkwell` across all HTML files.

### Change accent colour
In `css/style.css`, update `--accent: #c8392b;`

### Add more writers/articles
Use the CMS at `/cms.html`

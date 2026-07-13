# WorkspAIce Landing

Static single-page site for the WorkspAIce desktop AI client.

## Files

- `index.html` — markup (5 sections: hero, why, providers, credits, footer)
- `404.html` — branded not-found page (served by nginx `error_page`)
- `style.css` — flat minimal styles, light + dark themes, mobile-first, scroll/entrance animations
- `app.js` — theme toggle + scroll-reveal (honors `prefers-reduced-motion`)
- `theme-init.js` — pre-paint theme bootstrap (external so CSP needs no `'unsafe-inline'`)
- `assets/` — brand mark (`icon.svg` is the source of truth; PNGs are rendered from it), favicons, `og-card.svg`/`.png` social card
- `nginx.conf` — static site server config (gzip, cache headers, 404 handling)
- `security-headers.conf` — security headers snippet, `include`d in every location (nginx does not inherit `add_header` into locations that set their own)
- `Dockerfile` — `nginx:1.27-alpine` image that serves the page
- `docker-compose.yml` — runs the site on port **9988**

## Regenerating assets

`assets/icon.svg` and `assets/og-card.svg` are the sources. After editing them:

```sh
cd landing/assets
rsvg-convert -w 512 -h 512 icon.svg -o icon.png
rsvg-convert -w 32  -h 32  icon.svg -o favicon-32.png
rsvg-convert -w 16  -h 16  icon.svg -o favicon-16.png
rsvg-convert -w 180 -h 180 -b '#F5F5F5' icon.svg -o apple-touch-icon.png
rsvg-convert -w 1200 og-card.svg -o og-card.png
```

## Before deploying

Set the production origin in `index.html`: uncomment the canonical /
`og:url` / `og:image` block in `<head>` and replace `https://YOUR-DOMAIN`.

## Local dev (no Docker)

```sh
cd landing
python3 -m http.server 8000
# → http://localhost:8000
```

## Run with Docker Compose

From the `landing/` directory:

```sh
docker compose up -d --build
# → http://localhost:9988
```

Stop with `docker compose down`.

## Deploy

Build the image and push to your registry, then run on your infrastructure.
The container listens on port 80 and is a fully self-contained static site.

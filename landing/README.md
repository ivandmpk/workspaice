# WorkspAIce Landing

Static single-page site for the WorkspAIce desktop AI client.

## Files

- `index.html` — markup (5 sections: hero, why, providers, credits, footer)
- `style.css` — flat minimal styles, light + dark themes, mobile-first
- `app.js` — theme toggle (persists choice, respects `prefers-color-scheme`)
- `assets/` — app icon (W + AI mark) and favicons
- `nginx.conf` — static site server config (gzip, cache headers, security headers)
- `Dockerfile` — `nginx:1.27-alpine` image that serves the page

## Local dev (no Docker)

```sh
cd landing
python3 -m http.server 8000
# → http://localhost:8000
```

Or with Node:

```sh
npx --yes serve landing
```

## Run with Docker

From the `landing/` directory:

```sh
docker build -t workspaice-landing .
docker run --rm -p 8080:80 workspaice-landing
# → http://localhost:8080
```

## Deploy

Build the image and push to your registry, then run on your infrastructure.
The container listens on port 80 and is a fully self-contained static site.

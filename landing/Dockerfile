# WorkspAIce landing — static site served by nginx
# Build from the landing/ directory at the repo root.

FROM nginx:1.27-alpine

# Minimal nginx config tuned for a single static site.
# - Gzip text assets
# - Long cache for /assets/*
# - Short cache for HTML so updates are seen quickly
# - SPA-friendly: fallback to index.html (harmless here, future-proof)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static site contents
COPY index.html style.css app.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

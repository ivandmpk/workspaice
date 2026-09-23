# WorkspAIce landing — static site served by nginx
# Build from the landing/ directory at the repo root, or via docker compose.

FROM nginx:1.27-alpine

# Site server config + security headers snippet (see comments in each file)
RUN rm -f /etc/nginx/conf.d/default.conf && mkdir -p /etc/nginx/snippets
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf

# Static site contents
COPY index.html 404.html style.css app.js theme-init.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

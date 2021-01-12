FROM nginx:1.19
ARG DOMAIN
ENV DOMAIN ${DOMAIN}
COPY dev.nginx.template /etc/nginx/templates/${DOMAIN}.conf.template
COPY certs /certs
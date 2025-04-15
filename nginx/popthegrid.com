js_import main from validate_hmac.js;

limit_req_zone $binary_remote_addr zone=share_ip:10m rate=1r/s;
limit_req_zone $cookie_session zone=share_session:50m rate=10r/m;

server {
	server_name popthegrid.com;
	server_tokens off;

	location / {
		proxy_pass http://localhost:3000;
		proxy_set_header X-Request-Id "";
		proxy_set_header X-Real-Ip $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $host;
	}

	location /session {
		limit_req zone=share_ip burst=10 nodelay;
		limit_req_status 429;
		limit_req_log_level warn;

		proxy_pass http://localhost:3000;
		proxy_set_header X-Request-Id "";
		proxy_set_header X-Ip-RateLimited $limit_req_status;
		proxy_set_header X-Real-Ip $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $host;
	}

	location /share {
		auth_request /validate-hmac;

		limit_req zone=share_session burst=2 nodelay;
		limit_req zone=share_ip burst=10 nodelay;
		limit_req_status 429;
		limit_req_log_level warn;

		proxy_pass http://localhost:3000;
		proxy_set_header X-Request-Id "";
		proxy_set_header X-Ip-RateLimited $limit_req_status;
		proxy_set_header X-Real-Ip $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $host;
	}

	location /validate-hmac {
		internal;
		set $session $cookie_session;
		js_content main.validate_hmac;
	}

	location ~* .(?:css|js) {
		proxy_pass http://localhost:3000;
		proxy_set_header X-Request-Id "";

		expires max;
		add_header Cache-Control "public";
	}

	listen [::]:443 ssl ipv6only=on; # managed by Certbot
	listen 443 ssl; # managed by Certbot
	ssl_certificate /etc/letsencrypt/live/popthegrid.com/fullchain.pem; # managed by Certbot
	ssl_certificate_key /etc/letsencrypt/live/popthegrid.com/privkey.pem; # managed by Certbot
	include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
	if ($host = popthegrid.com) {
		return 301 https://$host$request_uri;
	} # managed by Certbot


	listen 80 ;
	listen [::]:80 ;
	server_name popthegrid.com;
	return 404; # managed by Certbot
}

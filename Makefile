# Stop the running instances
down:
	docker-compose down

# Start the server and the client with development config
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --detach

# Start the server and the client with development config for debugging
debug:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.debug.yml up --build

# Start the server and the client with production config
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build --detach

.PHONY: down dev debug prod release-frontend release-backend

commit_hash=$(shell git rev-parse --short HEAD)

# Stop the running instances
down:
	docker-compose down

# Start the server and the client with development config
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Start the server and the client with development config for debugging
debug:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.debug.yml up --build

# Start the server and the client with production config
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
	
push-backend:
	cd server && \
	docker build -t tmaxmax/popthegrid:latest-backend -t tmaxmax/popthegrid:$(commit_hash)-backend . && \
	docker push tmaxmax/popthegrid:latest-backend && \
	docker push tmaxmax/popthegrid:$(commit_hash)-backend

.PHONY: down dev debug prod push-backend deploy
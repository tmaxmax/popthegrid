FROM golang:1.15-alpine
RUN apk update && apk add git ca-certificates
ENV CGO_ENABLED=0
RUN go get -u github.com/cosmtrek/air
RUN go get -u github.com/go-delve/delve/cmd/dlv
WORKDIR /server
COPY go.* ./
RUN go mod download
COPY . .
ENV CERTS_CACHE_DIR=/certs/prod
VOLUME [ "${CERTS_CACHE_DIR}" ]
CMD ["air"]

FROM golang:1.15-alpine AS build
RUN apk update && apk add git ca-certificates
WORKDIR /build
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -installsuffix 'static' -o main .

FROM scratch
WORKDIR /server
COPY --from=build /build/main ./
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs
ENV CERTS_CACHE_DIR=/certs/prod
VOLUME [ "${CERTS_CACHE_DIR}" ]
ENTRYPOINT ["./main"]

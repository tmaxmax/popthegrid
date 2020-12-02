FROM golang:1.15-alpine AS build
RUN apk update && apk add git
WORKDIR /build
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine
WORKDIR /server
COPY --from=build /build/main ./
ENTRYPOINT ["./main"]

FROM golang:1.22-alpine AS build
WORKDIR /src
COPY run/main.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/proxy main.go

FROM alpine:3.20
RUN apk add --no-cache curl
RUN adduser -D -u 10001 app
USER app
COPY --from=build /out/proxy /proxy
EXPOSE 8081
ENTRYPOINT ["/proxy"]

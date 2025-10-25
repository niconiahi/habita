FROM golang:1.22-alpine AS runtime
WORKDIR /src
COPY go.mod .
COPY cmd/ ./cmd/
COPY internal/ ./internal/
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/middleware cmd/server/main.go

FROM alpine:3.20 AS system
RUN apk add --no-cache curl
RUN adduser -D -u 10001 gopher
USER gopher
COPY --from=runtime /out/middleware /middleware
ENTRYPOINT ["/middleware"]

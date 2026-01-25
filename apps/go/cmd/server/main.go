package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"habita/apps/go/internal/observability"
	"habita/apps/go/internal/smtp"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

func main() {
	// Initialize OpenTelemetry
	tp, lp := observability.InitOTel()
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
		if err := lp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down logger provider: %v", err)
		}
	}()

	logger := observability.NewLogger()

	// Health check (no tracing ne
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// Wrap handlers with otelhttpp to extract trace contex
	http.Handle("/send-email",
		otelhttp.NewHandler(
			http.HandlerFunc(smtp.Handler(logger)),
			"POST /send-email",
		),
	)
	http.Handle("/send-landlord-invite",
		otelhttp.NewHandler(
			http.HandlerFunc(smtp.LandlordInviteHandler(logger)),
			"POST /send-landlord-invite",
		),
	)

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT env var is required")
	}

	addr := fmt.Sprintf(":%s", port)
	server := &http.Server{
		Addr:              addr,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("Go listening on %s with OpenTelemetry enabled", addr)
	log.Fatal(server.ListenAndServe())
}

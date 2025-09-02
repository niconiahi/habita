package main

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"time"
)

func main() {
	target, _ := url.Parse("http://app:5173")

	proxy := httputil.NewSingleHostReverseProxy(target)

	// Optionally log/transform in one place (future telemetry, error wrapping, etc.)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("proxy error: %v", err)
		http.Error(w, "upstream error", http.StatusBadGateway)
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// set forward headers for SvelteKit
		r.Header.Set("X-Forwarded-Proto", "http")
		r.Header.Set("X-Forwarded-Host", r.Host)
		r.Header.Set("X-Forwarded-For", r.RemoteAddr)
		proxy.ServeHTTP(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT env var is required")
	}

	addr := fmt.Sprintf(":%s", port)
	s := &http.Server{
		Addr:              addr,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("Go proxy listening on %s → app:5173", addr)
	log.Fatal(s.ListenAndServe())
}

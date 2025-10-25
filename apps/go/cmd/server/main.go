package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"habita/apps/go/internal/smtp"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	http.HandleFunc("/send-email", smtp.Handler)
	http.HandleFunc("/send-owner-invite", smtp.OwnerInviteHandler)

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT env var is required")
	}

	addr := fmt.Sprintf(":%s", port)
	server := &http.Server{
		Addr:              addr,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("Go listening on %s → app:5173", addr)
	log.Fatal(server.ListenAndServe())
}

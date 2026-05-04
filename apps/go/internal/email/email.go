package email

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"os"
	"strings"

	"habita/apps/go/internal/observability"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

type Invitee struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

type Request struct {
	To      Invitee `json:"to"`
	Subject string  `json:"subject"`
	Html    string  `json:"html"`
	Ics     string  `json:"ics,omitempty"`
}

func Send(ctx context.Context, logger *observability.Logger, req Request) error {
	tracer := otel.Tracer("email")
	ctx, span := tracer.Start(ctx, "email.send")
	defer span.End()

	span.SetAttributes(
		attribute.String("email.subject", req.Subject),
		attribute.Bool("email.has_ics", req.Ics != ""),
	)

	logger.Info(ctx, "sending email", nil)
	if req.To.Email == "" || req.Subject == "" || req.Html == "" {
		return fmt.Errorf("missing required fields")
	}

	smtpHost := os.Getenv("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
	}
	smtpPort := os.Getenv("SMTP_PORT")
	if smtpPort == "" {
		smtpPort = "587"
	}
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	if smtpUser == "" || smtpPass == "" {
		return fmt.Errorf("SMTP_USER and SMTP_PASS are required")
	}

	var body strings.Builder

	body.WriteString(fmt.Sprintf("From: %s\r\n", "notifications@habita.rent"))
	body.WriteString(fmt.Sprintf("To: %s\r\n", req.To.Email))
	body.WriteString(fmt.Sprintf("Subject: %s\r\n", req.Subject))
	body.WriteString("MIME-Version: 1.0\r\n")

	if req.Ics != "" {
		boundary := "boundary-habita-calendar-invite"
		body.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary))
		body.WriteString("\r\n")

		body.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		body.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
		body.WriteString("\r\n")
		body.WriteString(req.Html)
		body.WriteString("\r\n\r\n")

		body.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		body.WriteString("Content-Type: text/calendar; method=REQUEST; charset=UTF-8\r\n")
		body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
		body.WriteString("\r\n")
		body.WriteString(req.Ics)
		body.WriteString("\r\n\r\n")

		body.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else {
		body.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
		body.WriteString("\r\n")
		body.WriteString(req.Html)
		body.WriteString("\r\n")
	}

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	log.Printf("Sending email to %s via %s with user: %s", req.To.Email, addr, smtpUser)

	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to connect: %v", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, smtpHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	tlsConfig := &tls.Config{ServerName: smtpHost}
	if err = client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("failed to start TLS: %v", err)
	}

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %v", err)
	}

	if err = client.Mail("notifications@habita.rent"); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}
	if err = client.Rcpt(req.To.Email); err != nil {
		return fmt.Errorf("failed to add recipient: %v", err)
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %v", err)
	}
	_, err = writer.Write([]byte(body.String()))
	if err != nil {
		return fmt.Errorf("failed to write email data: %v", err)
	}
	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close data writer: %v", err)
	}

	if err = client.Quit(); err != nil {
		return fmt.Errorf("failed to quit: %v", err)
	}

	logger.Info(ctx, "email sent successfully", nil)
	return nil
}

func Handler(logger *observability.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req Request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			logger.Error(ctx, "failed to decode request", nil, err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if err := Send(ctx, logger, req); err != nil {
			logger.Error(ctx, "failed to send email", nil, err)
			http.Error(w, fmt.Sprintf("Failed to send email: %v", err), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"sent"}`))
	}
}

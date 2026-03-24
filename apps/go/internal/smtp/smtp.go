package smtp

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

type EmailRequest struct {
	Type    string  `json:"type"`
	To      Invitee `json:"to"`
	Subject string  `json:"subject"`
	Text    string  `json:"text"`
	Content string  `json:"content"`
	Html    string  `json:"html"`
}


func SendCalendarInvite(ctx context.Context, logger *observability.Logger, req EmailRequest) error {
	tracer := otel.Tracer("smtp")
	ctx, span := tracer.Start(ctx, "smtp.send_calendar_invite")
	defer span.End()

	span.SetAttributes(
		attribute.String("email.subject", req.Subject),
	)

	logger.Info(ctx, "sending calendar invite", nil)
	if req.To.Email == "" || req.Subject == "" || req.Content == "" {
		return fmt.Errorf("missing required fields")
	}

	// Get SMTP configuration from environment
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

	// Build MIME multipart email with inline ICS calendar
	boundary := "boundary-habita-calendar-invite"

	var body strings.Builder

	// Email headers
	body.WriteString(fmt.Sprintf("From: %s\r\n", "notifications@habita.rent"))
	body.WriteString(fmt.Sprintf("To: %s\r\n", req.To.Email))
	body.WriteString(fmt.Sprintf("Subject: %s\r\n", req.Subject))
	body.WriteString("MIME-Version: 1.0\r\n")
	body.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary))
	body.WriteString("\r\n")

	// Text part (plain text message for clients that don't support calendar)
	body.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	body.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	body.WriteString("\r\n")
	body.WriteString(req.Text)
	body.WriteString("\r\n\r\n")

	// ICS calendar part (inline to trigger Yes/No buttons in Gmail/Outlook)
	body.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	body.WriteString("Content-Type: text/calendar; method=REQUEST; charset=UTF-8\r\n")
	body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	body.WriteString("\r\n")
	body.WriteString(req.Content)
	body.WriteString("\r\n\r\n")

	// End boundary
	body.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	// Validate SMTP credentials
	if smtpUser == "" || smtpPass == "" {
		return fmt.Errorf("SMTP_USER and SMTP_PASS are required")
	}

	// Send via authenticated SMTP with STARTTLS (Gmail)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	log.Printf("Sending email to %s via %s with user: %s", req.To.Email, addr, smtpUser)

	// Connect to server
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		log.Printf("Failed to connect: %v", err)
		return fmt.Errorf("failed to connect: %v", err)
	}
	defer conn.Close()

	// Create SMTP client
	client, err := smtp.NewClient(conn, smtpHost)
	if err != nil {
		log.Printf("Failed to create SMTP client: %v", err)
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	// Start TLS
	tlsConfig := &tls.Config{ServerName: smtpHost}
	if err = client.StartTLS(tlsConfig); err != nil {
		log.Printf("Failed to start TLS: %v", err)
		return fmt.Errorf("failed to start TLS: %v", err)
	}

	// Authenticate
	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	if err = client.Auth(auth); err != nil {
		log.Printf("Failed to authenticate: %v", err)
		return fmt.Errorf("failed to authenticate: %v", err)
	}

	// Set sender and recipient
	if err = client.Mail("notifications@habita.rent"); err != nil {
		log.Printf("Failed to set sender: %v", err)
		return fmt.Errorf("failed to set sender: %v", err)
	}
	if err = client.Rcpt(req.To.Email); err != nil {
		log.Printf("Failed to add recipient: %v", err)
		return fmt.Errorf("failed to add recipient: %v", err)
	}

	// Send data
	writer, err := client.Data()
	if err != nil {
		log.Printf("Failed to get data writer: %v", err)
		return fmt.Errorf("failed to get data writer: %v", err)
	}
	_, err = writer.Write([]byte(body.String()))
	if err != nil {
		log.Printf("Failed to write email data: %v", err)
		return fmt.Errorf("failed to write email data: %v", err)
	}
	err = writer.Close()
	if err != nil {
		log.Printf("Failed to close data writer: %v", err)
		return fmt.Errorf("failed to close data writer: %v", err)
	}

	// Quit
	if err = client.Quit(); err != nil {
		log.Printf("Failed to quit: %v", err)
		return fmt.Errorf("failed to quit: %v", err)
	}

	logger.Info(ctx, "calendar invite sent successfully", nil)
	return nil
}

func SendHtmlEmail(ctx context.Context, logger *observability.Logger, req EmailRequest) error {
	tracer := otel.Tracer("smtp")
	ctx, span := tracer.Start(ctx, "smtp.send_html_email")
	defer span.End()

	span.SetAttributes(
		attribute.String("email.subject", req.Subject),
	)

	logger.Info(ctx, "sending html email", nil)
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
	body.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	body.WriteString("\r\n")
	body.WriteString(req.Html)
	body.WriteString("\r\n")

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	log.Printf("Sending html email to %s via %s with user: %s", req.To.Email, addr, smtpUser)

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

	logger.Info(ctx, "html email sent successfully", nil)
	return nil
}


func Handler(logger *observability.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req EmailRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			logger.Error(ctx, "failed to decode request", nil, err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		var sendErr error
		switch req.Type {
		case "html":
			sendErr = SendHtmlEmail(ctx, logger, req)
		default:
			sendErr = SendCalendarInvite(ctx, logger, req)
		}
		if sendErr != nil {
			logger.Error(ctx, "failed to send email", nil, sendErr)
			http.Error(w, fmt.Sprintf("Failed to send email: %v", sendErr), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"sent"}`))
	}
}


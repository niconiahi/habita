package smtp

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"os"
	"strings"
)

type EmailRequest struct {
	Host     string `json:"host"`
	Visitant string `json:"visitant"`
	Subject  string `json:"subject"`
	Text     string `json:"text"`
	Content  string `json:"content"`
}

type OwnerInviteRequest struct {
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
}

func SendCalendarInvite(req EmailRequest) error {
	if req.Visitant == "" || req.Host == "" || req.Subject == "" || req.Content == "" {
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
	boundary := "boundary-memudo-calendar-invite"

	var body strings.Builder

	// Email headers
	body.WriteString(fmt.Sprintf("From: %s\r\n", "bookings@habita.rent"))
	body.WriteString(fmt.Sprintf("To: %s, %s\r\n", req.Host, req.Visitant))
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
	log.Printf("Sending email from %s to %s via %s with user: %s", req.Host, req.Visitant, addr, smtpUser)

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

	// Set sender and recipients
	if err = client.Mail("bookings@habita.rent"); err != nil {
		log.Printf("Failed to set sender: %v", err)
		return fmt.Errorf("failed to set sender: %v", err)
	}
	if err = client.Rcpt(req.Host); err != nil {
		log.Printf("Failed to add host recipient: %v", err)
		return fmt.Errorf("failed to add host recipient: %v", err)
	}
	if err = client.Rcpt(req.Visitant); err != nil {
		log.Printf("Failed to add visitant recipient: %v", err)
		return fmt.Errorf("failed to add visitant recipient: %v", err)
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

	log.Printf("Email sent successfully to %s", req.Visitant)
	return nil
}

func SendOwnerInvite(req OwnerInviteRequest) error {
	if req.Email == "" || req.Subject == "" || req.Text == "" {
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

	// Validate SMTP credentials
	if smtpUser == "" || smtpPass == "" {
		return fmt.Errorf("SMTP_USER and SMTP_PASS are required")
	}

	// Build email with HTML content
	var body strings.Builder

	// Email headers
	body.WriteString(fmt.Sprintf("From: %s\r\n", "bookings@habita.rent"))
	body.WriteString(fmt.Sprintf("To: %s\r\n", req.Email))
	body.WriteString(fmt.Sprintf("Subject: %s\r\n", req.Subject))
	body.WriteString("MIME-Version: 1.0\r\n")
	body.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	body.WriteString("\r\n")
	body.WriteString(req.Text)
	body.WriteString("\r\n")

	// Send via authenticated SMTP with STARTTLS (Gmail)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	log.Printf("Sending owner invite from bookings@habita.rent to %s via %s with user: %s", req.Email, addr, smtpUser)

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
	if err = client.Mail("bookings@habita.rent"); err != nil {
		log.Printf("Failed to set sender: %v", err)
		return fmt.Errorf("failed to set sender: %v", err)
	}
	if err = client.Rcpt(req.Email); err != nil {
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

	log.Printf("Owner invite sent successfully to %s", req.Email)
	return nil
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := SendCalendarInvite(req); err != nil {
		http.Error(w, fmt.Sprintf("Failed to send email: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"sent"}`))
}

func OwnerInviteHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received owner invite request from %s", r.RemoteAddr)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req OwnerInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode owner invite request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Decoded request - Email: %s, Subject: %s", req.Email, req.Subject)

	if err := SendOwnerInvite(req); err != nil {
		log.Printf("SendOwnerInvite failed: %v", err)
		http.Error(w, fmt.Sprintf("Failed to send owner invite: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("Owner invite handler completed successfully")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"sent"}`))
}

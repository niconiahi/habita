# SMTP Server for Calendar Invitations

## Overview

This document describes the implementation of calendar invitation emails for reserved slots using a self-hosted SMTP relay and ICS (iCalendar) attachments.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Books Slot                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  TypeScript (update_slot.ts)                                    │
│  - Updates slot state to RESERVED                               │
│  - Generates ICS content string                                 │
│  - Fetches host & visitant emails from database                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST (fetch)
┌─────────────────────────────────────────────────────────────────┐
│  Go Service (run/main.go:8081/send-calendar-invite)             │
│  - Receives email data + ICS content                            │
│  - Composes MIME multipart email                                │
│  - Connects to SMTP relay                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ SMTP Protocol
┌─────────────────────────────────────────────────────────────────┐
│  SMTP Relay (namshi/smtp:25)                                    │
│  - Accepts emails from Docker network                           │
│  - Relays to recipient mail servers                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Internet
┌─────────────────────────────────────────────────────────────────┐
│  Recipient (visitant@example.com)                               │
│  - Receives email with ICS attachment                           │
│  - Clicks "Yes" in calendar app                                 │
│  - Event added to Google Calendar                               │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. SMTP Relay (namshi/smtp)

**Purpose**: Minimal Docker container that accepts SMTP connections and relays emails.

**No UI**: Pure SMTP protocol server, no web interface.

**Configuration**: See Docker Compose section below.

### 2. Go Email Service

**Purpose**: HTTP endpoint that accepts email requests and sends via SMTP.

**Why Go**: Already part of your stack, uses stdlib `net/smtp` (no dependencies).

### 3. TypeScript ICS Generator

**Purpose**: Creates ICS calendar invitation content.

**Library**: `ical-generator` (only for ICS generation, not email sending).

## Complete Implementation

### Step 1: Add SMTP Service to Docker Compose

**File**: `run/development/docker-compose.yml`

Add this service:

```yaml
services:
  # ... existing services (db, app, valkey, go, caddy, nominatim)

  smtp:
    image: namshi/smtp
    restart: unless-stopped
    environment:
      - RELAY_NETWORKS=:172.0.0.0/8  # Allow all Docker networks
    ports:
      - "25:25"
    deploy:
      resources:
        limits:
          memory: 64M
```

Update the `go` service to depend on SMTP:

```yaml
  go:
    # ... existing config
    depends_on:
      db:
        condition: service_healthy
      smtp:  # ADD THIS
        condition: service_started
    environment:
      PORT: 8081
      SMTP_HOST: smtp
      SMTP_PORT: "25"
```

### Step 2: Update Go Service

**File**: `run/main.go`

Replace entire file with:

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/smtp"
	"net/url"
	"os"
	"strings"
	"time"
)

type EmailRequest struct {
	From       string `json:"from"`
	To         string `json:"to"`
	Subject    string `json:"subject"`
	Text       string `json:"text"`
	ICSContent string `json:"ics_content"`
}

func sendCalendarInvite(w http.ResponseWriter, r *http.Request) {
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

	// Validate required fields
	if req.From == "" || req.To == "" || req.Subject == "" || req.ICSContent == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	if smtpHost == "" {
		smtpHost = "smtp"
	}
	if smtpPort == "" {
		smtpPort = "25"
	}

	// Build MIME multipart email with ICS attachment
	boundary := "boundary-memudo-calendar-invite"

	var body strings.Builder

	// Email headers
	body.WriteString(fmt.Sprintf("From: %s\r\n", req.From))
	body.WriteString(fmt.Sprintf("To: %s\r\n", req.To))
	body.WriteString(fmt.Sprintf("Subject: %s\r\n", req.Subject))
	body.WriteString("MIME-Version: 1.0\r\n")
	body.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=\"%s\"\r\n", boundary))
	body.WriteString("\r\n")

	// Text part (plain text message)
	body.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	body.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	body.WriteString("\r\n")
	body.WriteString(req.Text)
	body.WriteString("\r\n\r\n")

	// ICS calendar attachment
	body.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	body.WriteString("Content-Type: text/calendar; method=REQUEST; charset=UTF-8; name=\"invite.ics\"\r\n")
	body.WriteString("Content-Transfer-Encoding: 7bit\r\n")
	body.WriteString("Content-Disposition: attachment; filename=\"invite.ics\"\r\n")
	body.WriteString("\r\n")
	body.WriteString(req.ICSContent)
	body.WriteString("\r\n\r\n")

	// End boundary
	body.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	// Send via SMTP
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	log.Printf("Sending email from %s to %s via %s", req.From, req.To, addr)

	err := smtp.SendMail(
		addr,
		nil, // No auth for local relay
		req.From,
		[]string{req.To},
		[]byte(body.String()),
	)

	if err != nil {
		log.Printf("Failed to send email: %v", err)
		http.Error(w, fmt.Sprintf("Failed to send email: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("Email sent successfully to %s", req.To)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"sent"}`))
}

func main() {
	target, _ := url.Parse("http://app:5173")
	proxy := httputil.NewSingleHostReverseProxy(target)

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("proxy error: %v", err)
		http.Error(w, "upstream error", http.StatusBadGateway)
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// Calendar invite email endpoint
	http.HandleFunc("/send-calendar-invite", sendCalendarInvite)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
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
	log.Printf("Email endpoint available at %s/send-calendar-invite", addr)
	log.Fatal(s.ListenAndServe())
}
```

### Step 3: Install ICS Generation Library

**Command**:
```bash
bun add ical-generator
```

This library generates proper ICS content strings.

### Step 4: Create ICS Utility

**File**: `app/lib/server/ics.ts`

Create new file:

```typescript
import ical from "ical-generator"

type CreateICSParams = {
  start_date: Date
  end_date: Date
  summary: string
  description?: string
  location?: string
  organizer_email: string
  organizer_name: string
  attendee_email: string
  attendee_name: string
}

export function create_ics(params: CreateICSParams): string {
  const calendar = ical({ name: "Memudo Property Visit" })

  calendar.method("REQUEST")

  calendar.createEvent({
    start: params.start_date,
    end: params.end_date,
    summary: params.summary,
    description: params.description,
    location: params.location,
    organizer: {
      name: params.organizer_name,
      email: params.organizer_email,
    },
    attendees: [
      {
        name: params.attendee_name,
        email: params.attendee_email,
        rsvp: true,
        status: "NEEDS-ACTION",
        role: "REQ-PARTICIPANT",
      },
    ],
    status: "CONFIRMED",
  })

  return calendar.toString()
}
```

### Step 5: Create Email Utility

**File**: `app/lib/server/email.ts`

Create new file:

```typescript
type SendCalendarInviteParams = {
  from: string
  to: string
  subject: string
  text: string
  ics_content: string
}

export async function send_calendar_invite(
  params: SendCalendarInviteParams,
): Promise<void> {
  const go_service_url = process.env.GO_SERVICE_URL || "http://go:8081"

  const response = await fetch(
    `${go_service_url}/send-calendar-invite`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        ics_content: params.ics_content,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `Failed to send calendar invite: ${response.status} ${error}`,
    )
  }
}
```

### Step 6: Update Slot Reservation Logic

**File**: `app/routes/properties+/$property_id+/book/actions/server/update_slot.ts`

Replace entire file with:

```typescript
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { SLOT_STATE } from "~/lib/server/slot_state"
import { create_ics } from "~/lib/server/ics"
import { send_calendar_invite } from "~/lib/server/email"

if (!process.env.GOOGLE_CLIENT_ID)
  throw new Error("GOOGLE_CLIENT_ID is not set")

export async function update_slot(form_data: FormData) {
  const visitant_id = v.parse(
    ForceNumberSchema,
    form_data.get("visitant_id"),
  )
  const id = v.parse(ForceNumberSchema, form_data.get("id"))

  // Update slot to RESERVED
  const slot = await query_builder
    .updateTable("slot")
    .set({
      visitant_id,
      state: SLOT_STATE.RESERVED,
    })
    .where("slot.id", "=", id)
    .returning([
      "slot.start_date",
      "slot.end_date",
      "slot.host_id",
      "slot.property_id",
    ])
    .executeTakeFirstOrThrow()

  // Fetch host email
  const host = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", slot.host_id)
    .executeTakeFirstOrThrow()

  // Fetch visitant email
  const visitant = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", visitant_id)
    .executeTakeFirstOrThrow()

  // Fetch property details (optional, for better event info)
  const property = await query_builder
    .selectFrom("property")
    .select(["name", "address"])
    .where("id", "=", slot.property_id)
    .executeTakeFirstOrThrow()

  // Generate ICS content
  const ics_content = create_ics({
    start_date: slot.start_date,
    end_date: slot.end_date,
    summary: `Property Visit: ${property.name}`,
    description: `You have a scheduled visit to view the property at ${property.address}`,
    location: property.address,
    organizer_email: host.email,
    organizer_name: host.name,
    attendee_email: visitant.email,
    attendee_name: visitant.name,
  })

  // Send calendar invitation email
  await send_calendar_invite({
    from: host.email,
    to: visitant.email,
    subject: `Property Visit Invitation: ${property.name}`,
    text: `Hello ${visitant.name},

You have been invited to visit the property "${property.name}" at ${property.address}.

Date: ${slot.start_date.toLocaleDateString()}
Time: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Please open the attached calendar invitation to add this event to your calendar.

Best regards,
${host.name}`,
    ics_content,
  })
}
```

### Step 7: Add Environment Variables

**File**: `.env`

Add these variables:

```bash
# SMTP Configuration
SMTP_HOST=smtp
SMTP_PORT=25
GO_SERVICE_URL=http://go:8081
```

## Database Schema

The implementation assumes the following tables exist (based on existing migrations):

### `slot` table
- `id` - serial primary key
- `property_id` - foreign key to property
- `host_id` - foreign key to user (property owner)
- `visitant_id` - foreign key to user (visitor)
- `state` - integer (0=FREE, 1=RESERVED, 2=CANCELLED)
- `start_date` - timestamptz
- `end_date` - timestamptz

### `user` table
Must have:
- `id` - primary key
- `email` - text
- `name` - text

### `property` table
Must have:
- `id` - primary key
- `name` - text
- `address` - text

## How ICS Invitations Work

### ICS File Structure

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Memudo//Property Visit//EN
METHOD:REQUEST                          ← Indicates this is an invitation
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:unique-id-here@memudo.rent
DTSTART:20250115T100000Z               ← Start time
DTEND:20250115T110000Z                 ← End time
SUMMARY:Property Visit: Casa Linda
DESCRIPTION:Visit scheduled at...
LOCATION:Calle 123, Buenos Aires
ORGANIZER;CN=Nicolas:MAILTO:host@example.com    ← Host
ATTENDEE;CN=Andrea;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:MAILTO:visitant@example.com    ← Visitant
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR
```

### User Flow

1. **Email arrives** with ICS attachment
2. **User opens email** in Gmail/Outlook/etc
3. **Calendar app detects** ICS invitation
4. **User clicks "Yes"** or "Accept"
5. **Event is added** to their calendar
6. **Calendar can send RSVP** back to organizer (optional)

### Why This Works

- `METHOD:REQUEST` tells calendar apps this is an invitation
- `ORGANIZER` field identifies the host
- `ATTENDEE` field with `RSVP=TRUE` enables response tracking
- Email attachment triggers calendar app integration

## Implementation Steps

### Step 1: Add SMTP Service
```bash
# Edit docker-compose.yml
# Add smtp service
# Update go service dependencies
```

### Step 2: Update Go Service
```bash
# Edit run/main.go
# Add /send-calendar-invite endpoint
```

### Step 3: Install Dependencies
```bash
bun add ical-generator
```

### Step 4: Create Utilities
```bash
# Create app/lib/server/ics.ts
# Create app/lib/server/email.ts
```

### Step 5: Update Slot Logic
```bash
# Edit update_slot.ts
# Remove Google Calendar API calls
# Add ICS generation and email sending
```

### Step 6: Configure Environment
```bash
# Edit .env
# Add SMTP variables
```

### Step 7: Restart Services
```bash
bun run down
bun run up
```

## Testing

### 1. Test SMTP Service

```bash
# Check SMTP container is running
docker ps | grep smtp

# Check logs
docker logs <smtp-container-id>
```

### 2. Test Go Endpoint

```bash
# Send test email
curl -X POST http://localhost:8081/send-calendar-invite \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@memudo.rent",
    "to": "your-email@gmail.com",
    "subject": "Test Calendar Invite",
    "text": "This is a test",
    "ics_content": "BEGIN:VCALENDAR\nVERSION:2.0\nMETHOD:REQUEST\nBEGIN:VEVENT\nDTSTART:20250115T100000Z\nDTEND:20250115T110000Z\nSUMMARY:Test Event\nEND:VEVENT\nEND:VCALENDAR"
  }'
```

### 3. Test End-to-End

1. Book a slot through the UI
2. Check email inbox (use a real email address)
3. Open the email
4. Click on ICS attachment or "Add to Calendar" button
5. Verify event appears in Google Calendar

### 4. Check Logs

```bash
# App logs
bun run logs:app

# Go service logs
docker compose --file run/development/docker-compose.yml logs -f go

# SMTP logs
docker compose --file run/development/docker-compose.yml logs -f smtp
```

## Troubleshooting

### Emails Not Sending

**Check SMTP container**:
```bash
docker ps | grep smtp
docker logs <smtp-container-id>
```

**Check Go service can reach SMTP**:
```bash
docker compose --file run/development/docker-compose.yml exec go ping smtp
```

### Emails Not Arriving

**For development**: Use a service like MailHog or Mailpit to intercept emails locally instead of sending to real addresses.

**Add mailpit** (optional):
```yaml
mailpit:
  image: axllent/mailpit
  ports:
    - "8025:8025"  # Web UI
    - "1025:1025"  # SMTP
```

Then change `SMTP_HOST=mailpit` and `SMTP_PORT=1025`.

### ICS Not Recognized

**Check MIME type**: Ensure Go service sets:
```
Content-Type: text/calendar; method=REQUEST
```

**Check ICS format**: Use an online ICS validator.

### Database Errors

**Missing user data**:
```sql
-- Verify users have email and name
SELECT id, email, name FROM "user";
```

**Missing property data**:
```sql
-- Verify properties have name and address
SELECT id, name, address FROM property;
```

## Production Considerations

### 1. Email Authentication

For production, configure SMTP relay with authentication:

```yaml
smtp:
  image: namshi/smtp
  environment:
    - SMARTHOST_ADDRESS=smtp.gmail.com
    - SMARTHOST_PORT=587
    - SMARTHOST_USER=${SMTP_USERNAME}
    - SMARTHOST_PASSWORD=${SMTP_PASSWORD}
    - SMARTHOST_ALIASES=*
```

### 2. SPF/DKIM/DMARC

Configure DNS records to prevent emails being marked as spam:
- SPF record
- DKIM signing
- DMARC policy

### 3. Rate Limiting

Add rate limiting to `/send-calendar-invite` endpoint to prevent abuse.

### 4. Email Templates

Consider using HTML email templates instead of plain text.

### 5. Error Handling

Add retry logic for failed email sends.

### 6. Monitoring

Monitor email send success/failure rates.

## Future Enhancements

1. **HTML Emails**: Rich formatted emails with embedded calendar
2. **RSVP Tracking**: Handle RSVP responses from recipients
3. **Reminders**: Send reminder emails before visit
4. **Cancellations**: Send `METHOD:CANCEL` ICS when slot cancelled
5. **Updates**: Send `METHOD:REQUEST` with updated time if changed
6. **Multiple Attendees**: Support multiple visitants per slot
7. **Email Queue**: Use Valkey/Redis for email queue with retries
8. **Webhooks**: Notify host when visitant accepts/declines

## References

- [RFC 5545 - iCalendar](https://datatracker.ietf.org/doc/html/rfc5545)
- [RFC 5546 - iTIP (iCalendar Transport-Independent Interoperability Protocol)](https://datatracker.ietf.org/doc/html/rfc5546)
- [MIME Type for ICS Files](https://www.iana.org/assignments/media-types/text/calendar)
- [ical-generator Documentation](https://github.com/sebbo2002/ical-generator)
- [Go net/smtp Package](https://pkg.go.dev/net/smtp)
- [namshi/smtp Docker Image](https://hub.docker.com/r/namshi/smtp)

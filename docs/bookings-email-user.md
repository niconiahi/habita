# Setting Up Isolated Email for bookings@habita.rent

## Overview

This guide walks you through setting up a **free, isolated email system** for `bookings@habita.rent` without any vendor lock-in or monthly costs.

### What You'll Achieve

- **Isolated account**: Completely separate from your personal `nicolas.accetta@gmail.com`
- **Professional sender**: Emails sent from `bookings@habita.rent`
- **Can receive replies**: Emails to `bookings@habita.rent` forward to dedicated inbox
- **Free forever**: No monthly costs, no vendor lock-in
- **Easy migration**: Can switch to any SMTP provider by changing `.env` only

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  User receives booking confirmation email                       │
│  From: bookings@habita.rent                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│  Gmail SMTP (smtp.gmail.com:587)                                │
│  Authenticates with: habitarent.bookings@gmail.com              │
│  Sends as: bookings@habita.rent                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│  Go Service (run/smtp/smtp.go)                                  │
│  Uses SMTP_USER and SMTP_PASS from .env                         │
└─────────────────────────────────────────────────────────────────┘


If user replies to bookings@habita.rent:
┌─────────────────────────────────────────────────────────────────┐
│  Domain registrar email forwarding                              │
│  bookings@habita.rent → habitarent.bookings@gmail.com           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create Dedicated Gmail Account

### 1.1 Create New Gmail Account

1. **Open incognito/private browser window** (to avoid auto-login to personal account)
2. Go to https://accounts.google.com/signup
3. Choose account details:
   - **First name**: `Habita`
   - **Last name**: `Bookings`
   - **Username**: Choose available name (examples):
     - `habitarent.bookings@gmail.com`
     - `habita.rent.bookings@gmail.com`
     - `bookings.habita.rent@gmail.com`
   - **Password**: Use a strong, unique password (save it in password manager)
4. Complete phone verification
5. Skip recovery email (optional)
6. Accept terms and create account

### 1.2 Enable 2-Factor Authentication

**Why**: Required to generate app passwords for SMTP

1. Go to https://myaccount.google.com/security
2. Under "How you sign in to Google", click **2-Step Verification**
3. Follow prompts to set up 2FA (phone SMS or authenticator app)
4. Complete verification

### 1.3 Generate App Password

**Why**: SMTP authentication requires app password (not account password)

1. Go to https://myaccount.google.com/apppasswords
2. If prompted, sign in again
3. In "Select app" dropdown: Choose **Mail**
4. In "Select device" dropdown: Choose **Other (Custom name)**
5. Enter name: `Habita SMTP Service`
6. Click **Generate**
7. **IMPORTANT**: Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
8. Save this password - you'll use it in `.env` as `SMTP_PASS`

**Example app password**: `abcd efgh ijkl mnop`

---

## Step 2: Set Up Domain Email Forwarding

### 2.1 Locate Your Domain Registrar

Find where you purchased `habita.rent`:
- **Namecheap**: namecheap.com
- **GoDaddy**: godaddy.com
- **Cloudflare**: cloudflare.com
- **Google Domains**: domains.google.com
- **Other**: Check your purchase records

### 2.2 Configure Email Forwarding

Instructions vary by registrar. Here are common ones:

#### Namecheap

1. Log in to Namecheap
2. Go to **Domain List** → Click **Manage** next to `habita.rent`
3. Go to **Advanced DNS** tab
4. Find **Mail Settings** section
5. Select **Email Forwarding**
6. Click **Add Forwarder**
7. Enter:
   - **Alias**: `bookings`
   - **Forward to**: `habitarent.bookings@gmail.com` (or whatever Gmail you created)
8. Click **Add Email Forwarder**
9. Check the Gmail inbox for verification email and confirm

#### Cloudflare

1. Log in to Cloudflare
2. Select `habita.rent` domain
3. Go to **Email** → **Email Routing**
4. Click **Get started** (if first time)
5. Click **Create address**
6. Enter:
   - **Custom address**: `bookings@habita.rent`
   - **Destination**: `habitarent.bookings@gmail.com`
7. Save and verify in Gmail inbox

#### GoDaddy

1. Log in to GoDaddy
2. Go to **My Products**
3. Find `habita.rent` → Click **Email**
4. Click **Manage** next to Email Forwarding
5. Click **Add Forwarder**
6. Enter:
   - **Forward email to**: `bookings`
   - **Forward to email address**: `habitarent.bookings@gmail.com`
7. Save

#### Google Domains

1. Log in to Google Domains
2. Click on `habita.rent`
3. Click **Email** in left menu
4. Under **Email forwarding**, click **Add email alias**
5. Enter:
   - **Alias**: `bookings@habita.rent`
   - **Forward to**: `habitarent.bookings@gmail.com`
6. Save

### 2.3 Verify Email Forwarding

1. Send test email to `bookings@habita.rent` from another account
2. Check `habitarent.bookings@gmail.com` inbox
3. Confirm email arrived

---

## Step 3: Configure Gmail "Send Mail As"

**Why**: Allow Gmail to send emails FROM `bookings@habita.rent` while authenticating with the Gmail account

### 3.1 Add Custom Send Address

1. Log in to `habitarent.bookings@gmail.com` (the new Gmail account)
2. Click **Settings** (gear icon) → **See all settings**
3. Go to **Accounts and Import** tab
4. Under "Send mail as" section, click **Add another email address**
5. In popup window, enter:
   - **Name**: `Habita Bookings` (this will appear as sender name)
   - **Email address**: `bookings@habita.rent`
   - **Uncheck** "Treat as an alias"
6. Click **Next Step**
7. On SMTP settings screen:
   - **SMTP Server**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: `habitarent.bookings@gmail.com` (your Gmail address)
   - **Password**: Use the **app password** from Step 1.3 (NOT your account password)
   - **Select**: "Secured connection using TLS"
8. Click **Add Account**

### 3.2 Verify Custom Send Address

1. Gmail will send verification email to `bookings@habita.rent`
2. Since you set up email forwarding, this email arrives at `habitarent.bookings@gmail.com`
3. Open the verification email in your inbox
4. Click the verification link OR copy the confirmation code
5. If using code: Go back to Gmail Settings → Enter confirmation code
6. Click **Verify**

### 3.3 Set as Default (Optional)

1. In **Accounts and Import** settings
2. Under "Send mail as", find `bookings@habita.rent`
3. Click **make default** next to it
4. Now all emails will be sent from `bookings@habita.rent` by default

---

## Step 4: Update Application Configuration

### 4.1 Edit .env File

Open `/Users/niconiahi/Documents/repos/habita/.env` and update lines 11-12:

**Before:**
```bash
SMTP_USER="nicolas.accetta@gmail.com"
SMTP_PASS="gofn apan mqtc sfyz"
```

**After:**
```bash
SMTP_USER="habitarent.bookings@gmail.com"  # Replace with your actual Gmail
SMTP_PASS="abcd efgh ijkl mnop"            # Replace with app password from Step 1.3
```

**Keep unchanged:**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
```

### 4.2 Update .env.template (Optional but Recommended)

Open `/Users/niconiahi/Documents/repos/habita/.env.template` and update the comment:

```bash
SMTP_HOST=""      # smtp.gmail.com
SMTP_PORT=""      # 587
SMTP_USER=""      # Gmail account used for SMTP (e.g., habitarent.bookings@gmail.com)
SMTP_PASS=""      # App password (NOT account password)
```

---

## Step 5: Restart Services

### 5.1 Restart Docker Services

The Go service needs to reload environment variables:

```bash
# Stop services
docker compose --file run/development/docker-compose.yml down

# Start services
docker compose --file run/development/docker-compose.yml up -d

# Check Go service logs
docker compose --file run/development/docker-compose.yml logs -f go
```

### 5.2 Verify Services Are Running

```bash
docker ps
```

You should see containers running:
- `db`
- `app`
- `valkey`
- `go`
- `caddy`
- `nominatim`

---

## Step 6: Testing

### 6.1 Test Email Sending

**Option A: Via Application UI**

1. Open application in browser
2. Create a test booking that triggers email sending
3. Check recipient's inbox for email
4. Verify sender shows as `bookings@habita.rent`

**Option B: Via Direct API Call**

```bash
curl -X POST http://localhost:8081/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "host": "test-host@example.com",
    "visitant": "your-email@example.com",
    "subject": "Test Booking Confirmation",
    "text": "This is a test email to verify SMTP configuration.",
    "content": "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR"
  }'
```

Replace `your-email@example.com` with your actual email to receive the test.

### 6.2 Test Email Receiving

1. From another email account, send email to `bookings@habita.rent`
2. Check inbox of `habitarent.bookings@gmail.com`
3. Verify email was forwarded successfully

### 6.3 Check Logs

```bash
# Go service logs
docker compose --file run/development/docker-compose.yml logs -f go

# Look for:
# - "Sending email from bookings@habita.rent..."
# - "Email sent successfully to..."
```

---

## Troubleshooting

### Issue: "Failed to authenticate" Error

**Cause**: Incorrect SMTP credentials

**Solutions**:
1. Verify you're using the **app password** (16 characters with spaces), NOT the Gmail account password
2. Verify `SMTP_USER` matches the Gmail account (e.g., `habitarent.bookings@gmail.com`)
3. Check if 2FA is enabled on Gmail account (required for app passwords)
4. Regenerate app password if unsure

### Issue: Emails Not Arriving

**Cause**: Email caught in spam or SMTP send failed

**Solutions**:
1. Check recipient's spam/junk folder
2. Check Go service logs for errors:
   ```bash
   docker compose --file run/development/docker-compose.yml logs go | grep -i error
   ```
3. Verify Gmail "Send mail as" verification was completed
4. Try sending to a different email provider (Gmail might have stricter spam filtering)

### Issue: Email Shows Wrong Sender

**Symptoms**: Emails show from `habitarent.bookings@gmail.com` instead of `bookings@habita.rent`

**Cause**: Gmail "Send mail as" not configured or not set as default

**Solutions**:
1. Verify Step 3 was completed (Gmail "Send mail as" setup)
2. In Gmail Settings → Accounts and Import → Check if `bookings@habita.rent` shows as **verified**
3. Set `bookings@habita.rent` as **default** sender
4. Restart Go service to reload configuration

### Issue: Email Forwarding Not Working

**Symptoms**: Emails sent to `bookings@habita.rent` don't arrive in Gmail

**Cause**: Domain forwarding misconfigured or DNS not propagated

**Solutions**:
1. Verify email forwarding is enabled in domain registrar
2. Check if verification was completed (some registrars require email confirmation)
3. Wait 24-48 hours for DNS propagation (rare but possible)
4. Test with different sender email (some providers block certain senders)
5. Check Gmail spam folder for forwarded emails

### Issue: "SMTP connection failed" Error

**Cause**: Network issues or firewall blocking SMTP port

**Solutions**:
1. Verify Go container can reach Gmail SMTP:
   ```bash
   docker compose --file run/development/docker-compose.yml exec go ping smtp.gmail.com
   ```
2. Check if port 587 is open (some networks block SMTP)
3. Try port 465 instead (SSL/TLS):
   - Update `.env`: `SMTP_PORT="465"`
   - Requires code change in `run/smtp/smtp.go` to use SSL instead of STARTTLS

### Issue: App Password Not Working

**Cause**: 2FA not enabled or wrong password format

**Solutions**:
1. Verify 2FA is enabled: https://myaccount.google.com/security
2. Regenerate app password: https://myaccount.google.com/apppasswords
3. Copy password exactly (remove spaces if .env parsing has issues)
4. Try wrapping password in quotes in .env: `SMTP_PASS="abcdefghijklmnop"`

---

## Security Best Practices

### 1. Protect SMTP Credentials

- **Never commit** `.env` file to git (already in `.gitignore`)
- Store app password in secure password manager
- Rotate app password periodically (every 6-12 months)
- Use different app passwords for different environments (dev/staging/production)

### 2. Email Sending Limits

Gmail has sending limits:
- **Free Gmail**: ~500 emails/day
- **Google Workspace**: ~2,000 emails/day

For higher volume, consider:
- Implementing rate limiting in application
- Queueing emails (using Redis/Valkey)
- Migrating to dedicated SMTP service (SendGrid, Mailgun, AWS SES)

### 3. Monitor Email Activity

Periodically check Gmail account:
1. Log in to `habitarent.bookings@gmail.com`
2. Review **Sent** folder for unexpected emails
3. Check **Security** settings for suspicious activity: https://myaccount.google.com/security
4. Enable alerts for suspicious sign-ins

### 4. SPF/DKIM Records (Optional but Recommended)

To improve email deliverability and prevent spoofing:

Add SPF record to `habita.rent` DNS:
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

This tells receiving servers that Gmail is authorized to send emails on behalf of `habita.rent`.

---

## Migration Path (Future)

If you outgrow Gmail or need better features:

### To SendGrid (example)

1. Sign up for SendGrid
2. Verify `habita.rent` domain ownership
3. Get SMTP credentials from SendGrid
4. Update `.env`:
   ```bash
   SMTP_HOST="smtp.sendgrid.net"
   SMTP_PORT="587"
   SMTP_USER="apikey"
   SMTP_PASS="[sendgrid-api-key]"
   ```
5. Restart services
6. **No code changes needed!**

### To AWS SES (example)

1. Set up AWS SES
2. Verify `habita.rent` domain
3. Generate SMTP credentials
4. Update `.env`:
   ```bash
   SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
   SMTP_PORT="587"
   SMTP_USER="[aws-smtp-username]"
   SMTP_PASS="[aws-smtp-password]"
   ```
5. Restart services

---

## FAQ

### Q: Can I use this setup in production?

**A**: Yes, but be aware of Gmail's sending limits (~500 emails/day). For high-volume production, consider dedicated SMTP services.

### Q: What if I want to receive emails directly (not forward)?

**A**: You'll need either:
1. Google Workspace ($6/month) - create real `bookings@habita.rent` mailbox
2. Self-hosted mail server (complex setup)
3. Email hosting service (Fastmail, ProtonMail, etc.)

### Q: Can I send from multiple addresses (e.g., support@habita.rent)?

**A**: Yes! Repeat Step 2 (email forwarding) and Step 3 (Gmail "Send mail as") for each additional address:
- `support@habita.rent`
- `noreply@habita.rent`
- `hello@habita.rent`

Then update the Go code to use the appropriate "From" address per email type.

### Q: Is this secure?

**A**: Yes, when following best practices:
- App password is separate from account password
- 2FA protects the Gmail account
- SMTP connection uses TLS encryption (port 587)
- `.env` file is not committed to git

### Q: What happens if I lose the app password?

**A**: Regenerate a new one:
1. Go to https://myaccount.google.com/apppasswords
2. Revoke old password (if listed)
3. Generate new password
4. Update `.env` with new password
5. Restart services

---

## Summary

You now have a **free, professional, isolated email system** for `bookings@habita.rent`:

✅ **Sends from**: `bookings@habita.rent` (professional appearance)
✅ **Authenticates with**: Dedicated Gmail account (isolated from personal)
✅ **Receives at**: Dedicated Gmail inbox (via forwarding)
✅ **Costs**: $0/month
✅ **Vendor lock-in**: None (easy to migrate by changing `.env` only)
✅ **Security**: App password + 2FA + TLS encryption

Your application code in `run/smtp/smtp.go` remains unchanged - it already sends from `bookings@habita.rent`. Only the authentication credentials needed updating.

---

## Next Steps

1. Complete Steps 1-4 above
2. Update `.env` file with new credentials
3. Restart services (Step 5)
4. Test email sending (Step 6)
5. Monitor Gmail account periodically
6. Add SPF DNS record (optional but recommended)

For questions or issues, refer to the Troubleshooting section above.

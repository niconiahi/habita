package observability

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

type Logger struct{}

type logEntry struct {
	Timestamp string         `json:"timestamp"`
	Severity  string         `json:"severity"`
	Message   string         `json:"message"`
	TraceID   string         `json:"trace_id,omitempty"`
	SpanID    string         `json:"span_id,omitempty"`
	Fields    map[string]any `json:"fields,omitempty"`
	Error     *errorDetails  `json:"error,omitempty"`
}

type errorDetails struct {
	Message string `json:"message"`
}

func NewLogger() *Logger {
	return &Logger{}
}

func (l *Logger) Info(ctx context.Context, msg string, fields map[string]any) {
	l.log(ctx, "INFO", msg, fields, nil)
}

func (l *Logger) Warn(ctx context.Context, msg string, fields map[string]any) {
	l.log(ctx, "WARN", msg, fields, nil)
}

func (l *Logger) Error(ctx context.Context, msg string, fields map[string]any, err error) {
	// Record exception to span if exists
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	}

	// Log with error details
	l.log(ctx, "ERROR", msg, fields, err)
}

func (l *Logger) log(ctx context.Context, severity, msg string, fields map[string]any, err error) {
	entry := logEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Severity:  severity,
		Message:   msg,
		Fields:    fields,
	}

	// Extract trace context from span
	span := trace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		entry.TraceID = span.SpanContext().TraceID().String()
		entry.SpanID = span.SpanContext().SpanID().String()
	}

	// Add error details if present
	if err != nil {
		entry.Error = &errorDetails{
			Message: err.Error(),
		}
	}

	// Output as JSON to stdout
	jsonBytes, jsonErr := json.Marshal(entry)
	if jsonErr != nil {
		log.Printf("failed to marshal log entry: %v", jsonErr)
		return
	}

	os.Stdout.Write(jsonBytes)
	os.Stdout.Write([]byte("\n"))
}

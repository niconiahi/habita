package observability

import (
	"context"
	"fmt"
	"time"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/log"
	"go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/trace"
)

type Logger struct {
	otelLogger log.Logger
}

func NewLogger() *Logger {
	return &Logger{
		otelLogger: global.GetLoggerProvider().Logger("habita-go"),
	}
}

func (l *Logger) Info(ctx context.Context, msg string, fields map[string]any) {
	l.log(ctx, log.SeverityInfo, msg, fields, nil)
}

func (l *Logger) Warn(ctx context.Context, msg string, fields map[string]any) {
	l.log(ctx, log.SeverityWarn, msg, fields, nil)
}

func (l *Logger) Error(ctx context.Context, msg string, fields map[string]any, err error) {
	// Record exception to span if exists
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	}

	// Log with error details
	l.log(ctx, log.SeverityError, msg, fields, err)
}

func (l *Logger) log(ctx context.Context, severity log.Severity, msg string, fields map[string]any, err error) {
	span := trace.SpanFromContext(ctx)
	spanID := span.SpanContext().SpanID().String()
	traceID := span.SpanContext().TraceID().String()

	// Build attributes
	attrs := []log.KeyValue{
		log.String("trace_id", traceID),
		log.String("span_id", spanID),
		log.String("service", "habita-go"),
	}

	// Add custom fields as attributes
	for k, v := range fields {
		attrs = append(attrs, log.String(k, fmt.Sprintf("%v", v)))
	}

	// Add error details if present
	if err != nil {
		attrs = append(attrs, log.String("error", err.Error()))
	}

	// Create and emit log record
	var record log.Record
	record.SetTimestamp(time.Now())
	record.SetSeverity(severity)
	record.SetBody(log.StringValue(msg))
	record.AddAttributes(attrs...)

	l.otelLogger.Emit(ctx, record)
}

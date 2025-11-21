package observability

import (
	"context"
	"log"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

func InitOTel() *sdktrace.TracerProvider {
	ctx := context.Background()

	// Get environment variables
	otlpEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otlpEndpoint == "" {
		log.Fatal("OTEL_EXPORTER_OTLP_ENDPOINT is not set")
	}

	serviceName := os.Getenv("OTEL_SERVICE_NAME")
	if serviceName == "" {
		serviceName = "habita-go"
	}

	environment := os.Getenv("OTEL_ENVIRONMENT")
	if environment == "" {
		environment = "development"
	}

	// Create resource
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.ServiceVersion("1.0.0"),
			semconv.DeploymentEnvironment(environment),
		),
	)
	if err != nil {
		log.Fatalf("failed to create resource: %v", err)
	}

	// Create OTLP HTTP exporter
	exporter, err := otlptracehttp.New(ctx,
		otlptracehttp.WithEndpoint(otlpEndpoint),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		log.Fatalf("failed to create trace exporter: %v", err)
	}

	// Create tracer provider
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	// Set global tracer provider
	otel.SetTracerProvider(tp)

	// Set global propagator (for extracting traceparent from headers)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	log.Printf("OpenTelemetry initialized: service=%s, environment=%s, endpoint=%s", serviceName, environment, otlpEndpoint)

	return tp
}

package main

import (
	"context"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog"
	pgxzerolog "github.com/jackc/pgx-zerolog"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/tracelog"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/repo/pg"
)

func main() {
	isDev := os.Getenv("DEV") == "true"
	opts := cors.Options{
		AllowedOrigins: []string{
			os.Getenv("URL"),
			os.Getenv("NETLIFY_URL"),
			os.Getenv("NETLIFY_DEPLOY_URL"),
			os.Getenv("NETLIFY_DEPLOY_PRIME_URL"),
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
		},
		Debug: isDev,
	}

	logger := httplog.NewLogger("share", httplog.Options{
		JSON:     !isDev,
		Concise:  true,
		LogLevel: "trace",
		SkipHeaders: []string{
			"cdn-loop",
			"x-nf-site-id",
			"x-nf-client-connection-ip",
			"x-nf-account-id",
			"x-forwarded-proto",
		},
	})

	config, err := pgx.ParseConfig(os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}

	config.DefaultQueryExecMode = pgx.QueryExecModeExec
	config.Tracer = &tracelog.TraceLog{
		LogLevel: tracelog.LogLevelTrace,
		Logger: pgxzerolog.NewLogger(
			logger,
			pgxzerolog.WithoutPGXModule(),
			pgxzerolog.WithContextFunc(func(ctx context.Context, z zerolog.Context) zerolog.Context {
				if requestID, ok := ctx.Value(middleware.RequestIDKey).(string); ok {
					return z.Str("requestID", requestID)
				}

				return z
			}),
		),
	}

	middleware.RequestIDHeader = "x-nf-request-id"

	chain := chi.Chain(
		middleware.RequestID,
		middleware.RealIP,
		httplog.Handler(logger),
		middleware.Recoverer,
		cors.New(opts).Handler,
	)

	handler := chain.Handler(&handler.Handler{
		Records: &pg.Repository{
			Config: config,
		},
	})

	lambda.Start(httpadapter.New(handler).ProxyWithContext)
}

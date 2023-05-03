package main

import (
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/go-chi/httplog"
	"github.com/jackc/pgx/v5"
	"github.com/rs/cors"
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

	log.Println(opts)

	config, err := pgx.ParseConfig(os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}

	config.DefaultQueryExecMode = pgx.QueryExecModeExec

	logger := httplog.Handler(httplog.NewLogger("share", httplog.Options{
		JSON:    !isDev,
		Concise: isDev,
	}))

	cors := cors.New(opts).Handler(logger(&handler.Handler{
		Records: &pg.Repository{
			Config: config,
		},
	}))

	lambda.Start(httpadapter.New(cors).ProxyWithContext)
}

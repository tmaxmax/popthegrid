package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
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
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
		},
		Debug: isDev,
	}

	url := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_HOSTNAME"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_DB"),
		getSSLMode(isDev),
	)
	log.Println(url)

	config, err := pgx.ParseConfig(url)
	if err != nil {
		panic(err)
	}

	cors := cors.New(opts).Handler(&handler.Handler{
		Records: &pg.Repository{
			Config: config,
		},
	})

	lambda.Start(httpadapter.New(cors).ProxyWithContext)
}

func getSSLMode(isDev bool) string {
	if isDev {
		return "disable"
	}
	return "required"
}

package main

import (
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/rs/cors"
	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/repo/memory"
	"github.com/tmaxmax/popthegrid/internal/share"
)

func main() {
	opts := cors.Options{
		AllowedOrigins: []string{
			os.Getenv("URL"),
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
		},

		Debug: os.Getenv("DEV") == "true",
	}

	cors := cors.New(opts).Handler(&handler.Handler{
		Records: &memory.Repository{Data: map[share.Code]share.Record{
			"r4nd0m": {
				Gamemode: "random",
				Data: map[string]any{
					"numWins": 5,
				},
				Theme: "candy",
				When:  time.Now(),
			},
			"t1m3rM": {
				Gamemode: "random-timer",
				Name:     "Michael",
				Data: map[string]any{
					"fastestWinDuration": 5450,
				},
				Theme: "blood",
				When:  time.Now(),
			},
			"s4m3sQ": {
				Gamemode: "same-square",
				Name:     "Hans",
				Data: map[string]any{
					"fastestWinDuration": 6000,
				},
				Theme: "blood",
				When:  time.Now(),
			},
		}},
	})

	lambda.Start(httpadapter.New(cors).ProxyWithContext)
}

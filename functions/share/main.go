package main

import (
	_ "embed"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

//go:embed response.html
var response string

func handler(req events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	// code := req.Path[strings.LastIndex(req.Path, "/")+1:]

	return &events.APIGatewayProxyResponse{
		StatusCode: http.StatusSeeOther,
		Headers: map[string]string{
			"Content-Type": "text/html",
		},
		Body: response,
	}, nil
}

func main() {
	lambda.Start(handler)
}

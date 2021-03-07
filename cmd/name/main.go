package main

import (
	"fmt"
	"net/http"

	"github.com/Pallinder/go-randomdata"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(req events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	return &events.APIGatewayProxyResponse{
		StatusCode: http.StatusOK,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: fmt.Sprintf(`{ name: %q }`, randomdata.SillyName()),
	}, nil
}

func main() {
	lambda.Start(handler)
}

package internal

import (
	"encoding/base64"
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/httplog/v2"
)

type Env struct {
	Port             string
	URL              string
	RecordStorageKey string
	Entrypoint       string
	Database         string
	LogLevel         slog.Level
	HMACSecret       []byte
	SessionExpiry    time.Duration
}

func Getenv() Env {
	return Env{
		Port:             os.Getenv("PORT"),
		URL:              os.Getenv("URL"),
		RecordStorageKey: os.Getenv("VITE_RECORD_STORAGE_KEY"),
		Entrypoint:       os.Getenv("ENTRYPOINT"),
		Database:         os.Getenv("DATABASE"),
		LogLevel:         httplog.LevelByName(os.Getenv("LOG_LEVEL")),
		HMACSecret:       must(base64.StdEncoding.DecodeString(os.Getenv("HMAC_SECRET"))),
		SessionExpiry:    time.Minute * time.Duration(must(strconv.Atoi(os.Getenv("VITE_SESSION_EXPIRY")))),
	}
}

func must[T any](v T, err error) T {
	if err != nil {
		panic(err)
	}

	return v
}

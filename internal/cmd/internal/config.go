package internal

import (
	"log/slog"
	"os"

	"github.com/go-chi/httplog/v2"
)

type Env struct {
	Port             string
	URL              string
	RecordStorageKey string
	Entrypoint       string
	Database         string
	LogLevel         slog.Level
}

func Getenv() Env {
	return Env{
		Port:             os.Getenv("PORT"),
		URL:              os.Getenv("URL"),
		RecordStorageKey: os.Getenv("VITE_RECORD_STORAGE_KEY"),
		Entrypoint:       os.Getenv("ENTRYPOINT"),
		Database:         os.Getenv("DATABASE"),
		LogLevel:         httplog.LevelByName(os.Getenv("LOG_LEVEL")),
	}
}

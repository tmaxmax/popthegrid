package internal

import "os"

type Env struct {
	Port             string
	URL              string
	RecordStorageKey string
}

func Getenv() Env {
	return Env{
		Port:             os.Getenv("PORT"),
		URL:              os.Getenv("URL"),
		RecordStorageKey: os.Getenv("VITE_RECORD_STORAGE_KEY"),
	}
}

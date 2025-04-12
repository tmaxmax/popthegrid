package resources

import (
	"embed"
)

//go:embed all:public/*
var Public embed.FS

//go:embed all:dist/*
var Dist embed.FS

//go:embed all:migrations/*
var Migrations embed.FS

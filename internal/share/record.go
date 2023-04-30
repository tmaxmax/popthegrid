package share

import (
	"errors"
	"fmt"
	"time"
)

type Gamemode string

func (g Gamemode) Validate() error {
	switch g {
	case GamemodeRandom, GamemodeRandomTimer, GamemodeSameSquare, GamemodePassthrough:
		return nil
	default:
		return fmt.Errorf("invalid gamemode %q", g)
	}
}

func (g *Gamemode) UnmarshalJSON(data []byte) error {
	return unmarshalEnum(data, g)
}

const (
	GamemodeRandom      Gamemode = "random"
	GamemodeRandomTimer Gamemode = "random-timer"
	GamemodeSameSquare  Gamemode = "same-square"
	GamemodePassthrough Gamemode = "passthrough"
)

type Theme string

func (t Theme) Validate() error {
	switch t {
	case ThemeBlood, ThemeCandy, ThemeNoir, ThemeCozy:
		return nil
	default:
		return fmt.Errorf("invalid theme %q", t)
	}
}

func (t *Theme) UnmarshalJSON(data []byte) error {
	return unmarshalEnum(data, t)
}

const (
	ThemeCandy Theme = "candy"
	ThemeBlood Theme = "blood"
	ThemeNoir  Theme = "noir"
	ThemeCozy  Theme = "cozy"
)

type Record struct {
	Gamemode Gamemode       `json:"gamemode"`
	Theme    Theme          `json:"theme"`
	Name     string         `json:"name,omitempty"`
	When     time.Time      `json:"when"`
	Data     map[string]any `json:"data"`
}

func (r *Record) Validate() error {
	if r.When.IsZero() {
		return errors.New("record time must be provided")
	}

	if len(r.Data) == 0 {
		return errors.New("data must be provided")
	}

	return nil
}

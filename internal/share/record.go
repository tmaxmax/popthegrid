package share

import (
	"errors"
	"fmt"
	"strings"
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

func (g Gamemode) Description() string {
	switch g {
	case GamemodeRandom:
		return "win more than me."
	case GamemodeRandomTimer:
		return "beat me on time."
	case GamemodeSameSquare:
		return "destroy faster the same squares."
	case GamemodePassthrough:
		return "be faster than me."
	default:
		panic(fmt.Errorf("unknown gamemode %q", g))
	}
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

type RecordData struct {
	// random gamemode.
	NumWins int `json:"numWins,omitempty"`
	// In milliseconds; random-timer, same-square, passthrough gamemodes.
	FastestWinDuration float64 `json:"fastestWinDuration,omitempty"`
}

type Record struct {
	Gamemode Gamemode   `json:"gamemode"`
	Theme    Theme      `json:"theme"`
	Name     string     `json:"name,omitempty"`
	When     time.Time  `json:"when"`
	Data     RecordData `json:"data"`
}

func (r *Record) Validate() error {
	if r.When.IsZero() {
		return errors.New("record time must be provided")
	}

	if r.Data == (RecordData{}) {
		return errors.New("data must be provided")
	}

	return nil
}

func (r *Record) Description() string {
	name := r.Name
	if name == "" {
		name = "your friend"
	}

	root := fmt.Sprintf("You're in %s world:", makePossessive(name))

	switch r.Gamemode {
	case GamemodeRandom:
		numWins := r.Data.NumWins
		return fmt.Sprintf("%s can you win more? They won %d %s.", root, numWins, makePlural("time", numWins))
	case GamemodeRandomTimer:
		return fmt.Sprintf("%s be quicker! They won in %s.", root, formatDuration(r.Data.FastestWinDuration))
	case GamemodeSameSquare:
		return fmt.Sprintf("%s zerstöre schneller die gleichen Karos! They did it in %s.", root, formatDuration(r.Data.FastestWinDuration))
	case GamemodePassthrough:
		return fmt.Sprintf("%s do you have the FFITW? Beat %s to win!", root, formatDuration(r.Data.FastestWinDuration))
	default:
		panic(fmt.Errorf("unknown gamemode %q", r.Gamemode))
	}
}

func formatDuration(ms float64) string {
	dur := time.Duration(ms) * time.Millisecond
	if dur > time.Second {
		dur = dur.Round(time.Second / 100)
	}

	return dur.String()
}

func makePossessive(s string) string {
	if strings.HasSuffix(s, "s") || strings.HasSuffix(s, "z") {
		return s + "'"
	}

	return s + "'s"
}

func makePlural(s string, count int) string {
	if count > 1 {
		return s + "s"
	}

	return s
}

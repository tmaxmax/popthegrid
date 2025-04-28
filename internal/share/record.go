package share

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/attempt"
)

type RecordData struct {
	// random gamemode.
	NumWins int `json:"numWins,omitempty"`
	// In milliseconds; odd-one-out, same-square, passthrough gamemodes.
	FastestWinDuration float64 `json:"fastestWinDuration,omitempty"`
}

type Record struct {
	Gamemode  attempt.Gamemode `json:"gamemode"`
	Theme     attempt.Theme    `json:"theme"`
	Name      string           `json:"name,omitempty"`
	When      time.Time        `json:"when"`
	Data      RecordData       `json:"data"`
	AttemptID uuid.NullUUID    `json:"attemptID,omitzero"`
}

func (r *Record) Validate() error {
	if r.Data == (RecordData{}) {
		return errors.New("data must be provided")
	}

	hasInfo := r.Gamemode != "" && !r.When.IsZero()

	if r.AttemptID.Valid && hasInfo {
		return errors.New("can't provide both attempt ID and record info")
	} else if !r.AttemptID.Valid && !hasInfo {
		return errors.New("record info incomplete or not provided")
	}

	if err := r.Theme.Validate(); err != nil {
		return fmt.Errorf("invalid theme: %w", err)
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
	case attempt.GamemodeRandom:
		numWins := r.Data.NumWins
		return fmt.Sprintf("%s can you win more? They won %d %s.", root, numWins, makePlural("time", numWins))
	case attempt.GamemodeSameSquare:
		return fmt.Sprintf("%s zerstöre schneller die gleichen Karos! They did it in %s.", root, formatDuration(r.Data.FastestWinDuration))
	case attempt.GamemodePassthrough:
		return fmt.Sprintf("%s do you have the FFITW? Beat %s to win!", root, formatDuration(r.Data.FastestWinDuration))
	case attempt.GamemodeOddOneOut:
		return fmt.Sprintf("%s can you spot the odd square quicker? Finish in under %s to win!", root, formatDuration(r.Data.FastestWinDuration))
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

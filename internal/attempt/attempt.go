package attempt

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/tmaxmax/popthegrid/internal/handler/session"
)

type Kind string

const (
	Win   Kind = "WIN"
	Lose  Kind = "LOSE"
	Reset Kind = "RESET"
)

func (k *Kind) UnmarshalJSON(data []byte) error {
	if string(data) == "true" {
		*k = Win
	} else if string(data) == "false" {
		*k = Lose
	} else {
		if err := json.Unmarshal(data, (*string)(k)); err != nil {
			return err
		}

		switch *k {
		case Win, Lose, Reset:
		default:
			return fmt.Errorf("invalid attempt kind %q", *k)
		}
	}

	return nil
}

type Verification string

const (
	VerificationPending Verification = "PENDING"
	VerificationValid   Verification = "VALID"
	VerificationInvalid Verification = "INVALID"
	VerificationUnknown Verification = "UNKNOWN"
)

type Gamemode string

func (g Gamemode) Validate() error {
	switch g {
	case GamemodeRandom, GamemodeSameSquare, GamemodePassthrough, GamemodeOddOneOut:
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
	case GamemodeSameSquare:
		return "destroy faster the same squares."
	case GamemodePassthrough:
		return "be faster than me."
	case GamemodeOddOneOut:
		return "spot the odd one out faster."
	default:
		panic(fmt.Errorf("unknown gamemode %q", g))
	}
}

const (
	GamemodeRandom      Gamemode = "random"
	GamemodeSameSquare  Gamemode = "same-square"
	GamemodePassthrough Gamemode = "passthrough"
	GamemodeOddOneOut   Gamemode = "odd-one-out"
)

type Theme string

func (t Theme) Validate() error {
	switch t {
	case ThemeBlood, ThemeCandy, ThemeNoir, ThemeCozy, ThemeIris:
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
	ThemeIris  Theme = "iris"
)

type RandState struct {
	session.Rand
	Offset uint32 `json:"off"`
}

type Attempt struct {
	Gamemode   Gamemode  `json:"gamemode"`
	StartedAt  time.Time `json:"startedAt"`
	DurationMs float64   `json:"duration"`
	Kind       Kind      `json:"isWin"`
	NumSquares int       `json:"numSquares"`
	RandState  RandState `json:"randState"`
}

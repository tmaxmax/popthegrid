package trace

import (
	"encoding/json"
	"fmt"
	"time"
)

type GameEvent interface {
	Event
	isGameEvent()
}

type Square struct {
	Color string `json:"color"`
	Row   int    `json:"row"`
	Col   int    `json:"col"`
}

type GameEventRemoveSquare struct {
	pointerEvent      *PointerEvent
	Square            Square        `json:"square"`
	PointerEventIndex int           `json:"pointerEventIndex"`
	T                 time.Duration `json:"-"`
}

func (GameEventRemoveSquare) isEvent()                      {}
func (GameEventRemoveSquare) isGameEvent()                  {}
func (g GameEventRemoveSquare) Time() time.Duration         { return g.T }
func (g GameEventRemoveSquare) PointerEvent() *PointerEvent { return g.pointerEvent }

type Animation string

const (
	AnimationNone  Animation = "none"
	AnimationShort Animation = "short"
	AnimationLong  Animation = "long"
)

func (a *Animation) UnmarshalJSON(b []byte) error {
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}

	switch Animation(s) {
	case AnimationLong, AnimationShort, AnimationNone:
		*a = Animation(s)
	default:
		return fmt.Errorf("unknown animation %q", s)
	}

	return nil
}

type GameEventPrepare struct {
	Animation Animation     `json:"animation"`
	T         time.Duration `json:"-"`
}

func (GameEventPrepare) isEvent()              {}
func (GameEventPrepare) isGameEvent()          {}
func (g GameEventPrepare) Time() time.Duration { return g.T }

type GameEventForceEnd struct {
	CanRestart bool          `json:"canRestart,omitzero"`
	T          time.Duration `json:"-"`
}

func (GameEventForceEnd) isEvent()              {}
func (GameEventForceEnd) isGameEvent()          {}
func (g GameEventForceEnd) Time() time.Duration { return g.T }

type GameEventPause struct {
	Token string        `json:"pause"`
	T     time.Duration `json:"-"`
}

func (GameEventPause) isEvent()              {}
func (GameEventPause) isGameEvent()          {}
func (g GameEventPause) Time() time.Duration { return g.T }

type GameEventResume struct {
	Token string        `json:"pause"`
	T     time.Duration `json:"-"`
}

func (GameEventResume) isEvent()              {}
func (GameEventResume) isGameEvent()          {}
func (g GameEventResume) Time() time.Duration { return g.T }

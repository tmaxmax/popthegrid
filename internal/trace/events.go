package trace

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/tmaxmax/popthegrid/internal/attempt"
)

type Event interface {
	Time() time.Duration
	isEvent()
}

type Events []Event

func (e *Events) UnmarshalJSON(b []byte) error {
	var bases []struct {
		Type string    `json:"type"`
		Time Timestamp `json:"time"`
	}

	if err := json.Unmarshal(b, &bases); err != nil {
		return fmt.Errorf("base: %w", err)
	}

	dec := json.NewDecoder(bytes.NewReader(b))
	// get rid of initial [ to decode all contained objects individually
	// error checking is unnecessary as the previous json.Unmarshal call succeeded,
	// which means the input is a valid JSON array of objects.
	_, _ = dec.Token()

	var hasViewport, hasOrientationChange, hasGridResize, hasTheme, hasRemoveSquare bool

	events := make([]Event, len(bases))
	for i, b := range bases {
		var err error
		switch b.Type {
		case "prepare":
			ev := GameEventPrepare{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "forceEnd":
			ev := GameEventForceEnd{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "pause":
			ev := GameEventPause{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "resume":
			ev := GameEventResume{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "removeSquare":
			hasRemoveSquare = true
			ev := GameEventRemoveSquare{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "viewport":
			hasViewport = true
			ev := EventViewport{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "orientationChange":
			hasOrientationChange = true
			ev := EventOrientationChange{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "gridResize":
			hasGridResize = true
			ev := EventGridResize{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		case "theme":
			hasTheme = true
			ev := EventTheme{T: time.Duration(b.Time)}
			err = dec.Decode(&ev)
			events[i] = ev
		default:
			return fmt.Errorf("unknown event type %q", b.Type)
		}
		if err != nil {
			return fmt.Errorf("decode element: %w", err)
		}
	}

	if !hasViewport || !hasOrientationChange || !hasGridResize || !hasTheme || !hasRemoveSquare {
		return errors.New("missing key events")
	}

	*e = events

	return nil
}

type Viewport struct {
	Size   XY[float64] `json:"size"`
	Offset XY[float64] `json:"off"`
	Scale  float64     `json:"scale"`
}

type EventViewport struct {
	Viewport `json:"data"`
	T        time.Duration `json:"-"`
}

func (EventViewport) isEvent()              {}
func (e EventViewport) Time() time.Duration { return e.T }

type Orientation struct {
	Type  string  `json:"type"`
	Angle float64 `json:"angle"`
}

type EventOrientationChange struct {
	Orientation `json:"data"`
	T           time.Duration `json:"-"`
}

func (e EventOrientationChange) isEvent()            {}
func (e EventOrientationChange) Time() time.Duration { return e.T }

type GridResizeData struct {
	Anchor     XY[float64] `json:"anchor"`
	SideLength float64     `json:"sideLength"`
	Cols       int         `json:"cols"`
	NumSquares int         `json:"numSquares"`
}

type EventGridResize struct {
	GridResizeData `json:"data"`
	WindowSize     XY[float64]   `json:"windowSize"`
	T              time.Duration `json:"-"`
}

func (EventGridResize) isEvent()              {}
func (e EventGridResize) Time() time.Duration { return e.T }

type EventTheme struct {
	Name attempt.Theme `json:"name"`
	T    time.Duration `json:"-"`
}

func (EventTheme) isEvent()              {}
func (e EventTheme) Time() time.Duration { return e.T }

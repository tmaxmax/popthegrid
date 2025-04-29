package trace

import (
	"encoding/json"
	"errors"
)

type Metadata struct {
	MaxTouchPoints int             `json:"maxTouchPoints"`
	PrimaryPointer PointerMetadata `json:"primaryPointer"`
	AnyPointer     PointerMetadata `json:"anyPointer"`
}

type PointerMetadata int

const (
	PointerStylus PointerMetadata = iota
	PointerMouse
	PointerTouch
	PointerJoystick
)

func (p *PointerMetadata) UnmarshalJSON(b []byte) error {
	var v int
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}

	if v < int(PointerStylus) || v > int(PointerJoystick) {
		return errors.New("invalid pointer metadata")
	}

	*p = PointerMetadata(v)

	return nil
}

func (p PointerMetadata) String() string {
	switch p {
	case PointerStylus:
		return "stylus"
	case PointerMouse:
		return "mouse"
	case PointerTouch:
		return "touch"
	case PointerJoystick:
		return "joystick"
	default:
		return ""
	}
}

package trace

import (
	"encoding/binary"
	"time"
)

type Pointer struct {
	Type    string      `json:"type"`
	Size    XY[float64] `json:"size"`
	Primary bool        `json:"primary"`
	Move    bool        `json:"move"`
}

type PointerEvent struct {
	PointerIndex int
	Position     XY[uint16]
	T            time.Duration
	pointer      *Pointer
}

func (PointerEvent) isEvent()              {}
func (p PointerEvent) Time() time.Duration { return p.T }
func (p PointerEvent) Pointer() *Pointer   { return p.pointer }

func (p *PointerEvent) parse(b []byte, prevT time.Duration) {
	enc := binary.LittleEndian

	p.PointerIndex = int(b[0])

	p.Position.X = enc.Uint16(b[1:])
	p.Position.Y = enc.Uint16(b[3:])

	delta := enc.Uint32(b[5:])
	p.T = prevT + time.Duration(delta*5)*time.Microsecond
}

func parsePointerEvents(payload []byte, firstT time.Duration) []PointerEvent {
	events := make([]PointerEvent, len(payload)/9)
	for i := range events {
		events[i].parse(payload[9*i:], firstT)
		firstT = events[i].T
	}
	return events
}

package trace

import (
	"bytes"
	"compress/gzip"
	"database/sql/driver"
	"encoding/gob"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"time"
)

type Trace struct {
	Metadata          Metadata       `json:"metadata"`
	Events            Events         `json:"events"`
	Pointers          []Pointer      `json:"pointers"`
	TimeOrigin        Timestamp      `json:"timeOrigin"`
	FirstPointerEvent Timestamp      `json:"firstPointerEventTime"`
	PointerEvents     []PointerEvent `json:"-"`
}

func (t *Trace) SetPointerEvents(payload []byte) error {
	if len(payload)%9 != 0 {
		return errors.New("broken pointer events payload")
	}

	t.PointerEvents = parsePointerEvents(payload, time.Duration(t.FirstPointerEvent))

	return t.setPointers()
}

func (t *Trace) Compress(w io.Writer) error {
	gw := gzip.NewWriter(w)
	defer gw.Close()

	return gob.NewEncoder(gw).Encode(t)
}

func (t *Trace) Decompress(r io.Reader) error {
	gr, err := gzip.NewReader(r)
	if err != nil {
		return err
	}
	defer gr.Close()

	if err := gob.NewDecoder(gr).Decode(t); err != nil {
		return err
	}

	return t.setPointers()
}

func (t *Trace) setPointers() error {
	for i := range t.PointerEvents {
		pi := t.PointerEvents[i].PointerIndex
		if pi < 0 || pi >= len(t.Pointers) {
			return fmt.Errorf("pointer %d does not exist", pi)
		}

		t.PointerEvents[i].pointer = &t.Pointers[pi]
	}

	for i, e := range t.Events {
		if rs, ok := e.(GameEventRemoveSquare); ok {
			pi := rs.PointerEventIndex
			if pi < 0 || pi >= len(t.PointerEvents) {
				return fmt.Errorf("pointer event %d does not exist", rs.PointerEventIndex)
			}

			rs.pointerEvent = &t.PointerEvents[pi]
			t.Events[i] = rs
		}
	}

	return nil
}

func (t *Trace) Value() (driver.Value, error) {
	buf := bytes.Buffer{}
	err := t.Compress(&buf)
	return buf.Bytes(), err
}

func (t *Trace) Scan(src any) error {
	buf, ok := src.([]byte)
	if !ok {
		return fmt.Errorf("unsupported source type %T", src)
	}

	return t.Decompress(bytes.NewReader(buf))
}

func (t *Trace) UnmarshalJSON(b []byte) error {
	type trace Trace
	if err := json.Unmarshal(b, (*trace)(t)); err != nil {
		return err
	}

	if t.FirstPointerEvent <= 0 || t.TimeOrigin <= 0 || len(t.Pointers) < 1 {
		return errors.New("trace incomplete")
	}

	return nil
}

type Timestamp time.Duration

func (t *Timestamp) UnmarshalJSON(b []byte) error {
	var v float64
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}

	*t = Timestamp(time.Duration(v * float64(time.Millisecond)))

	return nil
}

type XY[T any] struct {
	X, Y T
}

func (x *XY[T]) UnmarshalJSON(b []byte) error {
	var coords [2]T
	if err := json.Unmarshal(b, &coords); err != nil {
		return err
	}

	x.X = coords[0]
	x.Y = coords[1]

	return nil
}

func init() {
	gob.Register(EventTheme{})
	gob.Register(EventViewport{})
	gob.Register(EventOrientationChange{})
	gob.Register(EventGridResize{})
	gob.Register(GameEventForceEnd{})
	gob.Register(GameEventPause{})
	gob.Register(GameEventResume{})
	gob.Register(GameEventRemoveSquare{})
	gob.Register(GameEventPrepare{})
	gob.Register(PointerEvent{})
}

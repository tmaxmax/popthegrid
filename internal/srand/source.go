package srand

import (
	_ "embed"
	"encoding/binary"
	"math/bits"
)

func Uint64(cnt, key uint64) uint64 {
	x := cnt * key
	y := x
	z := y + key

	x = x*x + y
	x = bits.RotateLeft64(x, -32)
	x = x*x + z
	x = bits.RotateLeft64(x, -32)
	x = x*x + y
	x = bits.RotateLeft64(x, -32)

	t := x*x + z
	x = bits.RotateLeft64(t, -32)

	return t ^ ((x*x + y) >> 32)
}

type Source struct {
	Cnt, Key uint64
}

func (s *Source) Uint64() uint64 {
	v := Uint64(s.Cnt, s.Key)
	s.Cnt++
	return v
}

//go:embed keys.bin
var data []byte

func NumKeys() int {
	return len(data) / 8
}

func Key(i int) uint64 {
	return binary.LittleEndian.Uint64(data[8*i:])
}

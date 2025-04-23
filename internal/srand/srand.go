package srand

import (
	_ "embed"
	"math/bits"
	"math/rand/v2"
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

func Float64(cnt, key uint64) float64 {
	v := Uint64(cnt, key)
	return float64(v<<11>>11) / (1 << 53)
}

type Source struct {
	Cnt, Key uint64
}

func (s *Source) Uint64() uint64 {
	v := Uint64(s.Cnt, s.Key)
	s.Cnt++
	return v
}

func (s *Source) Float64() float64 {
	v := Float64(s.Cnt, s.Key)
	s.Cnt++
	return v
}

func Key() uint64 {
	key := rand.Uint64N(8)*2 + 1
	seenFirst := uint16(1 << key)

	for pos, seen := 60, uint16(0); pos > 0; {
		n := rand.Uint64()
		for i := 0; i < 64; i += 4 {
			digit := (n >> i) & 0xf
			if digit != 0 && (seen&(1<<digit) == 0) {
				seen |= (1 << digit)
				key |= (digit << pos)
				pos -= 4
				if pos == 24 || pos == 28 {
					seen = (1 << digit) | seenFirst
				}
				if pos == 0 {
					break
				}
			}
		}
	}

	return key
}

package session

import (
	"math/rand/v2"

	"github.com/tmaxmax/popthegrid/internal/srand"
)

type Rand struct {
	Mask uint32    `json:"mask"`
	Key  [2]uint32 `json:"key"`
}

func newRand() Rand {
	hi, lo := split(srand.Key(rand.N(srand.NumKeys())))

	return Rand{
		Mask: rand.Uint32(),
		Key:  [2]uint32{hi, lo},
	}
}

func (r Rand) Source(off uint32) *srand.Source {
	return &srand.Source{
		Cnt: unsplit(r.Mask, off),
		Key: unsplit(r.Key[0], r.Key[1]),
	}
}

func split(n uint64) (hi, lo uint32) {
	return uint32(n >> 32), uint32(n)
}

func unsplit(hi, lo uint32) uint64 {
	return (uint64(hi) << 32) | uint64(lo)
}

package session

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"math/rand/v2"

	"github.com/tmaxmax/popthegrid/internal/srand"
)

type Rand struct {
	Mask uint32    `json:"mask"`
	Key  [2]uint32 `json:"key"`
}

func NewRand() Rand {
	hi, lo := split(srand.Key())

	return Rand{
		Mask: rand.Uint32(),
		Key:  [2]uint32{hi, lo},
	}
}

func (r Rand) IsZero() bool { return r == (Rand{}) }

func (r Rand) Source(off uint32) *srand.Source {
	return &srand.Source{
		Cnt: unsplit(r.Mask, off),
		Key: unsplit(r.Key[0], r.Key[1]),
	}
}

func (r Rand) signature(key []byte) []byte {
	h := hmac.New(sha256.New, key)

	var buf [4]byte

	binary.LittleEndian.PutUint32(buf[:], r.Mask)
	h.Write(buf[:])
	binary.LittleEndian.PutUint32(buf[:], r.Key[0])
	h.Write(buf[:])
	binary.LittleEndian.PutUint32(buf[:], r.Key[1])
	h.Write(buf[:])

	return h.Sum(nil)
}

func (r Rand) Signature(key []byte) string {
	return base64.StdEncoding.EncodeToString(r.signature(key))
}

func (r Rand) Match(signature string, key []byte) bool {
	dec, err := base64.StdEncoding.DecodeString(signature)
	return err == nil && hmac.Equal(dec, r.signature(key))
}

func split(n uint64) (hi, lo uint32) {
	return uint32(n >> 32), uint32(n)
}

func unsplit(hi, lo uint32) uint64 {
	return (uint64(hi) << 32) | uint64(lo)
}

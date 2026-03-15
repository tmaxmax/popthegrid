package sessionrand

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"math/rand/v2"
	"time"

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

type Signature struct {
	ExpMs     int64  `json:"exp"`
	Signature string `json:"signature"`
}

func Sign(r Rand, exp time.Time, key []byte) Signature {
	ms := exp.UnixMilli()
	return Signature{
		ExpMs:     ms,
		Signature: base64.StdEncoding.EncodeToString(sign(r, ms, key)),
	}
}

func sign(r Rand, ms int64, key []byte) []byte {
	h := hmac.New(sha256.New, key)

	var buf [8]byte

	binary.LittleEndian.PutUint32(buf[:], r.Mask)
	h.Write(buf[:])
	binary.LittleEndian.PutUint32(buf[:], r.Key[0])
	h.Write(buf[:])
	binary.LittleEndian.PutUint32(buf[:], r.Key[1])
	h.Write(buf[:])

	binary.LittleEndian.PutUint64(buf[:], uint64(ms))
	h.Write(buf[:])

	return h.Sum(nil)
}

func Verify(r Rand, s Signature, key []byte, now time.Time) bool {
	dec, err := base64.StdEncoding.DecodeString(s.Signature)
	return err == nil && hmac.Equal(dec, sign(r, s.ExpMs, key)) && time.UnixMilli(s.ExpMs).After(now)
}

func split(n uint64) (hi, lo uint32) {
	return uint32(n >> 32), uint32(n)
}

func unsplit(hi, lo uint32) uint64 {
	return (uint64(hi) << 32) | uint64(lo)
}

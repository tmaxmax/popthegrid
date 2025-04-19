package session

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/gob"
	"net/http"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/crypto/macval"
)

type Payload struct {
	ID   uuid.UUID
	Exp  time.Time
	Rand Rand
}

var idReplacer = strings.NewReplacer("-", "", "_", "")

func (s Payload) id() string {
	v := base64.RawURLEncoding.EncodeToString(s.ID[:])
	return idReplacer.Replace(v)
}

func (s Payload) cookie(secret []byte) *http.Cookie {
	val, _ := macval.To(s, macval.Options{Algorithm: sha256.New, Key: secret})

	return &http.Cookie{
		Name:     cookieName,
		Value:    val,
		Expires:  s.Exp,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
}

type payload Payload

func (s Payload) MarshalBinary() ([]byte, error) {
	var b byteWriter
	err := gob.NewEncoder(&b).Encode(payload(s))
	return b, err
}

func (s *Payload) UnmarshalBinary(data []byte) error {
	return gob.NewDecoder(bytes.NewReader(data)).Decode((*payload)(s))
}

type byteWriter []byte

func (b *byteWriter) Write(s []byte) (int, error) {
	*b = append(*b, s...)
	return len(s), nil
}

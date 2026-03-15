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

type Session struct {
	ID        uuid.UUID
	CreatedAt time.Time
	Expiry    time.Duration
}

type expiryMs struct {
	FetchedAt int64 `json:"fetchedAt"`
	FetchNext int64 `json:"fetchNext"`
}

var idReplacer = strings.NewReplacer("-", "", "_", "")

func (s Session) id() string {
	v := base64.RawURLEncoding.EncodeToString(s.ID[:])
	return idReplacer.Replace(v)
}

func (s Session) cookie(secret []byte) *http.Cookie {
	val, _ := macval.To(s, macval.Options{Algorithm: sha256.New, Key: secret})

	return &http.Cookie{
		Name:     cookieName,
		Value:    val,
		MaxAge:   int(s.Expiry.Seconds()),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
}

func (s Session) expiry() expiryMs {
	return expiryMs{
		FetchedAt: s.CreatedAt.UnixMilli(),
		FetchNext: max(s.Expiry-2*time.Minute, s.Expiry/2).Milliseconds(),
	}
}

type binarySession Session

func (s Session) MarshalBinary() ([]byte, error) {
	var b byteWriter
	err := gob.NewEncoder(&b).Encode(binarySession(s))
	return b, err
}

func (s *Session) UnmarshalBinary(data []byte) error {
	return gob.NewDecoder(bytes.NewReader(data)).Decode((*binarySession)(s))
}

type byteWriter []byte

func (b *byteWriter) Write(s []byte) (int, error) {
	*b = append(*b, s...)
	return len(s), nil
}

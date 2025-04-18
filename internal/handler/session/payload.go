package session

import (
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/crypto/macval"
)

type Payload struct {
	ID  uuid.UUID
	Exp time.Time
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

func (s Payload) MarshalBinary() ([]byte, error) {
	return s.Exp.AppendBinary(slices.Clone(s.ID[:]))
}

func (s *Payload) UnmarshalBinary(data []byte) error {
	if len(data) < uuid.Size {
		return errors.New("invalid session payload")
	}

	return errors.Join(
		s.ID.UnmarshalBinary(data[:uuid.Size]),
		s.Exp.UnmarshalBinary(data[uuid.Size:]),
	)
}

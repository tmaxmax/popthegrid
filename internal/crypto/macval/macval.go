package macval

import (
	"crypto/hmac"
	"encoding"
	"encoding/base64"
	"errors"
	"hash"
	"strings"
)

type Options struct {
	Algorithm func() hash.Hash
	Key       []byte
}

func (o Options) hmac() hash.Hash {
	return hmac.New(o.Algorithm, o.Key)
}

var Invalid = errors.New("invalid signed value")

var enc = base64.RawURLEncoding

func From(input string, opts Options, output encoding.BinaryUnmarshaler) error {
	dataSer, signatureSer, ok := strings.Cut(input, ".")
	if !ok {
		return Invalid
	}

	data, derr := enc.DecodeString(dataSer)
	signature, serr := enc.DecodeString(signatureSer)

	if derr != nil || serr != nil {
		return errors.Join(Invalid, derr, serr)
	}

	h := opts.hmac()
	h.Write(data)

	if hmac.Equal(h.Sum(nil), signature) {
		return output.UnmarshalBinary(data)
	}

	return Invalid
}

func To(input encoding.BinaryMarshaler, opts Options) (string, error) {
	b, err := input.MarshalBinary()
	if err != nil {
		return "", err
	}

	h := opts.hmac()
	h.Write(b)

	signature := enc.EncodeToString(h.Sum(nil))
	data := enc.EncodeToString(b)

	return data + "." + signature, nil
}

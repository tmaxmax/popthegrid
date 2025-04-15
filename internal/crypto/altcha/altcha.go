// MIT License
//
// Copyright (c) 2023 Daniel Regeci
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Package altcha implements creation & verification mechanisms
// for simple Proof of Work tests.
//
// Code from https://github.com/altcha-org/altcha-lib-go.
package altcha

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"hash"
	"io"
	"math/big"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type Algorithm string

const (
	SHA1   Algorithm = "SHA-1"
	SHA256 Algorithm = "SHA-256"
	SHA512 Algorithm = "SHA-512"
)

func (a Algorithm) get() hash.Hash {
	switch a {
	case SHA1:
		return sha1.New()
	case SHA256:
		return sha256.New()
	case SHA512:
		return sha512.New()
	default:
		return nil
	}
}

func (a Algorithm) Validate() error {
	if a.get() == nil {
		return fmt.Errorf("unsupported algorithm %q", a)
	}

	return nil
}

type ChallengeOptions struct {
	Algorithm  Algorithm
	MaxNumber  int64
	SaltLength int
	HMACKey    []byte
	Salt       string
	Number     int64
	Expires    *time.Time
	Params     url.Values
}

type Challenge struct {
	Algorithm Algorithm `json:"algorithm"`
	Challenge string    `json:"challenge"`
	MaxNumber int64     `json:"maxNumber"`
	Salt      string    `json:"salt"`
	Signature string    `json:"signature"`
}

type Payload struct {
	Algorithm Algorithm     `json:"algorithm"`
	Challenge string        `json:"challenge"`
	Number    int64         `json:"number"`
	Salt      string        `json:"salt"`
	Signature string        `json:"signature"`
	Took      time.Duration `json:"took"`
}

func CreateChallenge(options ChallengeOptions) Challenge {
	maxNumber := options.MaxNumber
	saltLength := options.SaltLength

	if options.Params == nil {
		options.Params = url.Values{}
	}

	params := options.Params
	if options.Expires != nil {
		params.Set("expires", fmt.Sprintf("%d", options.Expires.Unix()))
	}

	salt := options.Salt
	if len(salt) == 0 {
		saltBytes := make([]byte, saltLength)
		rand.Read(saltBytes)
		salt = hex.EncodeToString(saltBytes)
	}

	if len(params) > 0 {
		salt = salt + "?" + params.Encode()
	}

	number := options.Number
	if number == 0 {
		n, _ := rand.Int(rand.Reader, big.NewInt(maxNumber+1))
		number = n.Int64()
	}

	h := options.Algorithm.get()
	io.WriteString(h, salt)
	io.WriteString(h, strconv.FormatInt(number, 10))
	challenge := hex.EncodeToString(h.Sum(nil))

	h = hmac.New(options.Algorithm.get, options.HMACKey)
	io.WriteString(h, challenge)
	signature := hex.EncodeToString(h.Sum(nil))

	return Challenge{
		Algorithm: options.Algorithm,
		Challenge: challenge,
		MaxNumber: maxNumber,
		Salt:      salt,
		Signature: signature,
	}
}

func VerifySolution(payload Payload, hmacKey []byte, checkExpires bool) bool {
	params := extractParams(payload)
	expires := params.Get("expires")
	if checkExpires {
		expireTime, _ := strconv.ParseInt(expires, 10, 64)
		if time.Now().Unix() > expireTime {
			return false
		}
	}

	challengeOptions := ChallengeOptions{
		Algorithm: Algorithm(payload.Algorithm),
		HMACKey:   hmacKey,
		Number:    payload.Number,
		Salt:      payload.Salt,
	}
	expectedChallenge := CreateChallenge(challengeOptions)

	return expectedChallenge.Challenge == payload.Challenge && expectedChallenge.Signature == payload.Signature
}

// Extracts parameters from the payload
func extractParams(payload Payload) url.Values {
	splitSalt := strings.Split(payload.Salt, "?")
	if len(splitSalt) > 1 {
		params, _ := url.ParseQuery(splitSalt[1])
		return params
	}
	return url.Values{}
}

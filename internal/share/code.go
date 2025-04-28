package share

import (
	"errors"
	"fmt"
	"math/rand/v2"
	"strings"
)

type Code string

func (c Code) Validate() error {
	if len(c) != codeLength {
		return fmt.Errorf("code length is %q, must be %q", len(c), codeLength)
	}

	for i := range c {
		if strings.IndexByte(chars, c[i]) == -1 {
			return errors.New("code contains invalid characters")
		}
	}

	return nil
}

const (
	codeLength    = 6
	chars         = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	letterIdxBits = 6
	letterIdxMask = 1<<letterIdxBits - 1
	letterIdxMax  = 63 / letterIdxBits
)

func NewCode() Code {
	var sb strings.Builder
	sb.Grow(codeLength)

	for i, cache, remain := codeLength-1, rand.Int64(), letterIdxMax; i >= 0; {
		if remain == 0 {
			cache, remain = rand.Int64(), letterIdxMax
		}
		if idx := int(cache & letterIdxMask); idx < len(chars) {
			sb.WriteByte(chars[idx])
			i--
		}
		cache >>= letterIdxBits
		remain--
	}

	return Code(sb.String())
}

// Copyright (c) 2012-2017  Dustin Sallings <dustin@spy.net>
// Copyright (c) 2012-2017  Damian Gryski <damian@gryski.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// <http://www.opensource.org/licenses/mit-license.php>

// Package sketch implements a count-min sketch which has its internal state
// editable from outside also by means of direct access.
// Code based on github.com/dustin/go-probably.
package sketch

import (
	"hash/fnv"
	"iter"
	"math"
	"slices"
)

type Sketch struct {
	c    []uint32
	w, d int
}

func New(epsilon, delta float64) *Sketch {
	w := int(math.Ceil(math.E / epsilon))
	d := int(math.Ceil(math.Log(1 / delta)))

	return &Sketch{c: make([]uint32, w*d), w: w, d: d}
}

func hashn(s []byte) (h1, h2 uint32) {
	fnv1a := fnv.New32a()
	fnv1a.Write([]byte(s))
	h1 = fnv1a.Sum32()

	h2 = uint32(0)
	for _, c := range s {
		h2 += uint32(c)
		h2 += h2 << 10
		h2 ^= h2 >> 6
	}
	h2 += (h2 << 3)
	h2 ^= (h2 >> 11)
	h2 += (h2 << 15)

	return h1, h2
}

func (s *Sketch) Reset() {
	clear(s.c)
}

func (s *Sketch) Clone() *Sketch {
	return &Sketch{c: slices.Clone(s.c), w: s.w, d: s.d}
}

func (s *Sketch) At(id, iw int) uint32 {
	return s.c[id*s.w+iw]
}

func (s *Sketch) SetAt(id, iw int, value uint32) {
	s.c[id*s.w+iw] = value
}

func (s *Sketch) Add(h []byte, delta uint32) {
	h1, h2 := hashn(h)
	for i := range s.d {
		pos := int((h1 + uint32(i)*h2) % uint32(s.w))
		v := Add(s.At(i, pos), delta)
		s.SetAt(i, pos, v)
	}
}

func (s *Sketch) Count(h []byte) uint32 {
	val := uint32(math.MaxUint32)
	h1, h2 := hashn(h)
	for i := range s.d {
		pos := int((h1 + uint32(i)*h2) % uint32(s.w))
		val = min(s.At(i, pos), val)
	}
	return val
}

func (s *Sketch) All() iter.Seq2[int, int] {
	return func(yield func(int, int) bool) {
		for i := range s.d {
			for w := range s.w {
				if !yield(i, w) {
					return
				}
			}
		}
	}
}

func Add(a, b uint32) uint32 {
	res := a + b
	if res < a {
		res = math.MaxUint32
	}
	return res
}

func Sub(a, b uint32) uint32 {
	res := a - b
	if res > a {
		res = 0
	}
	return res
}

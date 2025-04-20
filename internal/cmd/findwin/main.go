package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"iter"
	"math"
	"math/rand/v2"
	"os"
	"runtime"
	"sync"

	"github.com/tmaxmax/popthegrid/internal/srand"
)

func main() {
	var src srand.Source
	var mystery string
	var gleich, take int
	var masks int

	f := flag.NewFlagSet("findwin", flag.ContinueOnError)
	f.Uint64Var(&src.Key, "key", srand.Key(0), "the Squares RNG key to use")
	f.Uint64Var(&src.Cnt, "cnt", 0, "the counter to start at")
	f.IntVar(&take, "take", 100, "number of matching starting counters to output")
	f.IntVar(&masks, "masks", 0, "cycle through multiple random counter masks (if provided cnt is 0)")

	f.IntVar(&gleich, "gleich", 0, "search for trivial Gleich games (grid of given number of colours or less)")
	f.StringVar(&mystery, "mystery", "", "search for winning Mystery games ('all' for all possible games, 'encountered' for actual real wins only)")

	if err := f.Parse(os.Args[1:]); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			os.Exit(0)
		}

		os.Exit(1)
	}

	if src.Cnt == 0 && masks > 0 {
		src.Cnt = uint64(rand.Uint32()) << 32
	}

	if masks < 1 {
		masks = 1
	}

	for range masks {
		json.NewEncoder(os.Stdout).Encode(sourceToConfig(&src))

		if mystery != "" {
			var res iter.Seq[uint64]

			switch mystery {
			case "all":
				res = searchMystery(&src)
			case "encountered":
				res = searchMysteryEncountered(&src)
			}

			if take > 0 {
				for cnt := range Take(res, take) {
					PrintfSync("%d ", cnt<<32>>32)
				}
			} else {
				fmt.Printf("%d winning games", Count(res))
			}
		} else if gleich > 0 {
			for res := range Take(searchGleich(&src, gleich), take) {
				PrintfSync("%d+%d ", res.Cnt<<32>>32, res.NumColors)
			}
		} else {
			fmt.Fprintf(os.Stderr, "must specify a gamemode\n")
			os.Exit(1)
		}

		src.Cnt = uint64(rand.Uint32()) << 32
		fmt.Print("\n\n")
	}
}

const numColors = 5
const numSquares = 48

func searchMystery(src *srand.Source) iter.Seq[uint64] {
	return parallel(src, func(src *srand.Source, limit uint32, yield func(uint64) bool) {
		rng := rand.New(src)

		for inRange(src.Cnt+numSquares-1, limit) {
			cnt := src.Cnt

			if playMystery(rng) && !yield(cnt) {
				return
			}

			src.Cnt = cnt + 1
		}
	})
}

func searchMysteryEncountered(src *srand.Source) iter.Seq[uint64] {
	return parallel(src, func(src *srand.Source, limit uint32, yield func(uint64) bool) {
		rng := rand.New(src)

		for inRange(src.Cnt+2*numSquares-1, limit) {
			cnt := src.Cnt

			// Build board
			src.Cnt += numSquares

			if playMystery(rng) && !yield(cnt) {
				return
			}
		}
	})
}

func playMystery(rng *rand.Rand) (won bool) {
	for i := range numSquares - 1 {
		remaining := numSquares - i - 1
		if remaining > 1 && intn(rng.Float64(), remaining+1) == remaining {
			return false
		}
	}

	return true
}

type gleichResult struct {
	Cnt       uint64
	NumColors int
}

func searchGleich(src *srand.Source, maxColors int) iter.Seq[gleichResult] {
	return parallel(src, func(src *srand.Source, limit uint32, yield func(gleichResult) bool) {
		rng := rand.New(src)

		lastColor := -1
		res := gleichResult{NumColors: 1, Cnt: src.Cnt}

		for inRange(src.Cnt, limit) {
			color := intn(rng.Float64(), numColors)
			if color != lastColor {
				res.NumColors++
				if res.NumColors > maxColors {
					res.Cnt = src.Cnt
					res.NumColors = 1
				}
			} else if src.Cnt-res.Cnt+1 == numSquares && !yield(res) {
				return
			}
		}
	})
}

func intn(f float64, n int) int {
	return int(math.Floor(f * float64(n)))
}

func inRange(cnt uint64, limit uint32) bool {
	return cnt <= ((cnt>>32)<<32)|uint64(limit)
}

func parallel[T any](src *srand.Source, task func(src *srand.Source, limit uint32, yield func(T) bool)) iter.Seq[T] {
	procs := runtime.GOMAXPROCS(0)
	if procs == 1 {
		return func(yield func(T) bool) {
			task(src, math.MaxUint32, yield)
		}
	}

	return func(yield func(T) bool) {
		offset := uint64(uint32(src.Cnt))
		domain := math.MaxUint32 + 1 - offset
		workload := domain / uint64(procs)
		rest := int(domain % uint64(procs))

		var wg sync.WaitGroup
		wg.Add(procs)

		out := make(chan T, procs)
		stop := make(chan struct{})

		go func() {
			for t := range out {
				if !yield(t) {
					close(stop)
					break
				}
			}
		}()

		for i := range procs {
			comp, compPrev := 0, 0
			if i < rest {
				comp = 1
			}
			if i > 0 && i-1 < rest {
				compPrev = 1
			}

			start := offset + uint64(i)*workload + uint64(compPrev)
			limit := uint32(start + workload + uint64(comp) - 1)
			cnt := ((src.Cnt>>32)<<32 | start)
			procSrc := srand.Source{Cnt: cnt, Key: src.Key}

			go func() {
				defer wg.Done()
				task(&procSrc, limit, func(t T) bool {
					select {
					case out <- t:
						return true
					case <-stop:
						return false
					}
				})
			}()
		}

		wg.Wait()
		close(out)
	}
}

func sourceToConfig(src *srand.Source) map[string]any {
	keya, keyb := uint32(src.Key>>32), uint32(src.Key)

	return map[string]any{
		"key":  []uint32{keya, keyb},
		"mask": uint32(src.Cnt >> 32),
	}
}

func Take[T any](seq iter.Seq[T], n int) iter.Seq[T] {
	return func(yield func(T) bool) {
		i := 0
		for t := range seq {
			if i == n || (i < n && !yield(t)) {
				break
			}
			i++
		}
	}
}

func Count[T any](seq iter.Seq[T]) int {
	n := 0
	for range seq {
		n++
	}
	return n
}

func PrintfSync(f string, args ...any) {
	fmt.Printf(f, args...)
	os.Stdout.Sync()
}

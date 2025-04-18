package main

import (
	"fmt"
	"math"
	"net/http"
	"net/netip"
	"sync"
	"time"

	"github.com/tmaxmax/popthegrid/internal/crypto/altcha/sketch"
)

// ClientTracker manages clients and adjusts D_c
type ClientTracker struct {
	reqs   *sketch.Sketch
	dcs    *sketch.Sketch
	mutex  sync.Mutex
	decay  uint32        // Threshold for linear/exponential growth
	window time.Duration // Time window for difficulty updates (e.g., 10 seconds)
}

func NewClientTracker(decay uint32, window time.Duration) *ClientTracker {
	reqs := sketch.New(0.00007, 0.001)

	ct := &ClientTracker{
		reqs:   reqs,
		dcs:    reqs.Clone(),
		decay:  decay,
		window: window,
	}
	go ct.startDecayCycle()
	return ct
}

// Adjust counters every time window
func (ct *ClientTracker) startDecayCycle() {
	ticker := time.NewTicker(ct.window)
	for now := range ticker.C {
		ct.mutex.Lock()

		for id, iw := range ct.reqs.All() {
			reqs := ct.reqs.At(id, iw)
			dcs := ct.dcs.At(id, iw)
			if reqs <= ct.decay {
				ct.dcs.SetAt(id, iw, sketch.Add(dcs, reqs)-ct.decay)
			} else {
				v := uint32(min(math.Pow(1.01, float64(reqs-ct.decay)), float64(math.MaxUint32)))
				ct.dcs.SetAt(id, iw, sketch.Add(dcs, v))
			}
		}

		ct.reqs.Reset()
		fmt.Println(time.Since(now))

		ct.mutex.Unlock()
	}
}

// Get current difficulty for a client
func (ct *ClientTracker) GetDifficulty(ip []byte) int {
	ct.mutex.Lock()
	defer ct.mutex.Unlock()

	ct.reqs.Add(ip, 1)

	return 200000 + int(ct.dcs.Count(ip))
}

// HTTP handler example
func main() {
	ct := NewClientTracker(
		5,              // decay = 5 requests/window
		10*time.Second, // 10-second windows
	)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Get client IP (simplified)
		ip := netip.MustParseAddrPort(r.RemoteAddr).Addr()
		h, _ := ip.MarshalBinary()

		// Register request and get difficulty
		dc := ct.GetDifficulty(h)

		// Simulate proof-of-work requirement
		fmt.Fprintf(w, "IP: %s\nDifficulty (D_c): %df\n", ip, dc)
	})

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}

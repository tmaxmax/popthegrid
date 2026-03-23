# Pop the grid!

A game with zero players and a simple premise: pop all the squares from a randomly generated grid.

## Gameplay

In a _game_ the player must pop all (at the time of writing 48) squares in said generated _grid_ as dictated by the _gamemode_:

- **Mystery** (in code `mystery`): the player does not know the rules, grid may break any time. We do know the rules, or, more precisely, the PRNG does.
- **FFITW** (`passthrough`): Fastest Fingers In The World, there are no restrictions. The entire purpose is to pop everything as quickly as possible.
- **Gleich** (`same-square`): From "same" in German, the player must pop all squares in `n` contiguous sequences of same-colored squares, where `n` is the number of colors in the grid. (at the time of writing, `n` is fixed to 5). Game is lost if a sequence is not maximal.
- **Odd One Out** (`odd-one-out`): It is guaranteed that one square exists which has a color no other square has. This square must be popped. After one square is popped, the grid is recolored to restore the invariant. Repeat until empty.

The _theme_ of the game, which sets the colors of the squares, sets the aesthetic and, for the latter two gamemodes, can change the difficulty.

A _random function_ decides the color of each square. It is important to note that for the gamemodes Gleich and Odd One Out, the colors change gameplay, not just the aesthetic.

Each _attempt_ is timed and stored. Players can then see various _statistics_ about their games: how many times they've played, won, lost; what were their shortest attempts, or their _records_.

Players can share their records with friends by creating _share links_, a permanent link which, when opened, puts the game in a special mode where each attempt's time is compared with the record attempt one is playing against.

## Tech

What follows is an overview of the technical decision which build up this software.

The section acts as documentation for future me to not have to relearn everything from the code every time I return to
the project.

Words highlighted in _italic_ (including those before this section) denote the language that is consistently used to refer to the corresponding entities and concepts, including throughout code.

### Stack

The game is served by a Go server as an SPA coded partly in vanilla Javascript (the gameplay itself), partly in Svelte (the config & statistics menu). Plain modern CSS is used for styling. IndexedDB stores all attempts of the player. The Go binary embeds and serves all static assets and Vite bundled code. Deployed on a Hetzner Cloud Server via a GitHub action through SSH. Nginx sits in front of this binary for HTTPS and rate limiting. An SQLite database file alongside the Go binary stores data about share links and attempts. The PRNG function is compiled to WebAssembly from the AssemblyScript code.

### Grid

The [_grid_](src/components/Grid.ts) is comprised of a div containing a bunch of divs representing squares, all of which are styled according to the theme employed based on CSS variables. The parent div is styled such that its dimensions are fixed.

Each game starts with a fixed number of 48 _squares_ (this may change in the future). This raises the problem: how do you fill the container with 48 squares such that the most area possible is filled while not overflowing?

6 years ago I stole the solution from [this StackExchange thread](https://math.stackexchange.com/questions/466198/). In the meantime my knowledge of mathematics has developed. I've authored [this document](doc/filling-the-grid.pdf) to properly explain how the problem is solved and prove that it works.

### Game

The _game_ itself is implemented as a _state_ machine, to be able to control interactions with the grid in a structured manner. _From_ a state _to_ another a _transition_ takes place; handlers can be attached to these two phases of the transition. _Events_ may trigger state changes.

The states themselves are:
- `Initial`: when the page is opened or when a player finished a game. In this state the grid is always empty.
- `Ready`: grid is filled with squares as the gamemode requires, ready to play.
- `Ongoing`: a game is in progress, the attempt stopwatch is running, the player is actively removing squares.
- `Paused`: the user left the tab or opened the settings menu while in an ongoing game
- `Over`: a special state in which the grid is destroy and no new game can be started. This is reached only when the IndexedDB changes version, as the page needs to be refreshed.

The events which may trigger transitions are:
- `prepare`: from `Initial` to `Ready`, the transition entails filling the grid with squares for a new game. This is triggered automatically by the code.
- `removeSquare`: from `Ready` to `Ongoing` and from `Ongoing` to `Initial` when according to the gamemode the game is won or lost. Can otherwise only be dispatched on an `Ongoing` game. Triggers when the player taps a square in the grid.
- `pause`/`resume`: from `Ongoing` to `Paused` and back. Triggers either on browser's `visibilitychange` event or when the player opens the settings menu.
- `forceEnd`: from `Ongoing` to `Initial`, when the user resets the game by clicking/tapping outside of the grid, or to `Over` if it carries a special flag (when the database version changes). 

The game advances with each `removeSquare` by applying the rules of the gamemode. Gamemodes can be always changed; if a gamemode change is requested while a game is `Ongoing` it scheduled for when the game returns to `Initial`.

A detail on `pause` and `resume`. Both events carry a unique token: for the game to be resumed, the `resume` event must match the token with which the first `pause` event was dispatched. This is to prevent the following scenario: player opens configuration (game is paused), leaves the tab and then returns; without this system, the game is resumed when the player returns and not when the configuration menu is closed.

On transitions various handlers are attached: for timing the attempt, for tracing the player's activity, for synchronizing game state to the Svelte reactive storage layer, for submitting attempts with traces (discussed below) to the server, for saving attempts to IndexedDB.

The IndexedDB data is used to compute simple statistics about the game (number of wins, shortest attempts). It is also used to save server issued IDs of verified attempts and cache share links (both discussed below). Attention is paid to sync state across concurrently open tabs of the game.

### Attempt verification 

Since the game depends heavily on random number generation, the default `Math.random()` is not used. Instead, a WebAssembly implementation of [SquaresRNG](doc/squares-rng.pdf) is shipped. It is a counter-based PRNG: it does not have internal state and its output depends only on two parameters, a 64-bit input key and a 64-bit counter. The main advantage of this is that it enables attempt validation on the server through the following mechanism:

1. Server sends starting input parameters, the key and the first 32 bits of the counter, together with an HMAC signature.
  - The counter's top bits are masked to reduce the chance that two players ever play with the same key to basically zero; since there are "only" ~2b quality keys, at only 45k players the chance of collision is 50%. Of course, since there are zero players, the chance of collisions is zero, but it is fun to think about it.
2. Client submits attempt with a _trace_ of user's gameplay, the random function's state at the beginning of the game and the HMAC signature.
3. Server checks signature matches the random function state (without the counter offset, so with the counter set only to the initial upper 32 bits) and then replays the trace against the random function according to the gamemode's rules to verify that the attempt is possible.

A trace is comprised of relevant information about the browser state and the device (viewport size, zoom level, available pointers etc.) and pointer events (clicks and movements) during the game. Of course, traces can be forged, but since mathematics can't the forge space is reduced to "barely possible" attempts only. 

The purpose of such a verification would be not so much to prevent cheating (perhaps the uninteresting kind of cheating like replacing `Math.random` with a constant) but to ensure only quality games reach the server. Playing with a suboptimal random function may result in games which are too easy or too boring.

Note that right now only the signature check is implemented; for an example of how games can be reproduced, check the [findwin](internal/cmd/findwin/main.go) utility, which I used to search through various keys for winning **Mystery** games or very easy **Gleich** games (e.g. a color missing or half the squares having the same color).

As a fun fact, after brute-forching my way through a dozen of keys I could not find games missing a color or with more than 15 identically colored squares. With this very rigorous test, I confirm that the RNG does indeed have the uniformity they claim!

This choice of RNG could also simplify implementation of features like multiplayer gamemodes, since it could remove the need to sharing part of the game's state.

### Share links

Players can challenge each other to beat their record attempts by sending unique links identifying their attempts. When a player opens a share link, the game is put in a special mode where a the time of each attempt is compared to the record attempt's time they play against, signalling a win only when the time is beaten.

Share links should only be created for verified attempts. All attempts are submitted and verified as described above; for each valid attempt, the server issues an ID (a V4 UUID, nothing fancy). When creating a share link, the server issued share ID is submitted so that the server data of a verified attempt is used.

Do note that since full verification is not currently implemented, by "verified" links it is meant all links. IN SQLite a verification status of `PENDING` is stored.

The URL itself has a code appened, which is comprised of 6 random characters from the range `[0-9a-zA-Z]`. This gives a 50% percent collision change at 280k links; since the length can be increased at any time (and the game has zero players), the shorter, the better.

The HTML of these share links has all `meta` tags necessary so the links look nice when included in varios messaging and social media apps.

### Security

This is a server that receives unauthenticated requests, so something must be done to prevent at least some level of spam. There are two application layer measures implemented for this purpose (and zero measures at other levels because I have not taken the time to accrue much beyond basic knowledge of networking): proof-of-work tests and rate limiting.

In order to submit any requests to the servers, clients must acquire a session identifier first. To get this session ID, a proof-of-work protected endpoint must be queried with a valid solution to a challenge provided by the server. Then, under a strict rate limit imposed on the session ID, the client can submit attempts or send create share links.

The session identifier expires after three hours, to require proof-of-work more often in case someone is hoarding session IDs and to enable the rate limiter to free memory more often to track new sessions. 

The default difficulty is calibrated such that it takes around 200ms on my M1 Pro CPU. To prevent a malicious client from retrieving a lot of sessions, a count-min sketch is used to track a time-windowed request count by IP, based on which the PoW challenge difficulty is increased. The difficulty decreases back very slowly, since there is no reason to query the sessions endpoint very often.

This system is implemented based on the model presented in [this research paper](doc/mod-kapow.pdf). I have not tested that it works, so the configuration parameters are based purely on faulty, inexperienced intuition. Plus, my poor 6$ VPS won't withstand a DDoS by definition. Not that I'm worried about, since the game has zero players, but it's fun to think about it.

## Future development

This section should be either in the "Issues" section or in personal notes but I'll dump it into README, might delete later.

It's also mostly aspirational given the time constraints, and, as  my interests shift with the inexorable passing of time, perhaps not even that.

### Bugs 

- sometimes the game stays stuck in the `prepare` transition for too long (perhaps a stuck API request?)
- sometimes links are not cached on creation and when subsequently requesting a share link on the client a request is sent to the server which returns an "already created" error
- statistics table container should handle overflow of the statistics table, not the _entire configuration menu_ (when did this break?)

### Design

Credits to my designer friend.

- Separate Menu/Settings button with conventional icon since most people don't realize configuration exists (and that they can change gamemodes, see statistics etc.). Very important!!!!
- Make buttons look like buttons: box shadow, different background etc.
- One hand interaction might cover status, interaction area is above, user won't be able ot pay attention.
- Make state changes explicit: show for longer, in more obvious way that user won/lost.
- Change welcome text to win/lose (so it is in player's purview, not at the bottom), remove status indicator from bottom. This also makes status display redundant, since all statuses beyond win and lose can be inferred by simply looking at the grid.
- Footer with more interactions and information as needed (e.g. for leaving a share link, time of last attempt)
- "Share with friends" button instead of just icon
- Order information presented for last attempt by importance (win/lost first; time second; gamemode third; when it was played last)
- Use a design for theme/gamemode which takes up less vertical space (carousel picker? grid?).
- Icons for gamemodes.
- Less text, more design. Design is storytelling; what story do you tell? Progressive revealing of features.

### P2P multiplayer

WebRTC seems cool. Must come up with gamemodes for that. And also have time. Lots of time.

### Players

Never.

## Story

At some point at the end of 2020 I wanted to build a music radio website. This radio was supposed to have a grid of squares in the background reacting to the music – I was interested in exploring the Web Audio API and designing something more technically involved than just CSS.

The entire thing pivoted when I added a click event listener on the prototype grid which removed the square targeted by the click. I was hooked. I then adjusted animations and timings so every click feels just right and the rest is history.

The application evolved beyond a simple grid in spring of 2023. As part of the final high school year I was required to build an application of choice which featured a "separate" database. Getting clearance that continuing an existing project is fine, I added multiple gamemodes, expanded the application to store every attempt and compute gameplay statistics, but since IndexedDB wasn't "separate" enough I implemented sharing games through short URLs stored in a serverless PostgreSQL.

It was a great success, for some definition of "great": full grade, a few classmates obsessed with hacking it (mostly disabling animations, autoclickers, calling the API directly; the most interesting one was exploiting the fact that I wasn't checking `event.isTrusted` on square clicks to write Javascript to finish everything in zero seconds) and some $10 lost on bets (I foolishly believed no one could break it all in under 5 seconds under someone reminded me that 10-point multitouch exists).

In the spring of 2025 I decided I must revisit it again to study how I could mitigate issues like API abuse or cheating. I have also simplified deployment, moving it from a hip but needlessly complex Netlify (w/ Deno edge functions) + NeonDB serverless stack to a simple Go and SQLite server.

In the spring of 2026 I wrote some documentation so I don't forget what I've coded.

See you next spring!

# Pop the grid!

A game with zero players and a simple premise: pop all the squares from a randomly generated grid.

## Gameplay

In a _game_ the player must pop all (at the time of writing 48) squares in said generated _grid_ as dictated by the _gamemode_:

- **Mystery** (in code `mystery`): the player does not know the rules, grid may break any time. We do know the rules, or, more precisely, the PRNG does.
- **FFITW** (`passthrough`): Fastest Fingers In The World, there are no restrictions. The entire purpose is to pop everything as quickly as possible.
- **Gleich** (`same-square`): From "same" in German, the player must pop all squares in `n` contiguous sequences of same-colored squares, where `n` is the number of colors in the grid. (at the time of writing, `n` is fixed to 5). Game is lost if a sequence is not maximal.
- **Odd One Out** (`odd-one-out`): It is guaranteed that one square exists which has a color no other square has. This square must be popped. After one square is popped, the grid is recolored to restore the invariant. Repeat until empty.

The _theme_ of the game, which sets the colors of the squares, sets the aesthetic and, for the latter two gamemodes, can change the difficulty.

A PRNG decides the color of each square. It is important to note that for the gamemodes Gleich and Odd One Out, the colors change gameplay, not just the aesthetic.

Each _attempt_ is timed and stored. Players can then see various _statistics_ about their games: how many times they've played, won, lost; what were their shortest attempts, or their _records_.

Players can share their records with friends by creating _share links_, a permanent link which, when opened, puts the game in a special mode where each attempt's time is compared with the record attempt one is playing against.

## Tech

What follows is an overview of the technical decision which build up this software.

### Stack

The game is served by a Go server as an SPA coded partly in vanilla Javascript (the gameplay itself), partly in Svelte (the config & statistics menu). Plain modern CSS is used for styling. IndexedDB stores all attempts of the player. The Go binary embeds and serves all static assets and Vite bundled code. Deployed on a Hetzner Cloud Server via a GitHub action through SSH. Nginx sits in front of this binary for HTTPS and rate limiting. An SQLite database file alongside the Go binary stores data about share links and attempts. The PRNG function is compiled to WebAssembly from the AssemblyScript code.

### Grid

The [grid](src/components/Grid.ts) is comprised of a div containing a bunch of divs representing squares, all of which are styled according to the theme employed based on CSS variables. The parent div is styled such that its dimensions are fixed.

This container is filled with $`n \in \N`$ squares positioned in a grid-like fashion. The squares should cover as much of the $`w \times h \in \R`$ container area as possible without overflowing, which means we must maximize the side length $`S \in \R`$ of the square. In other words, we are searching an $`a \times b`$ grid which fits all our $`n`$ squares and itself fits in the container while either being as wide or as tall as the container.

We can state the problem in a formal manner as follows:

$$S = \max \Set{s \in \R | \exists a, b \in \N \thickspace . \thickspace n \leq ab \land ((as = w \land bs \leq h) \lor (bs = h \land as \leq w)) } $$

Let's start solving for a solution $`s_a`$ that gives a grid as wide as the container. For any $`s \in \R`$ from the set of possile solutions:

$$\begin{align*}n \leq ab \land as = w \land bs \leq h &\implies n \leq \frac{w}{s}b \land bs \leq h \\ &\implies n \leq \frac{w}{s} \cdotp \frac{h}{s} \\ &\implies n \leq \frac{wh}{s^2} \\ &\implies s \leq \sqrt{\frac{wh}{n}} \tag{1} \end{align*}$$

This is an upper bound on the side length. Let's determine the grid's number of columns, $`a`$:

$$\begin{align*} as = w \implies &a = \frac{w}{s} \\ \overset{(1)}{\implies} &a \geq \frac{w}{\sqrt{\frac{wh}{n}}} \\ \implies &a \geq \sqrt{\frac{w}{h}n} \\ (s \text{ maximized} \land a \in \N) \implies &a = \lceil \sqrt{\frac{w}{h}n} \rceil \tag{2} \end{align*}$$

To further clarify the last step: since $`s`$ is in the denominator, maximizing it means $`a`$ must take the smallest value greater than or equal to RHS. Since $`a \in \N`$ this is precisely RHS rounded up.

Knowing $`a`$ we can now determine the side length $`s`$:

$$\begin{equation}\tag{3} as = w \implies s = \frac{w}{a} \end{equation}$$

Since the implications in $`(1)`$ go in one direction only, we must check that $`s`$ generates a grid which fits all n squares and doesn't overflow the container. Formally:

$$\begin{equation}\tag{4} n \leq \lfloor \frac{w}{s} \rfloor \cdotp \lfloor \frac{h}{s} \rfloor \end{equation}$$

The floored division of the dimensions with the side length provide the number of squares the grid _should_ have on each dimension, if it fits the squares and doesn't overflow. Moreover, $`as = w \implies a = w/s = \lfloor w/s \rfloor`$, since $`a \in \N`$.

Let's go to our initial assumptions.

$$\begin{equation}\tag{5} n \leq ab \land bs \leq h \implies n \leq a \frac{h}{s} \\ \implies \underbrace{n \leq a \lfloor \frac{h}{s} \rfloor}_{\text{(i)}} \lor \underbrace{(n > a \lfloor \frac{h}{s} \rfloor \land n \leq a \frac{h}{s})}_{\text{(ii)}} \end{equation}$$

In case $`(i)`$ we can take $`b = \lfloor h/s \rfloor`$, so $`s`$ as determined above is a solution. But in case $`(ii)`$, $`b = \lfloor h/s \rfloor \implies n > ab`$, contradicting the initial assumption. A distinct solution $`s'`$ must be found.

Let's analyze what follows from $`(ii)`$:

$$\begin{align*} a \lfloor \frac{h}{s} \rfloor < n \leq a \frac{h}{s} \implies &\lfloor \frac{h}{s} \rfloor < \frac{h}{s} \land n \leq a \frac{h}{s} \\ \implies &\frac{h}{s} < \lceil \frac{h}{s} \rceil \land n \leq a \frac{h}{s} \\ \implies &n < a \lceil \frac{h}{s} \rceil \tag{6} \end{align*}$$

This means $`b = \lceil h/s \rceil`$ is a safe choice for the $`a`$ that we've determined, and a candidate for $`s'`$ is:

$$\begin{equation} \tag{7} s' = \frac{h}{b} = \frac{h}{\lceil \frac{h}{s} \rceil} \overset{(3)}{=} \frac{h}{\lceil \frac{h}{w}a \rceil} \end{equation}$$

Is $`s'`$ in the solution space? Yes. $`(6) \implies n \leq ab`$, $`(7) \implies bs' = h`$ and

$$\begin{equation} \tag{8} as' = \frac{ah}{\lceil \frac{h}{w}a \rceil} = \frac{ah}{\lceil \frac{ah}{w} \rceil} \overset{\lceil x \rceil \geq x}{\implies} as' \leq \frac{ah}{\frac{ah}{w}} \implies as' \leq w \end{equation}$$

With that we have determined $`s_a`$. Here's its formula based only on inputs $`w, h \in \R, n \in \N`$

$$\begin{gather*} a = \lceil \sqrt{\frac{w}{h}n} \rceil \qquad s_a \begin{cases} \frac{w}{a} &\text{if } n \leq a \lfloor \frac{h}{w}a \rfloor \\ \frac{h}{\lceil \frac{h}{w}a \rceil} &\text{otherwise} \end{cases} \end{gather*}$$

Analoguously goes the process for determining $`s_b`$, whose formula is:

$$\begin{gather*} b = \lceil \sqrt{\frac{h}{w}n} \rceil \qquad s_b \begin{cases} \frac{h}{a} &\text{if } n \leq b \lfloor \frac{w}{h}b \rfloor \\ \frac{w}{\lceil \frac{w}{h}b \rceil} &\text{otherwise} \end{cases} \end{gather*}$$

Finally, $`S = \max \Set{s_a, s_b}`$. Though is it maximal? It seems like not always. For example, for $`w = 10, h = 2, n = 8`$, $`S = 1.25`$ but this algorithm gives $`S = 1`$. Under which conditions this happens is left as an exercise for the reader (I haven't thought about it yet).

In practice this is a simple constant time computation which gives a grid that empirically always covers the biggest area possible without overflowing. So we don't care. This is how Pop the grid! fills the grid.

### Game

### Share links

### Security

## Story

At some point at the end of 2020 I wanted to build a music radio website. This radio was supposed to have a grid of squares in the background reacting to the music – I was interested in exploring the Web Audio API and designing something more technically involved than just CSS.

The entire thing pivoted when I added a click event listener on the prototype grid which removed the square targeted by the click. I was hooked. I then adjusted animations and timings so every click feels just right and the rest is history.

The application evolved beyond a simple grid in spring of 2023. As part of the final high school year I was required to build an application of choice which featured a "separate" database. Getting clearance that continuing an existing project is fine, I added multiple gamemodes, expanded the application to store every attempt and compute gameplay statistics, but since IndexedDB wasn't "separate" enough I implemented sharing games through short URLs stored in a serverless PostgreSQL.

It was a great success, for some definition of "great": full grade, a few classmates obsessed with hacking it (mostly disabling animations, autoclickers, calling the API directly; the most interesting one was exploiting the fact that I wasn't checking `event.isTrusted` on square clicks to write Javascript to finish everything in zero seconds) and some $10 lost on bets (I foolishly believed no one could break it all in under 5 seconds under someone reminded me that 10-point multitouch exists).

In the spring of 2025 I decided I must revisit it again to study how I could mitigate issues like API abuse or cheating. I have also simplified deployment, moving it from a hip but needlessly complex Netlify (w/ Deno edge functions) + NeonDB serverless stack to a simple Go and SQLite server.

In the spring of 2026 I wrote some documentation so I don't forget what I've coded.

See you next spring!

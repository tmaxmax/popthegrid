# Filling the grid

Six years ago while building a goofy side project I faced the following problem: how do I fit 48 squares on a screen so that they’re as big as possible? I had just started high school and was programming to procrastinate on my math homework, hence I shamelessly copied a (partly wrong) solution off of StackOverflow and moved on.

There was only code – no correctness proof, no complexity analysis. Having just repeated and passed the first Basisprüfungsblock (finally), I learned with pain that this does not fly at ETH. Using my new hard earned knowledge I set out to make them myself, procrastinating this time on my math homework with… math.

Let's state the problem: find a $b \times a \in \N$ grid (rows x columns) into a $w \times h \in \R^{+}$ rectangle which fits $n \in \N$ squares such that the side length of the squares $s \in \R^{+}$ is maximized and the grid does not overflow the rectangle. Since the side length is maximized, the grid will fit in the rectangle's full width or height, or both if a perfect fit is possible. Formally:

$$\begin{gathered}
s_w \coloneqq \max \Set{ s \in \R^{+} | \exist a, b \in \N \text{ . } n \le ab \land as = w \land bs \le h } \\
s_h \coloneqq \max \Set{ s \in \R^{+} | \exist a, b \in \N \text{ . } n \le ab \land as \le h \land bs = h } \\
s \coloneqq \max \Set{ s_w, s_h }.
\end{gathered}$$

$s_w$ is the _fit-width_ solution, $s_h$ the _fit-height_ solution. The final solution $s$ is the desired maximal side length. Our target is to build an algorithm to find $s$.



The solution statement as it stands juggles a lot of variables. We can rewrite the grid dimension constraints using only $a, b, w, h$: 

$$\begin{gathered}
as_w = w \land bs_w \le h \iff a \ge \frac{w}{h}b \land s_w = \frac{w}{a} \\
bs_h = h \land as_h \le w \iff b \ge \frac{h}{w}a \land s_h = \frac{h}{b}.
\end{gathered}$$

$s$ is now dependent on the grid and rectangle dimensions. Using $r \coloneqq \frac{w}{h}$, the rectangle's ratio:

$$\begin{gathered}
a_w \coloneqq \min \Set{a \in \N | \exist b \in \N \text{ . } n \le ab \land a \ge rb} \\
b_h \coloneqq \min \Set{b \in \N | \exist a \in \N \text{ . } n \le ab \land b \ge \frac{a}{r}} \\
s = \max \Set{ \frac{w}{a_w}, \frac{h}{b_h}}.
\end{gathered}$$

$a_w$ is the column count of the _fit-width_ grid, $b_h$ the row count of the _fit-height_ grid. They are minimized since the side length is inversely proportional. The side length is a trivial result of the grid dimensions; only the algorithm for finding $a_w$ and $b_h$ remains to be developed.

Let's take a look at a fit-width grid with dimensions $(a_w, b_w) \in \N^2$. The row count $b_w$ can be abstracted away, too:

$$\begin{split}
n \le a_wb_w \land a_w \ge rb_w \iff &\frac{n}{a_w} \le b_w \le \frac{a_w}{r} \\
\iff &\left\lceil \frac{n}{a_w} \right\rceil \le \frac{a_w}{r} \\
\iff &a_w \ge r \left\lceil \frac{n}{a_w} \right\rceil.
\end{split}$$

With an analogous derivation for $b_h$, we get:

$$
a_w = \min \Set{ a \in \N | a \ge r \left\lceil \frac{n}{a} \right\rceil }, \quad b_h = \min \Set{ b \in \N | rb \ge \left\lceil \frac{n}{b} \right\rceil }.
$$

Since the second comparison term is non-increasing in $a$ (respectively in $b$), it follows that every $a > a_w$ (and $b > b_h$) would satisfy the solution condition. The algorithm idea is therefore the following: starting from an initial guess $a_0 \le a_w$ (and $b_0 \le b_h$) test every value until the solution condition holds, i.e. loop while:

$$
a < r \left\lceil \frac{n}{a} \right\rceil, \quad rb < \left\lceil \frac{n}{b} \right\rceil
$$

Only the initial guesses $a_0$ and $b_0$ must be established. From the solution condition of $a_w$:

$$
a_w \ge r \left\lceil \frac{n}{a_w} \right\rceil \implies {a_w}^2 \ge rn \implies a_w \ge \sqrt{rn}
$$

Since $a_w \in \N$ it can therefore be no smaller than $a_0 = \left\lceil \sqrt{rn} \right\rceil$. Likewise, $b_w \ge b_0 = \left\lceil \sqrt{\frac{n}{r}} \right\rceil$. Using the loop condition above, an algorithm can finally be built:

```javascript
function fillGrid(n, w, h) {
    const r = w / h

    let a = Math.ceil(Math.sqrt(r * n))
    while (a < r * Math.ceil(n / a)) {
        a++
    }

    let b = Math.ceil(Math.sqrt(n / r))
    while (r * b < Math.ceil(n / b)) {
        b++
    }

    return Math.max(w / a, h / b)
}
```

Correctness is proven in the construction process above. To analyze the runtime complexity, observe that since $a_0 \le a < r\left\lceil{\frac{n}{a}}\right\rceil$, $a$ will be incremented at most $\left\lceil{r\left\lceil{\frac{n}{a}}\right\rceil - a_0}\right\rceil$ times. Moreover, since $a$ increases, $\left\lceil{\frac{n}{a}}\right\rceil \le \left\lceil{\frac{n}{a_0}}\right\rceil $. Hence an upper bound on the iteration count is:

$$\begin{align*}
\left\lceil{r\left\lceil{\frac{n}{a}}\right\rceil - a_0}\right\rceil &< r \left\lceil{\frac{n}{a_0}}\right\rceil - a_0 + 1 \\
    &< r \frac{n}{a_0} + r -a_0 + 1 \\
    &= r\frac{n}{\left\lceil \sqrt{rn} \right\rceil} + r - \left\lceil\sqrt{rn}\right\rceil + 1 \\
    &< \frac{rn}{\sqrt{rn}} + r - \sqrt{rn} + 1 \\
    &= r + 1
\end{align*}$$

This means at most $\left\lfloor r \right\rfloor + 1$ iterations and a runtime of $\mathcal{O}(r)$, dependent only on the aspect ratio of the grid. This bound is tight: for $n = 33, r = \frac{1}{8.3}$ the fit-width loop does $1 = \lfloor r \rfloor + 1$ iteration, reaching the upper bound.

Lastly, _geht es besser?_ Yes – the algorithm can be adapted to use binary search, achieving $\mathcal{O}(\log r)$ (how? left to the reader). _Geht es (noch) besser?_ Probably not. This problem is a particular case of _integer programming_: find minimal/maximal integer solution to a problem satisfying constraints. It is an NP-hard problem, with state of the art algorithms having complexity $(\log n)^{\mathcal{O}(n)} \cdot (m \cdot \log V)^{\mathcal{O}(1)}$, where:
- $n$ is the number of variables,
- $m$ the number of constraints,
- $V$ the maximum absolute value of the solution.

For our algorithm we'd solve for the fit-width and fit-height solution separately. Handling fit-width: $n = 1$ since we just solve for $a_w$, $m = 2$ and $V = r$ since by the upper bound above $a_0 \le a \le a_0 + r$. Plugging in the formula above, we'd get a runtime of $(2\log r)^{\mathcal{O}(1)}$, which is not asymptotically better than the binary search solution. The solution developed here is heuristics-based: it does a local search on the solution space, exploiting characteristics unique to this particular problem. The only way to reduce the asymptotic runtime is with a better heuristic.

We have a correct and optimal algorithm, therefore this presentation concludes here.

But there is more to explore:
- can a better heuristic be derived (perhaps even $\mathcal{O}(1)$)?
- can one find geometric intuition behind all this?
- are the grid dimensions unique for the optimal solution? (also an exercise for the reader [WIP: LINK][1])
- as $r$ changes, when are $a_w$ and $b_h$ equal to $a_0$ and $b_0$ and when does the algorithm iterate instead?

For the curious I've prepared a deep dive into all of the above in this nice document [WIP: LINK][2]. Alternatively, [archive.quateo.com/grid/][3] hosts all referenced files.

Thank you for reading!

[1]: about:blank
[2]: about:blank
[3]: https://archive.quateo.com/grid/
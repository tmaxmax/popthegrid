# Filling the grid

Six years ago while building a goofy side project I faced the following problem: how do I fit 48 squares on a screen so that they’re as big as possible? I had just started high school and was programming to procrastinate on my math homework, hence I shamelessly copied a (partly wrong) solution off of Stack Overflow and moved on.

There was only code – no correctness proof, no complexity analysis. Having just repeated and passed the first Basisprüfungsblock (finally), I learned with pain that this does not fly at ETH. Using my new hard-earned knowledge I set out to make them myself, procrastinating this time on my math homework with… math.

Let's state the problem: place a $b \times a \in \N$ grid (rows x columns) into a $w \times h \in \R^{+}$ rectangle which fits $n \in \N$ squares such that the side length of the squares $s \in \R^{+}$ is maximized and the grid does not overflow the rectangle. Since the side length is maximized, the grid will fit in the rectangle's full width or height, or both if a perfect fit is possible. Formally:

$$
\begin{gathered}
S_w \coloneqq \Set{ s \in \R^{+} | \exist a, b \in \N \text{ . } n \le ab \land as = w \land bs \le h } \\
S_h \coloneqq \Set{ s \in \R^{+} | \exist a, b \in \N \text{ . } n \le ab \land as \le h \land bs = h } \\
s \coloneqq \max (S_w \cup S_h).
\end{gathered}
$$

$s_w \in S_w$ is a _fit-width_ solution, $s_h \in S_h$ a _fit-height_ solution. The final solution $s$ is the desired maximal side length. Our target is to build an algorithm to find $s$.

Observe that for any fixed $b$ we can always take $a = \left\lceil \frac{n}{b} \right\rceil$ to obtain a grid which fits $n$ squares, since clearly $n \le ab$. For this grid $(a, b)$ let $s' = \min \Set{ \frac{w}{a}, \frac{h}{b}}$ its corresponding side length; it's easy to see that $s' \in S_w \cup S_h$. We can just test all $1 \le b \le n$ and pick the maximum $s'$ to obtain the solution $s$:

```javascript
function fillGrid(n, w, h) {
    let s = 0;
    for (let b = 1; b <= n; b++) {
        s = Math.max(s, Math.min(w / Math.ceil(n / b), h / b))
    }
    return s
}
```

Used JavaScript so someone's offended, golfed the code so the article fits, asymptotic complexity is $\mathcal{O}(n)$. To improve this, notice that if $a \le \sqrt{n}$ there are obviously $\mathcal{O}(\sqrt{n})$ distinct values of $a$. If $a > \sqrt{n}$:

$$
\left\lceil \frac{n}{b} \right\rceil > \sqrt{n} \implies \frac{n}{b} + 1 > \sqrt{n} \implies b < \frac{n}{\sqrt{n} - 1} = \sqrt{n} + 1 + \frac{1}{\sqrt{n} - 1}.
$$

Therefore $a > \sqrt{n} \implies b \le \mathcal{O}(\sqrt{n})$, so in all cases there are $\mathcal{O}(\sqrt{n})$ distinct $a$ values. Clever incrementing of $b$ could then achieve complexity $\mathcal{O}(\sqrt{n})$. But for my grid with $n = 10^{20}$ squares this isn't good enough, so...

 _Geht es besser?_

The solution statement as it stands juggles a lot of variables. We can rewrite the grid dimension constraints using only $a, b, w, h$: 

$$
\begin{gathered}
as_w = w \land bs_w \le h \iff a \ge \frac{w}{h}b \land s_w = \frac{w}{a} \\
bs_h = h \land as_h \le w \iff b \ge \frac{h}{w}a \land s_h = \frac{h}{b}.
\end{gathered}
$$

$s$ is now dependent on the grid and rectangle dimensions. Using $r \coloneqq \frac{w}{h}$, the rectangle's aspect ratio:

$$
\begin{gathered}
a_w \coloneqq \min \Set{a \in \N | \exist b \in \N \text{ . } n \le ab \land a \ge rb} \\
b_h \coloneqq \min \Set{b \in \N | \exist a \in \N \text{ . } n \le ab \land b \ge \frac{a}{r}} \\
s = \max \Set{ \frac{w}{a_w}, \frac{h}{b_h}}.
\end{gathered}
$$

$a_w$ is the column count of the _fit-width_ grid, $b_h$ the row count of the _fit-height_ grid. They are minimized since the side length is inversely proportional. The side length is a trivial result of the grid dimensions; only the algorithm for finding $a_w$ and $b_h$ remains to be developed.

Let's take a look at a fit-width grid with dimensions $(a_w, b_w) \in \N^2$. $b_w$ can be abstracted away:

$$
n \le a_wb_w \land a_w \ge rb_w \iff \frac{n}{a_w} \le b_w \le \frac{a_w}{r} 
\iff \left\lceil \frac{n}{a_w} \right\rceil \le \left\lfloor \frac{a_w}{r} \right\rfloor.
$$

This is a range for all $b_w$ corresponding to $a_w$. With an analogous derivation for $b_h$, we get:

$$
a_w = \min \Set{ a \in \N | \left\lfloor \frac{a}{r} \right\rfloor \ge \left\lceil \frac{n}{a} \right\rceil }, \quad b_h = \min \Set{ b \in \N | \left\lfloor rb \right\rfloor \ge \left\lceil \frac{n}{b} \right\rceil }.
$$

Since the second comparison term is non-increasing in $a$ (respectively in $b$), it follows that every $a > a_w$ (and $b > b_h$) would satisfy the solution condition. The algorithm idea is thus the following: starting from an initial guess $a_0 \le a_w$ (and $b_0 \le b_h$) test every value until the solution condition holds, i.e. loop while:

$$
 \left\lfloor \frac{a}{r} \right\rfloor < \left\lceil \frac{n}{a} \right\rceil \iff a < r \left\lceil \frac{n}{a} \right\rceil,
 \quad \left\lfloor rb \right\rfloor < \left\lceil \frac{n}{b} \right\rceil \iff rb < \left\lceil \frac{n}{b} \right\rceil.
$$

Only the initial guesses $a_0$ and $b_0$ remain to be made. From the solution condition of $a_w$:

$$
a_w \ge r \left\lceil \frac{n}{a_w} \right\rceil \implies {a_w}^2 \ge rn \implies a_w \ge \sqrt{rn}.
$$

Since $a_w \in \N$ it can therefore be no smaller than $a_0 = \left\lceil \sqrt{rn} \right\rceil$. Likewise, $b_w \ge b_0 = \left\lceil \sqrt{\frac{n}{r}} \right\rceil$. Using the loop condition above, an algorithm can finally be built:

```javascript
function fillGrid(n, w, h) {
    const r = w / h

    let a = Math.ceil(Math.sqrt(r * n))
    for (; a < r * Math.ceil(n / a); a++);

    let b = Math.ceil(Math.sqrt(n / r))
    for (; r * b < Math.ceil(n / b); b++);

    return Math.max(w / a, h / b)
}
```

To analyze the runtime complexity, observe that since $a_0 \le a < r\left\lceil{\frac{n}{a}}\right\rceil \le r \left\lceil \frac{n}{a_0} \right\rceil$, $a$ is incremented at most $\left\lceil{r\left\lceil{\frac{n}{a_0}}\right\rceil - a_0}\right\rceil$ times. An upper bound on the iteration count is:

$$
\begin{align*}
\left\lceil{r\left\lceil{\frac{n}{a_0}}\right\rceil - a_0}\right\rceil &< r \left\lceil{\frac{n}{a_0}}\right\rceil - a_0 + 1 \\
    &< r \frac{n}{a_0} + r -a_0 + 1 \\
    &= r\frac{n}{\left\lceil \sqrt{rn} \right\rceil} + r - \left\lceil\sqrt{rn}\right\rceil + 1 \\
    &< \frac{rn}{\sqrt{rn}} + r - \sqrt{rn} + 1 \\
    &= r + 1.
\end{align*}
$$

This means at most $\left\lfloor r \right\rfloor + 1$ iterations. This bound is tight: for $n = 33, r = \frac{1}{8.3}$ the fit-width loop does $1 = \lfloor r \rfloor + 1$ iteration, reaching the upper bound. Similarly for the second loop we get a tight upper bound of $\left\lfloor \frac{1}{r} \right\rfloor + 1$ iterations. The runtime is therefore $\mathcal{O}(R)$ with $R = \max \Set{r, \frac{1}{r}}$. One could binary search over $\left[a_0, a_0 + \lfloor r \rfloor + 1\right]$ and $\left[b_0, b_0 + \left\lfloor \frac{1}{r} \right\rfloor + 1\right]$ to reduce complexity to $\mathcal{O}(\log R)$.

My $n = 10^{20}$ grid is a piece of cake now, but my $r = 2 \uarr \uarr 6$ grid still requires around $10^{19700}$ iterations. There are $10^{80}$ atoms in the observable universe. _Geht es besser?_ 

Let's return to the initial algorithm: iterate through all possible $b$. Can we further restrict the range of $b$? For the maximal fit-height solution $s_h$ we know that the corresponding $b_h \ge b_0 = \left\lceil \sqrt{\frac{n}{r}} \right\rceil$. Next, observe that any $b$ is fit-height if $ rb \ge \frac{n}{b} + 1 > \left\lceil \frac{n}{b} \right\rceil$. For which $b$ does this hold?

$$
rb \ge \frac{n}{b} + 1\iff rb^2 - b - n \ge 0 \iff b \ge \frac{1}{2r} + \sqrt{\frac{1}{4r^2} + \frac{n}{r}}.
$$

When $r \ge 1$ it suffices that $b = b_0 + 1$:

$$
\frac{1}{2r} + \sqrt{\frac{1}{4r^2} + \frac{n}{r}} \le \frac{1}{2} + \sqrt{\left(\frac{1}{2} + \sqrt{\frac{n}{r}}\right)^2} \le b_0 + 1.
$$

Since $s_h$ is maximal, $b_h$ is minimal, thus $b_h \in \Set{b_0, b_0 + 1}$ always for $r \ge 1$. Let now $b_w = b_h - 1$ and $a_w = \left\lceil \frac{n}{b_w} \right\rceil$. Since $n \le a_wb_w$ but $b_w < b_h$, by minimality of $b_h$ it must be that $a_w > rb_w$, meaning $(a_w, b_w)$ is a fit-width solution. For any other fit-width solution $(a, b)$ with $a < a_w$ and side length $s = \frac{w}{a}$:

$$
\begin{align*}
a < \left\lceil \frac{n}{b_h - 1} \right\rceil \le \left\lceil \frac{ab}{b_h - 1} \right\rceil \implies &a < \frac{ab}{b_h - 1} \implies b \ge b_h \\
    \implies &a \ge rb \ge rb_h \implies \frac{w}{a} \le \frac{h}{b_h} \\
    \implies &s \le s_h.
\end{align*}
$$

No such fit-width $(a, b)$ is better than the fit-height $(a_h, b_h)$. Hence the only useful fit-width solution is $b_w = b_h - 1 \in \Set{b_0 - 1, b_0}$. In conclusion for $r \ge 1$ the optimal solution $s$ will _always_ correspond to a grid with $b \in \Set{b_0 - 1, b_0, b_0 + 1}$ rows.

Lastly, notice the symmetry of the problem with respect to $r$. Taking $r' \coloneqq \frac{1}{r}$ just rotates the original rectangle by $90^\circ$. Anything proven for $r \ge 1$ applies to $r < 1$ with flipped dimensions. Using the result above, for $r < 1$ the optimal grid $(a, b)$ must have $a \in \Set{a_0 - 1, a_0, a_0 + 1}$ and $(a, b) = (b', a')$, where $(a', b')$ is the optimal grid for $r'$.

With this we have exhaustively covered the input domain. The $\mathcal{O}(1)$ algorithm we've all been waiting for is...

```javascript
function fillGrid(n, w, h) {
    const r = w / h
    if (r < 1) {
        return fillGrid(n, h, w)
    }
    const s = (b) => Math.min(w / Math.ceil(n / b), h / b)
    const b0 = Math.ceil(Math.sqrt(n / r))
    return Math.max(s(b0 - 1), s(b0), s(b0 + 1))
}
```

_Besser geht es nicht._

If you've found the proofs hard to follow, use a graph: plot the functions $\frac{n}{x}$ and $\frac{x}{r}$ and the solution points $(a, b)$ and interpret geometrically. Here's Desmos: [desmos.com/calculator/z0ubu4uih8][1].

For additional context, this problem is a particular case of _integer programming_. There exist general algorithms to solve such problems but the best time complexity they can achieve here is still $\mathcal{O}(\log R)$.

Lastly, a challenge! Prove that when a fit-width solution $(a_w, b_w)$ is the best, i.e. $s_w > s_h$ for all $(a_h, b_h)$ fit-height, there is no $b \ne b_w$ such that $(a_w, b)$ is fit-width. Check [archive.quateo.com/grid/unique.html][2] if you get stuck.

[1]: https://www.desmos.com/calculator/z0ubu4uih8
[2]: https://archive.quateo.com/grid/unique.html
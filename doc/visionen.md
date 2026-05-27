---
title: Filling the grid
---
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

$s_w \in S_w$ is a _fit&#8209;width_ solution, $s_h \in S_h$ a _fit&#8209;height_ solution. The final solution $s$ is the desired maximal side length. Our target is to build an algorithm to find $s$.

Observe that for any fixed $b$ we can always take $a = \left\lceil \frac{n}{b} \right\rceil$ to obtain a grid which fits $n$ squares, since clearly $n \le ab$. For this grid $(a, b)$ let $s' = \min \Set{ \frac{w}{a}, \frac{h}{b}}$ its corresponding side length; it's easy to see that $s' \in S_w \cup S_h$. We can just test all $1 \le b \le n$ and pick the maximum $s'$ to obtain the solution $s$:

```javascript
function fillGrid(n, w, h) {
    let s = 0
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

$a_w$ is the column count of the _fit&#8209;width_ grid, $b_h$ the row count of the _fit&#8209;height_ grid. They are minimized since the side length is inversely proportional. The side length is a trivial result of the grid dimensions; only the algorithm for finding $a_w$ and $b_h$ remains to be developed.

Let's take a look at a fit&#8209;width grid with dimensions $(a_w, b_w) \in \N^2$. $b_w$ can be abstracted away:

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
    for (; a < r * Math.ceil(n / a); a++)

    let b = Math.ceil(Math.sqrt(n / r))
    for (; r * b < Math.ceil(n / b); b++)

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

This means at most $\left\lfloor r \right\rfloor + 1$ iterations. This bound is tight: for $n = 33, r = \frac{1}{8.3}$ the fit&#8209;width loop does $1 = \lfloor r \rfloor + 1$ iteration, reaching the upper bound. Similarly for the second loop we get a tight upper bound of $\left\lfloor \frac{1}{r} \right\rfloor + 1$ iterations. The runtime is therefore $\mathcal{O}(R)$ with $R = \max \Set{r, \frac{1}{r}}$. One could binary search over $\left[a_0, a_0 + \lfloor r \rfloor + 1\right]$ and $\left[b_0, b_0 + \left\lfloor \frac{1}{r} \right\rfloor + 1\right]$ to reduce complexity to $\mathcal{O}(\log R)$.

My $n = 10^{20}$ grid is a piece of cake now, but my $r = 2 \uarr \uarr 6$ grid still requires around $10^{19700}$ iterations. There are $10^{80}$ atoms in the observable universe. _Geht es besser?_ 

Let's return to the initial algorithm. It iterates through all solutions $\left(a = \left\lceil \frac{n}{b} \right\rceil, b\right)$ for $1 \le b \le n$. It must find the optimal $s$: any other $a' > a$ is worse, as at each step the side length $s' = \min \Set{\frac{w}{a'}, \frac{h}{b}} \le \min \Set{\frac{w}{a}, \frac{h}{b}}$, and any other $b' > n$ does not help, since it would correspond to a solution $(1, b')$ with $s' = \min \Set{ w, \frac{h}{b'} } \le \min \Set{ w, \frac{h}{n} }$, with the latter value being the side length of $(1, n)$, a solution that's tested.

Consider what happens when $b \le \sqrt{\frac{n}{r}}$:

$$
b \le \sqrt{\frac{n}{r}} \implies rb \le \frac{n}{b} \le a \implies \frac{h}{b} \ge \frac{w}{a} \implies s' = \frac{w}{\left\lceil \frac{n}{b} \right\rceil}.
$$

Every solution tested is fit&#8209;width and to maximize the side length we must take $b = \left\lfloor \sqrt{\frac{n}{r}} \right\rfloor$. Consider now $b \ge \sqrt{\frac{n}{r}}$:

$$
b \ge \sqrt{\frac{n}{r}} \implies rb \ge \frac{n}{b} \implies \underbrace{rb > \left\lceil \frac{n}{b} \right\rceil}_{\text{(1)}} \lor \underbrace{\left\lceil \frac{n}{b} \right\rceil \ge rb}_{\text{(2)}}.
$$

In case $\text{(1)}$ the solution $(a = \left\lceil \frac{n}{b} \right\rceil, b)$ is clearly fit&#8209;height, so $s' = \frac{h}{b}$ is maximized when $b \ge \sqrt{\frac{n}{r}}$ by $b = \left\lceil \sqrt{\frac{n}{r}} \right\rceil$. To tackle case $\text{(2)}$ we'll assume that $r \ge 1$; it then follows:

$$
\begin{aligned}
rb \le \left\lceil \frac{n}{b} \right\rceil < \frac{n}{b} + 1 \implies &rb^2 - b - n < 0 \implies b < \frac{1}{2r}+\sqrt{\frac{1}{4r^2} + \frac{n}{r}} \\
    \implies &b < \frac{1}{2} + \sqrt{\left(\frac{1}{2} + \sqrt{\frac{n}{r}}\right)^2} = \sqrt{\frac{n}{r}} + 1 \\
\end{aligned}
$$

Under both assumptions about $b$ and $r$ we have $\sqrt{\frac{n}{r}} \le b < \sqrt{\frac{n}{r}} + 1$, thus, simply by definition of the ceiling function, $b = \left\lceil \sqrt{\frac{n}{r}} \right\rceil$. Hence when $r \ge 1$ only $b \in \Set{ \left\lfloor \sqrt{\frac{n}{r}} \right\rfloor, \left\lceil \sqrt{\frac{n}{r}} \right\rceil }$ can ever maximize the side length.

To tackle $r \le 1$, notice the symmetry of the problem with respect to $r$. Taking $r' \coloneqq \frac{1}{r}$ just rotates the original rectangle by $90^\circ$ – the side length of the squares remains the same, the number of rows and columns swap. Using the result above, for $r \le 1$ the optimal grid $(a, b)$ must have $a \in \{ \lfloor \sqrt{rn} \rfloor, \lceil \sqrt{rn} \rceil \}$, with $\sqrt{rn} = \sqrt{\frac{n}{r'}}$, and $(a, b) = (b', a')$, where $(a', b')$ is the optimal grid for $r'$.

With this we have exhaustively covered the input domain. The $\mathcal{O}(1)$ algorithm we've all been waiting for is...

```javascript
function fillGrid(n, w, h) {
    const r = w / h
    if (r < 1) return fillGrid(n, h, w)
    const s = (b) => Math.min(w / Math.ceil(n / b), h / b)
    const b0 = Math.sqrt(n / r)
    return Math.max(s(Math.floor(b0)), s(Math.ceil(b0)))
}
```

_Besser geht es nicht._

If you've found the proofs hard to follow, use a graph: plot the functions $\frac{n}{x}$ and $\frac{x}{r}$ and the solution points $(a, b)$ and interpret geometrically. Here's Desmos: [desmos.com/calculator/z0ubu4uih8][1].

For additional context, this problem is a particular case of _integer programming_. There exist general algorithms to solve such problems but the best time complexity they can achieve here is still $\mathcal{O}(\log R)$.

Lastly, a challenge! Prove that when a fit&#8209;width solution $(a_w, b_w)$ is the best, i.e. $s_w > s_h$ for all $(a_h, b_h)$ fit&#8209;height, there is no $b \ne b_w$ such that $(a_w, b)$ is fit&#8209;width. Check [archive.quateo.com/grid/unique.html][2] if you get stuck.

[1]: https://www.desmos.com/calculator/z0ubu4uih8
[2]: https://archive.quateo.com/grid/unique.html
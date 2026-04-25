# Filling the grid

A container of fixed width and height $w, h \in \R^+$ is filled with $n \in \N$ (natural numbers without zero squares positioned in a grid-like fashion. The squares should cover as much of the $w \times h$ area as possible without overflowing, which means we must maximize the side length $S \in \R^+$ of the square. In other words, we are searching an $b \times a \in \N$ grid which fits all our $n$ squares and itself fits in the container while either being as wide or as tall as the container.

We can state the problem in a formal manner as follows:

$$\begin{gather*}
\text{Sol}_{a} \coloneqq \Set{s \in \R^{+} | \exists a, b \in \N \thickspace . \thickspace n \leq ab \land as = w \land bs \leq h} \\
\text{Sol}_{b} \coloneqq \Set{s \in \R^{+} | \exists a, b \in \N \thickspace . \thickspace n \leq ab \land bs = h \land as \leq w} \\
\text{Sol} \coloneqq \text{Sol}_{a} \cup \text{Sol}_{b} \\
S \coloneqq \max \text{Sol} \end{gather*} $$

Let's start solving for a solution $s_a \in \text{Sol}$ by attempting to find grid as wide as the container. For any $s \in \text{Sol}_{a}$:

$$\begin{align*}n \leq ab \land as = w \land bs \leq h &\implies n \leq \frac{w}{s}b \land bs \leq h \\ &\implies n \leq \frac{w}{s} \cdotp \frac{h}{s} \\ &\implies n \leq \frac{wh}{s^2} \\ &\implies s \leq \sqrt{\frac{wh}{n}} \tag{1} \end{align*}$$

This is an upper bound on the side length. Let's determine the grid's number of columns, $a$:

$$\begin{align*} as = w \implies &a = \frac{w}{s} \\ \overset{(1)}{\implies} &a \geq \frac{w}{\sqrt{\frac{wh}{n}}} \\ \implies &a \geq \sqrt{\frac{w}{h}n} \\ (s \text{ maximized} \land a \in \N) \implies &a = \lceil \sqrt{\frac{w}{h}n} \rceil \tag{2} \end{align*}$$

To further clarify the last step: since $s$ is in the denominator, maximizing it means $a$ must take the smallest value greater than or equal to RHS. Since $a \in \N$ this is precisely RHS rounded up.

Knowing $a$ we can now determine the side length $s$:

$$\begin{equation}\tag{3} as = w \implies s = \frac{w}{a} \end{equation}$$

Since the implications in $(1)$ go in one direction only, we must check that $s \in \text{Sol}$. The first necessary condition is:

$$\begin{equation}\tag{4} n \leq \lfloor \frac{w}{s} \rfloor \cdotp \lfloor \frac{h}{s} \rfloor \end{equation}$$

since $a = \lfloor w/s \rfloor$ and $b = \lfloor h/s \rfloor$ provide the number of squares the grid _should_ have on each dimension, if it fits the squares and doesn't overflow. Moreover, $as = w \implies a = w/s = \lfloor w/s \rfloor$, since $a \in \N$.

Let's go to our initial assumptions.

$$\begin{equation}\tag{5} n \leq ab \land bs \leq h \implies n \leq a \frac{h}{s} \\ \implies \underbrace{n \leq a \lfloor \frac{h}{s} \rfloor}_{\text{(i)}} \lor \underbrace{(n > a \lfloor \frac{h}{s} \rfloor \land n \leq a \frac{h}{s})}_{\text{(ii)}} \end{equation}$$

In case $\text{(i)}$ we can take $b = \lfloor h/s \rfloor$, which means $bs \le h$. Thus, $s$ as determined above is in $\text{Sol}_{a} \sube \text{Sol}$. But in case $\text{(ii)}$, $b = \lfloor h/s \rfloor \implies n > ab \implies s \notin \text{Sol}$. A new solution $s'$ must be found.

Let's analyze what follows from $\text{(ii)}$:

$$\begin{align*} a \lfloor \frac{h}{s} \rfloor < n \leq a \frac{h}{s} \implies &\lfloor \frac{h}{s} \rfloor < \frac{h}{s} \land n \leq a \frac{h}{s} \\ \implies &\frac{h}{s} < \lceil \frac{h}{s} \rceil \land n \leq a \frac{h}{s} \\ \implies &n < a \lceil \frac{h}{s} \rceil \tag{6} \end{align*}$$

This means $b = \lceil h/s \rceil$ is a safe choice for the $a$ that we've determined, and a candidate for $s'$ is:

$$\begin{equation} \tag{7} s' = \frac{h}{b} = \frac{h}{\lceil \frac{h}{s} \rceil} \overset{(3)}{=} \frac{h}{\lceil \frac{h}{w}a \rceil} \end{equation}$$

Is this $s' \in \text{Sol}$? Yes, in fact in $\text{Sol}_{b}$: $(6) \implies n \leq ab$, $(7) \implies bs' = h$ and

$$\begin{equation} \tag{8} as' = \frac{ah}{\lceil \frac{h}{w}a \rceil} = \frac{ah}{\lceil \frac{ah}{w} \rceil} \overset{\lceil x \rceil \geq x}{\implies} as' \leq \frac{ah}{\frac{ah}{w}} \implies as' \leq w \end{equation}$$

With that we have determined $s_a$. Here's its formula based only on inputs $w, h, n$:

$$\begin{gather*} a = \lceil \sqrt{\frac{w}{h}n} \rceil \qquad s_a = \begin{cases} \frac{w}{a} &\text{if } n \leq a \lfloor \frac{h}{w}a \rfloor \\ \frac{h}{\lceil \frac{h}{w}a \rceil} &\text{else} \end{cases} \end{gather*}$$

Analoguously goes the process for determining $s_b$, whose formula is:

$$\begin{gather*} b = \lceil \sqrt{\frac{h}{w}n} \rceil \qquad s_b = \begin{cases} \frac{h}{b} &\text{if } n \leq b \lfloor \frac{w}{h}b \rfloor \\ \frac{w}{\lceil \frac{w}{h}b \rceil} &\text{else} \end{cases} \end{gather*}$$

Finally, $S = \max \Set{s_a, s_b}$.

Sadly, this algorithm sometimes fails to find the optimal solution. For example, inputs: 
- $w = 10, h = 2, n = 8$ expect $S = 1.25$ but this algorithm gives $S = 1$
- $w = 7, h = 2, n = 20$ expect $S = 0.7$ but this algorithm gives $S = 0.(6)$
- and many others

What do these inputs have in common? When does this algorithm have issues?

To investigate this, let's simplify our solution statement. Right now there are three variables, $s, a, b$ and three parameters, $n, w, h$. Observe that:

$$\begin{equation} \tag{9}
\begin{split}
s_w \in \text{Sol}_a \iff &as_w = w \land bs_w \le h \iff a \ge rb \land s_w = \frac{w}{a_w} \\
s_h \in \text{Sol}_b \iff &bs_h = h \land as_h \le w \iff rb \ge a \land s_h = \frac{h}{b_h} \\
&\text{with } n \le ab \text{ for all of the above}
\end{split}
\end{equation}$$

We've simplified width and height to just their ratio, $r = \frac{w}{h}$. Moreover, we don't need to compute $s_w$ and $s_h$ to compare them. Let $s_w = \frac{w}{a_w}$, $s_h = \frac{h}{b_h}$. Then: 

$$\begin{equation} \tag{10}
s_w \gt s_h \iff \frac{w}{a_w} \gt \frac{h}{b_h} \iff \frac{1}{a_w} \gt \frac{1}{rb_h} \iff a_w \lt rb_h
\end{equation}$$

We can now state the final solution:

$$\begin{equation} \tag{11}
\begin{split}
a_w &= \underset{b_w \in \N}{\min} \Set{a \in \N : a \ge \frac{n}{b_w} \land a \ge rb_w} \\
b_h &= \underset{a_h \in \N}{\min} \Set{b \in \N : b \ge \frac{n}{a_h} \land b \ge \frac{a_h}{r}} \\
s &= \begin{cases}
    s_w = \frac{w}{a_w} &\text{ if } a_w < rb_h, \\
    s_h = \frac{h}{b_h} &\text{ otherwise} 
\end{cases}
\end{split}
\end{equation}$$

The problem is reduced to just $a, b$ and $r$. This simplification unlocks a powerful geometric representation: we're looking for points $(a_w, b_w), (a_h, b_h) \in \N^2$ such that they're on or above the hyperbola $xy = n$ and on, under, respectively above the line $x = ry$. $x = a$ is used as stand-in for columns in the continuous space, $y = b$ for rows. [Take a look]() (graph A):

<p id="graph-a" align=center><img src="./img/first-graph.png" alt="An introductory graph" width="300" /></p>

This is the graph for the $n = 8, w = 10, h = 2$ counterexample above, with $r = 10/2 = 5$. The black area under $y = rx$ contains all fit-width solutions, the red area all the fit-height solutions. The union of these two contains the entire solution space, all $(a, b)$ for which $n \le ab$, i.e. all grid dimensions which fit all squares. Points on the green-red line $y = rx$ are grid dimensions having the ratio exactly $r$. Black points are a subset of other solution candidates.

The symmetry of the problem with respect to ratio can now be directly visualized. For $n = 13$ and $r = 3$, respectively $r = 1/3$, we have:

<p align=center>
    <img src="./img/symm-width.png" alt="r > 1 graph to depict symmetry of problem" width="300" />
    <img src="./img/symm-height.png" alt="r < 1 graph to depict symmetry of problem" width="300" />
</p>

Terminology-wise, here on $(a_w, b_w), (a_h, b_h)$ will be called a _fit-width point_, respectively a _fit-height point_, if the points respect the requirements in $\text{(9)}$; if the points are those described in $\text{(11)}$, they'll also be called _minimal points_ (minimized coordinates for maximal side-length). $s_w$ and $s_h$ will be called _fit-width_ and _fit-height solutions_; unless explicitly mentioned, the $(a_w, b_w), (a_h, b_h)$ points implied by $s_w$ and $s_h$ are not minimal. Sometimes only $a_w$ or $b_h$ will be mentioned but keep in mind that by definition they do have a pair $b_w$ and $a_h$.

Let's now analyze the solution space.

First, notice the purple point at the intersection of the hyperbola and the line – that is, the $(x_0, y_0)$ where $\frac{n}{y_0} = ry_0$ – is special. This would be the "ideal" point, if rows and columns could be fractional somehow: only these dimensions exactly fit all squares and have the exact desired ratio. Notice that:

$$\begin{equation} \tag{12}
x_0 = \frac{n}{y_0} = ry_0 \iff x_0 = \sqrt{rn} \land y_0 = \sqrt{\frac{n}{r}}
\end{equation}$$

The number of rows $a$ chosen in $\text{(2)}$ is precisely $\lceil x \rceil$. This is the visual confirmation of that result: all the fit-width points will find themselves to the left of that point, all the fit-height points to its right. In other words:

$$\begin{equation} \tag{13}
\forall a_w, b_h\text{ . } a_w \ge x_0 \land b_h \ge y_0
\end{equation}$$

If parameters are "nice" – $x_0, y_0 \in \N$ – the minimal fit-width and fit-height points coincide (graph B):

<p id="graph-b" align=center><img src="./img/perfect-solution.png" alt="Parameters where the fit-width and fit-height solutions coincide" width="300" /></p>

Second, when is a point _valid_, i.e. satisfies solution requirements in $\text{(9)}$? Also, can multiple points give the same solution? Consider the following ($n = 23, r = 3.9$, graph C):

<p id="graph-c" align=center><img src="./img/multiple-points-same-solution.png" alt="" width="300" /></p>

The 4 points next to $(a_h, b_h)$ have the same ordinate and the point above $(a_w, b_w)$ the same abscissa, therefore their corresponding side lengths are still $s_w$, respectively $s_w$. This follows directly from the solution requirements in $\text{(9)}$:

$$\begin{equation} \tag{14}
\begin{split}
\begin{aligned}
\text{Fit width:} \\
a_wb_w \ge n \land a_w \ge rb_w \iff &\frac{n}{a_w} \le b_w \le \frac{a_w}{r} \\
    \iff &\lceil \frac{n}{a_w} \rceil \le b_w \le \lfloor \frac{a_w}{r} \rfloor \\
\text{Fit height:} \\
a_hb_h \ge n \land b_h \ge \frac{a_h}{r} \iff &\lceil \frac{n}{b_h} \rceil \le a_h \le \lfloor rb_h \rfloor
\end{aligned}
\end{split}
\end{equation}$$

Notice how the intervals describe the space between the hyperbola and the line for $a_h$ and $b_w$. The ceilings and floors are visible in the graph too: the points are a bit above/under the function graphs too. Thus:

$$\begin{equation} \tag{15}
\begin{split}
a_w \text{ valid }\iff &\lceil \frac{n}{a_w} \rceil \le \lfloor \frac{a_w}{r} \rfloor \\
b_h \text{ valid }\iff &\lceil \frac{n}{b_h} \rceil \le \lfloor rb_h \rfloor
\end{split}
\end{equation}$$

The number of points with equal solutions is easily derived.

Third, which points give the optimal solution $s$? How do they compare? Let's observe the example graphs for intuition:
- in [graph A](#graph-a), $a_w$ is optimal, and $b_w < b_h$
- in [graph B](#graph-b), $a_w$ and $b_h$ are equivalent, and $b_w = b_h$
- in [graph C](#graph-c), $a_w$ is worse than $b_h$, and $b_w = b_h$ for one of the fit-width solutions

It would also seem like a fit-width point with more rows than a fit-height point gives a worse solution: it's simply a bigger grid in the same space, since the number of columns must also increase.

Let's prove formally. For $b_w \ge b_h$ we have:

$$\begin{equation} \tag{16}
b_w \ge b_h \overset{\text{(9)}}{\implies} a_w \ge rb_w \ge rb_h \ge a_h \implies \frac{1}{a_w} \le \frac{1}{rb_h} \overset{\text{(10)}}{\implies} s_h \ge s_w
\end{equation}$$

One can read this intuitively as:

> Fit-width solution has at least as many rows and columns, so at least as many squares, thus their side length cannot increase.

This was simple. For $b_w < b_h$ it is a bit more involved:

$$\begin{equation} \tag{17}
\begin{split}
&b_w < b_h \implies rb_w < rb_h \\[0.5em]
&\text{From (9), } a_w \ge rb_w. \text{ By total ordering:} \\
&\begin{aligned}\enspace \text{(1)} \quad rb_h > a_w \ge rb_w \implies \frac{1}{a_w} \gt \frac{1}{rb_h} \implies s_w \gt s_h
\end{aligned} \\
&\begin{aligned}\enspace \text{(2)} \quad
    &a_w \ge rb_h \ge rb_w \text{:} \\
    &b_w < b_h \implies \frac{n}{b_w} > \frac{n}{b_h} \implies a_w > \frac{n}{b_h} \\
    &a_w \ge rb_h \land a_w > \frac{n}{b_h} \overset{\text{(9)}}{\implies} (a_w, b_h) \text{ fit-width, same solution} \overset{\text{(16)}}{\implies} s_h \ge s_w
\end{aligned}
\end{split}
\end{equation}$$

Read $\text{(17)}$ as:

> 1. Fit-width solution has at most as many columns than the fit-height solution but stretches them out more.
> 1. Fit-width solution can be extended to have as many rows as a fit-height solution but by comparison may not fully stretch them out.

Note that the results above apply for any $r$.

Fourth and finally, when $r \ge 1$ if the minimal fit-width solution is strictly better than any fit-height solution, then it is [unique (see appendix for proof)](#uniqueness-of-fit-width-solution-when), i.e. has only one single corresponding point. Symmetrically for $r \lt 1$ the same applies for the fit-height solution.

We can now conclude some facts which highlight why the first algorithm fails:

Here is [the Desmos visualizer][1] used for the graphs in the document. 

We need a starting point for the algorithm. Let's pick one that ensures $\text{(4)}$ holds, which was broken by algorithm 1:

$$\begin{align*} n \le \lfloor \frac{w}{s} \rfloor \cdotp \lfloor \frac{h}{s} \rfloor \iff & n \le a \lfloor \frac{h}{s} \rfloor \\ \iff &\frac{n}{a} \le \lfloor \frac{h}{s} \rfloor \\ \overset{(*)}{\iff} &\lceil \frac{n}{a} \rceil \le \lfloor \frac{h}{s} \rfloor \\ \overset{(**)}{\iff} &\lceil \frac{n}{a} \rceil \le \frac{h}{s} \\ \iff &\lceil \frac{n}{a} \rceil \frac{w}{h} \le \frac{w}{s} \\ \iff &a \ge r\lceil\frac{n}{a}\rceil \tag{13} \end{align*}$$


$\text{(*)}$ and $\text{(**)}$ hold because $\lfloor \cdot \rfloor$ and $\lceil \cdot \rceil$ are [residuated mappings](#proof-that--and--are-residuated-mappings).

We have proven in other words that $s \in \text{Sol}_{a} \iff a \ge r \lceil \frac{n}{a} \rceil$. How is this helpful? Let's look at the initial assumptions:

In the last algorithm the approach was: ensure $bs \le h$ holds by picking $b = \lfloor h/s \rfloor$ and then readjust if $n \le ab$ doesn't hold. What if this time we do the opposite: ensure $n \le ab$ holds and adjust such that $bs \le h$ holds?

$\text{(13)}$ confirms this works: it provides the fixed $b = \lceil n/a \rceil$, respecting the $b \ge \frac{n}{a}$ constraint, and the equivalence implies that $a < rb \implies bs > h \implies s \notin \text{Sol}$. We can use this to build a new algorithm:

```javascript
const r = w / h
let a = Math.ceil(Math.sqrt(r * n))
let b = Math.ceil(n / a)
let s = w / a
while (b * s > h) {
    a = a + 1
    b = Math.ceil(n / a)
    s = w / a
}
return s
```

The invariant of the loop is $b = \lceil n/a \rceil \land a = ws$. When the loop ends, $b = \lceil n/a \rceil \land a = ws \land bs \le h$, implying that $s \in \text{Sol}_a$. The loop terminates, since both $b$ and $s$ decrease:

$$
\begin{align*} \frac{s_{next}}{s} = \frac{a}{a + 1} < 1 \end{align*} \\[1em]
\begin{align*} \frac{b_{next}}{b} = \frac{\lceil \frac{n}{a + 1} \rceil}{\lceil \frac{n}{a} \rceil} < \frac{a}{a + 1} \cdotp \frac{n}{n + a} < 1 \end{align*}
$$

Finally, it must be that $s = \max \text{Sol}_a$, which is what we care about: $s$ always decreases, the loop tests all possible $s$ starting from the greatest one possible (by construction, see $\text{(2)}$) and terminates on the first value which satisfies the constraint; if $s$ is not maximal, then it means that the loop iterated while $bs \le h$, a contradiction.

We can compress the code by using an equivalent invariant with the help of $\text{(14)}$:

```javascript
const r = w / h

let a = Math.ceil(Math.sqrt(r * n))
let b = Math.ceil(n / a)
while (a < r * b) {
    a = a + 1
    b = Math.ceil(n / a)
}

return w / a
```

The new loop condition removes the repeated computation of $s$ and makes analyzing the runtime a bit easier. Let's denote $a_0 = \lceil \sqrt{rn} \rceil$ the starting value of $a$. Since the loop condition is $a < rb$, $a$ will be incremented at most $\lceil rb - a_0 \rceil$ times. $b = \lceil n/a \rceil$ and since $a$ increases $b \le \lceil n/a_0 \rceil$. We can now count iterations:

$$\begin{align*} \lceil rb - a_0 \rceil < \thickspace &r \lceil \frac{n}{a_0} \rceil - a_0 + 1 \\ < \thickspace &r \frac{n}{a_0} + r -a_0 + 1 \\ = \thickspace &r\frac{n}{\lceil \sqrt{rn} \rceil} + r - \lceil\sqrt{rn}\rceil + 1 \\ < \thickspace &\frac{rn}{\sqrt{rn}} + r - \sqrt{rn} + 1 \\ = \thickspace &r + 1\tag{15} \end{align*}$$

This means at most $\lfloor r \rfloor + 1$ iterations and a runtime of $\mathcal{O}(r)$, dependent only on the aspect ratio of the grid. Here would be the full code:

```javascript
const r = w / h

let wa = Math.ceil(Math.sqrt(r * n))
let wb = Math.ceil(n / wa)
while (wa < r * wb) {
    wa++
    wb = Math.ceil(n / wa)
}

let hb = Math.ceil(Math.sqrt(n / r))
let ha = Math.ceil(n / hb)
while (hb < ha / r) {
    hb++
    ha = Math.ceil(n / hb)
}

return Math.max(w / wa, h / hb)
```

Notice that for the second loop the runtime is $\mathcal{O}(\lfloor \frac{1}{r} \rfloor)$, which implies that for $w \ge h$ grids it probably never runs, and vice-versa for the first loop when $h > w$. Proving this would also prove that the first algorithm only ever returns $w / a$ or $h / b$. In fact, $\text{(15)}$ proves that a number of values strictly lower than $r$ is checked, so at most $\lfloor r \rfloor$. Then for tall containers, $\lfloor r \rfloor = 0$, while for wide containers $\lfloor 1/r \rfloor$ = 0. If the loop doesn't execute, then all solution conditions are fulfilled. Right?

With a correct algorithm and good understang of why it works, we conclude here.

## Appendix

### Uniqueness of fit-width solution when $r \ge 1$

$\text{(9)}$ implies that for $b$ rows the minimal $a$ such that $(a, b)$ is a fit-width solution is:

$$\begin{gather*}
a = \max \Set{ \lceil\frac{n}{b}\rceil, \lceil rb \rceil }
\end{gather*}$$

Thus the minimal fit-width point is determined by:

$$\begin{equation} \tag{*}
a = \underset{b \in \N}{\min}\Set{ \max \Set{ \lceil \frac{n}{b} \rceil, \lceil rb \rceil }}
\end{equation}$$

This makes $a$ purely a function of $b$. This formula and a similar one for minimal fit-height solutions are used in [the Desmos visualizer][1] to plot minimal points for each $a$ and $b$ on the graph.

We now have all we need to begin the proof.

Assume towards a contradiction that there exist two $(a, b), (a, b')$ minimal fit-width points, $b < b'$, with $s_w > s_h$ for all fit-height points $(a_h, b_h)$. Assume $r \ge 1$.

Since they points are minimal, it follows from $\text{(*)}$ that:

$$\begin{align*}
a = \max\Set{ \lceil \frac{n}{b} \rceil, \lceil rb \rceil } = \max\Set{ \lceil \frac{n}{b'} \rceil, \lceil rb' \rceil }
\end{align*}$$

Without further deliberation, there are four situations we would have to tackle:
1. $a = \lceil rb \rceil = \lceil rb' \rceil$
1. $a = \lceil \frac{n}{b} \rceil = \lceil \frac{n}{b'} \rceil$
1. $a = \lceil rb \rceil = \lceil \frac{n}{b'} \rceil$
1. $a = \lceil \frac{n}{b} \rceil = \lceil rb' \rceil$

Intuitively, the first two shouldn't happen due to the monotonicity of $rx$ and $\frac{n}{x}$. The third one also shouldn't happen, since $(a, b)$ is around $(x_0, y_0)$, where $b' > b$ would imply $\frac{n}{b'} < rb$. Only the fourth case seems legitimate. Let's confirm our intuition formally.

Disproving case 1 is easy:

$$\begin{align*}
b < b' \implies rb < rb' \implies &rb < \underbrace{rb + 1 \le r(b + 1)}_{\text{from }r \ge 1} \le rb' \\
    \implies &\lceil rb \rceil \lt \lceil rb \rceil + 1 \le \lceil rb' \rceil \\
    \implies &\lceil rb \rceil < \lceil rb' \rceil \text{ contradiction}

\end{align*}$$

One would think disproving case 2 would be just as easy since it's still about monotonicity. Knowing that $r \ge 1$ helped tremendously above; doing the same for $\frac{n}{x}$ results in just $\lceil \frac{n}{b} \rceil \ge \lceil \frac{n}{b'} \rceil$. We need to get rid of the equality to actually have a contradiction, so let's find a sufficient condition for strict inequality:

$$\begin{align*}
b < b' \implies \frac{n}{b} > \frac{n}{b'} \implies &\frac{n}{b} > \frac{n}{b + 1} \ge \frac{n}{b'} \\
\overbrace{\frac{n}{b} \ge \frac{n}{b + 1} + 1}^{\text{condition candidate}} > \frac{n}{b + 1} \ge \frac{n}{b'} \implies &\lceil \frac{n}{b} \rceil \ge \lceil \frac{n}{b + 1} \rceil + 1 \ge \lceil \frac{n}{b'} \rceil \\
\implies &\lceil \frac{n}{b} \rceil > \lceil \frac{n}{b'} \rceil
\end{align*}$$

Perfect! When does this happen?

$$\begin{align*} \tag{**}
\frac{n}{b} \ge \frac{n}{b + 1} + 1 \iff &\frac{n - b}{b} \ge \frac{n}{b + 1} \\
    \iff &b^2 + b - n \le 0 \\
    \iff &b \le \frac{\sqrt{1 + 4n} - 1}{2} \\
    \overset{\text{rm.}}{\iff} &b \le \lfloor \sqrt{\frac{1}{4} + n} - \frac{1}{2} \rfloor
\end{align*}$$

Great. (I'm marking usage of [residuated mapping properties](#and--are-residuated-mappings) with $\text{rm.}$ since it's a subtle change easy to misuse). Is our $b$ smaller than that?

$$\begin{align*}
a = \lceil \frac{n}{b'} \rceil \overset{\text{(*)}}{\implies} \lceil \frac{n}{b'} \rceil \ge \lceil rb' \rceil \implies &\lceil \frac{n}{b'} \rceil \ge \overbrace{rb' \ge b'}^{r \ge 1} \\
    \implies &\frac{n}{b'} + 1 > b' \\
    \implies &b'^2 - b' - n < 0 \\
    \implies &b' < \frac{\sqrt{1 + 4n} + 1}{2} \\
    \overset{\text{rm.}}{\implies} &b' \le \lfloor \sqrt{\frac{1}{4} + n} + \frac{1}{2} \rfloor \\[1em]
\end{align*}$$

$$\begin{align*}
b < b' \implies &b \le \lfloor \sqrt{\frac{1}{4} + n} + \frac{1}{2} \rfloor - 1 \\
    \implies &b \le \lfloor \sqrt{\frac{1}{4} + n} - \frac{1}{2} \rfloor \\
    \overset{\text{(**)}}{\implies} &\frac{n}{b} \ge \frac{n}{b + 1} + 1 \\
    \implies &\lceil \frac{n}{b} \rceil > \lceil \frac{n}{b'} \rceil \text{ contradiction}
\end{align*}$$

Yes, disproven! We can proceed with a counterproof for case 3, which is trivial:

$$\begin{align*}
a = \lceil \frac{n}{b'} \rceil \overset{\text{(*)}}{\implies} &\lceil \frac{n}{b'} \rceil \ge \lceil rb' \rceil \\
    \implies &\lceil \frac{n}{b} \rceil \ge \lceil \frac{n}{b'} \rceil \ge \overbrace{\lceil rb' \rceil > \lceil rb \rceil}^{\text{strict, see case 1}} \\
    \implies & \lceil \frac{n}{b} \rceil > \lceil rb \rceil \\
a = \lceil rb \rceil \overset{\text{(*)}}{\implies} &\lceil \frac{n}{b} \rceil \le \lceil rb \rceil \text{ contradiction}
\end{align*}$$

Finally we are left with only case 4, $a = \lceil rb' \rceil = \lceil \frac{n}{b} \rceil$, the only one speculated to make sense.

To get an idea of what to prove, look at [graph C](#graph-c) again: there are two minimal fit-width points with equivalent solutions. Those points do not give the best solution: $a_w = 12 > rb_h = 3.9 \cdot 3$. Notice that one solution has $b_w = b_h$. Empirical observation on multiple parameters seems to always exhibit this, so let's prove that there is _always_ an equivalent or better fit-height solution if $(a, b), (a, b')$ as chosen above are valid solutions.

Let's begin: since $(a, b)$ and $(a, b')$ are fit-width solutions, by $\text{(9)}$ the following holds:

$$\begin{equation} \tag{***}
\begin{split}
&n \le ab \land a \ge rb \\
&n \le ab' \land a \ge rb'
\end{split}
\end{equation}$$

Let $(a_h = \lceil \frac{n}{b'} \rceil, b_h = b')$. If $(a_h, b_h)$ is a fit-height point, $\text{(9)}$ must hold true:

$$\begin{align*}
n \le a_hb_h \land a_h \le rb_h
\end{align*}$$

The first condition is trivially true by construction. We tackle the second.

$$\begin{align*}
a_h \le rb_h \iff &\lceil \frac{n}{b'} \rceil \le rb' \\
    \overset{\text{rm.}}{\iff} & \lceil \frac{n}{b'} \rceil \le \lfloor rb' \rfloor
\end{align*}$$

Whether $rb'$ is an integer or not changes the ceiling and floor result. Starting with $rb' \in \N$:

$$\begin{align*}
rb' \in \N \implies &a = rb' \\
    \overset{\text{(***)}}{\implies} &n \le brb' \\
    \implies &\frac{n}{b'} \le rb < rb' \\
    \overset{\text{rm.}}{\implies} &\lceil \frac{n}{b'} \rceil \le rb' \implies a_h \le rb_h
\end{align*}$$

The fit-height solution condition holds. For $rb' \notin \N$ let now $F = \lfloor rb' \rfloor$ and recall that $b' \ge b + 1 > b$ by assumption. Then:

$$\begin{gather*}
\begin{align*}
(i) \enspace &a = \lceil rb' \rceil = F + 1 \\
(ii) \ &F = \lfloor rb' \rfloor \ge \underbrace{\lfloor r(b + 1) \rfloor \ge b + 1}_{r \ge 1} \implies \frac{F}{b + 1} \ge 1 \\[2em]
& \begin{align*}
\frac{n}{b'} \overset{\text{(***)}}{\le} \frac{ab}{b'} &\overset{\text{(i)}}{=} \frac{(F + 1)b}{b'} \\
    &\le \frac{(F + 1)b}{b + 1} \\
    &= F\frac{b}{b + 1} + \frac{b}{b + 1} \\
    &= F\frac{(b + 1) - 1}{b + 1} + \frac{b}{b + 1} \\
    &= F - \frac{F}{b + 1} + \underbrace{\frac{b}{b + 1}}_{<1} \\
    &\overset{\text{(ii)}}{\le} F - 1 + 1 = F
\end{align*} \\
&\begin{align*}
\frac{n}{b'} \le F \overset{\text{rm.}}{\iff} &\lceil \frac{n}{b'} \rceil \le \lfloor rb' \rfloor \\
    \overset{\text{rm.}}{\iff} &\lceil \frac{n}{b_h} \rceil \le rb_h \iff a_h \le rb_h
\end{align*}
\end{align*}
\end{gather*}$$

With this we have shown that $\text{(9)}$ holds for $(a_h = \lceil \frac{n}{b'} \rceil, b_h = b')$, meaning that $(a_h, b_h)$ is a valid fit-height point. We assumed at the beginning that $s_w > s_h$. But:

$$\begin{align*}
a \ge rb' \iff \frac{1}{a} \le \frac{1}{rb_h} \iff s_w \le s_h \text{ contradiction}
\end{align*}$$

All four cases contradict our assumptions. In conclusion, if $(a, b)$ is a minimal fit-width point with $s_w > s_h$ for all valid fit-height $(a_h, b_h)$ points, it must be unique.

Fun fact: the idea for disproving case 2 came from the intuition that since $n = \sqrt{n}^2$, dividing $n$ by $b < b' < \sqrt{n}$ should mostly produce distinct results, as the value grows quicker and quicker as $b$ approaches zero. $\text{(**)}$ implies exactly that:

$$\begin{align*}
b \le \lfloor \sqrt{\frac{1}{4} + n} - \frac{1}{2} \rfloor \le \lfloor \sqrt{(\frac{1}{2} + \sqrt{n})^2} - \frac{1}{2} \rfloor = \lfloor \sqrt{n} \rfloor
\end{align*}$$



### Using binary search in the second algorithm

Recall that $a_w \in \N$ is part of a feasible solution if and only if $\lceil \frac{n}{a_w} \rceil \le \lfloor \frac{a_w}{r} \rfloor$. Moreover, according to $\text{(15)}$ the algorithm always finds a solution after $\lfloor r \rfloor + 1$ iterations, thus $a_0 \le a_w \lt a_0 + r + 1$, where $a_0 = \lceil \sqrt{rn} \rceil$ is the starting value for $a_w$.

We can binary search over that interval using the feasability condition. If the midpoint is not feasible, we search in the left half, since we're not yet in the solution space, otherwise we search in the right half, since we want the minimal solution. Here is the algorithm:

```javascript
const r = w / h

let left = Math.ceil(Math.sqrt(r * n))
let right = Math.ceil(left + r + 1)

while (left < right) {
    const mid = Math.floor(left + (right - left) / 2)
    if (Math.ceil(n / mid) <= Math.floor(mid / r)) {
        right = mid 
    } else {
        left = mid + 1
    }
}

return w / left
```

Upper bound ceiled so interval is open. `left` stores $a_w$. This reduces the asymptotic runtime to $\mathcal{O}(\log r)$. Useful for very large ratios but very large ratios seem utterly useless.

### Filling the grid as an integer optimization problem

By rearranging the solution constraints in $\text{(14)}$ we can reformulate the problem as an [integer programming](https://en.wikipedia.org/wiki/Integer_programming) one:

$$\begin{align*}  \underset{a, b \in \N}{\text{minimize}} \quad &a \\ \text{subject to} \quad & ab \ge n \\ &a \ge rb \end{align*}$$

The first algorithm attempts to solve it naively by relaxing the integer constraint and adjust the obtained solution if it's not feasible. As proven, the algorithm is not optimal.

We can further work it into a 1D integer optimization problem over a convex function by searching $a$ using arbitrary $b$, to be able to solve it using [lattice reduction](https://en.wikipedia.org/wiki/Lattice_reduction):

$$\begin{align*} a = \underset{b \in \N}{\min} \set{\max \set{\lceil rb \rceil, \lceil \frac{n}{b} \rceil} } \end{align*}$$

For this particular problem it's overkill, the algorithm developed here is way simpler and equally correct. I presented this approach because this last formulation is used in the [Desmos visualizer](https://www.desmos.com/calculator/lkigtugg1f) to plot the solution candidates.

It also places the problem in context – I've always had it in the back of my mind that there must be a higher-level way to approach it, even though it ended up not being (too) useful.

### $\lfloor \cdot \rfloor$ and $\lceil \cdot \rceil$ are residuated mappings

This means that, for $\forall x \in \R, n \in \N$:
1. $n \le x \iff n \le \lfloor x \rfloor$
1. $x \le n \iff \lceil x \rceil \le n$
1. $n < x \iff n < \lceil x \rceil$
1. $x < n \iff \lfloor x \rfloor < n$

To prove the first, if $x \in \N$ then clearly $n \le \lfloor x \rfloor = x$, else if $x \in \R \setminus \N$:

$$\begin{align*}n \le x \iff n < x \iff &n < \lfloor x \rfloor + \{x\} \\ \iff &n \le \lfloor x \rfloor \lor (\lfloor x \rfloor < n < \lfloor x \rfloor + \{x\}) \\ \overset{\{x\} < 1}{\iff} &n \le \lfloor x \rfloor \lor (\lfloor x \rfloor < n < \lfloor x \rfloor + 1) \\ \overset{n \in \N}\iff &n \le \lfloor x \rfloor \end{align*}$$

To prove the second, if $x \in \N$ then clearly $x = \lceil x \rceil \le n$, else if $x \in \R \setminus \N$:

$$\begin{align*} x \le n \iff x < n \iff &\lfloor x \rfloor + \{x\} < n \\ \iff &\{x\} < n - \lfloor x \rfloor \\ \iff & 1 \le n - \lfloor x \rfloor \\ \iff & \lfloor x \rfloor + 1 \le n \\ \iff & \lceil x \rceil \le n\end{align*}$$

The others are proven in a similar fashion. Read more about this on [Wikipedia's "Equivalences" for floor and ceiling](https://en.wikipedia.org/wiki/Floor_and_ceiling_functions#Equivalences). These are standard properties but I insisted on writing them here as a "note to self" since I've confused myself and applied them wrong way too many times. I probably know that Wikipedia page now by heart.

[1]: https://www.desmos.com/calculator/fa3g7kanmh
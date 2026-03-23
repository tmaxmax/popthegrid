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

The algorithm always succeeds at finding $S$ when neither $s_a$ nor $s_b$ give the fallback value. In that case both $s_a$ and $s_b$ maximize $s$ with respect to width or to height, so by construction one of them must be $S$. When fallback values are used, it may fail. For example, inputs $w = 10, h = 2, n = 8$ expect $S = 1.25$ but this algorithm gives $S = 1$.

Let's see what's the issue by inspecting the value of $b = \lceil h/s \rceil$ in $\text{(5.ii)}$. We'll use $\forall x \thickspace . \thickspace x \le \lceil x \rceil < x + 1$ quite a bit; we'll also define $r = w/h$ the ratio of the dimensions to simplify the formulas.

$$\begin{align*} &b = \lceil \frac{h}{s} \rceil = \lceil \frac{h}{w}a \rceil = \lceil \frac{h}{w} \lceil \sqrt{\frac{w}{h}n} \rceil \rceil \\ \implies & \frac{1}{r} \lceil \sqrt{rn} \rceil \leq b < \frac{1}{r} \lceil \sqrt{rn} \rceil + 1 \\ \implies & \frac{1}{r} \sqrt{rn} \le b < \frac{1}{r}\sqrt{rn} + \frac{1}{r} + 1 \\ \implies &\sqrt{\frac{n}{r}} \le b < \sqrt{\frac{n}{r}} + \frac{1}{r} + 1 \\ \implies &\lceil \sqrt{\frac{n}{r}} \rceil \le b \le \lfloor \sqrt{\frac{n}{r}} + \frac{1}{r} + 1 \rfloor \tag{9} \end{align*}$$

The last implication might not be straightforward, unless you are familiar with [residuated mappings](https://en.wikipedia.org/wiki/Residuated_mapping), which I am not. To prove it, observe that for $x \in \R$ and for $n \in \N$ when $n \le x$, if $x \in \N$ too then clearly $n \le \lfloor x \rfloor = x$. If $x \in \R \setminus \N$:

$$\begin{align*}n \le x \iff n < x \iff &n < \lfloor x \rfloor + \{x\} \\ \iff &n \le \lfloor x \rfloor \lor (\lfloor x \rfloor < n < \lfloor x \rfloor + \{x\}) \\ \overset{\{x\} < 1}{\iff} &n \le \lfloor x \rfloor \lor (\lfloor x \rfloor < n < \lfloor x \rfloor + 1) \\ \overset{n \in \N}\iff &n \le \lfloor x \rfloor \tag{10} \end{align*}$$

Notice that the lower bound is precisely the $b$ used to compute $s_b$, so the number of rows which maximizes $s$ and fills the height of the container. Moreover, this $b$ may not give $S = \max \text{Sol}$: in the example above, $b = 1$ but $S = 1.25$.

The upper bound looks like it _can_ be equal to the lower bound, which would imply $b = \lceil \sqrt{\frac{n}{r}} \rceil$. Let's see when this happens:

$$ \begin{align*} &m \coloneqq \sqrt{\frac{n}{r}} \qquad M \coloneqq \lceil m \rceil
\\ b = M \iff &M = \lfloor m + \frac{1}{r} + 1\rfloor \\ \iff &M \le m + \frac{1}{r} + 1 < M + 1 \\ \overset{\lceil x \rceil < x + 1}{\iff} &m + \frac{1}{r} + 1 < M + 1 \\ \iff &m + \frac{1}{r} < M  \\ \iff &(m \in \N \land m + \frac{1}{r} < m) \\ \lor \thickspace &(m \notin \N \land \lfloor m \rfloor + \{m\} + \frac{1}{r} < \lfloor m \rfloor + 1) \\ \iff &m \notin \N \land \{m\} + \frac{1}{r} < 1 \tag{11} \end{align*}$$

But can it ever be in the fallback case that $m \in \N$?

$$\begin{align*} m \in \N \implies &\sqrt{\frac{h}{w}n} \in \N \\ \implies &\exist p \thickspace . \thickspace n = \frac{w}{h}p^2 \\ \implies &a = \lceil \sqrt{\frac{w}{h}{n}} \rceil = \lceil \sqrt{\frac{w^2}{h^2}p^2} \rceil = \frac{w}{h}p \\ \implies &s = \frac{w}{a} = \frac{h}{p} \\ \implies &\frac{h}{s} = \lceil \frac{h}{s} \rceil = p \end{align*}$$

Contradicts $\text{(6)}$ which states $\frac{h}{s} < \lceil \frac{h}{s} \rceil$, so if $m \in \N$ we can't be in the fallback case. Therefore, $\text{(11)}$ simplifies to:

$$\begin{gather*} f_n : \R^{+} \rarr \R,\thickspace r \mapsto 1 - \frac{1}{r} - \{\sqrt{\frac{n}{r}}\} \\ b = \lceil \sqrt{\frac{h}{w}n} \rceil \iff f_n(r) > 0 \tag{12} \end{gather*}$$

It is an [insane function](https://www.desmos.com/calculator/ttdbpcc54p). For $h > w$ we would have instead:

$$f'_{n} : \R^{+} \rarr \R, \thickspace r \mapsto 1 - r - \{\sqrt{nr}\}$$

This proves that $f_n(\frac{w}{h}) > 0 \implies S \in \Set{\frac{w}{a}, \frac{h}{b} }$, depending on which value exists, even if the other doesn't, which means that if the value chosen is not maximal no other value is explored. I speculate it could be provable that $n > a\lfloor\frac{h}{w}a\rfloor \implies n \le b\lfloor\frac{w}{h}b\rfloor$ and the same but starting from $b$, which would mean that $S \in \Set{\frac{w}{a}, \frac{h}{b} }$ always.

We conclude that this fallback solution does not always work. Let's find another way to determine $s$ when $\text{(2)}$ doesn't yield a valid solution.

We start by reformulating the requirement every $s \in \text{Sol}$ fulfills, $\text{(4)}$, again adapted for a solution in $\text{Sol}_{a}$, so $as = w$. 

$$\begin{align*} n \le \lfloor \frac{w}{s} \rfloor \cdotp \lfloor \frac{h}{s} \rfloor \iff & n \le a \lfloor \frac{h}{s} \rfloor \\ \iff &\frac{n}{a} \le \lfloor \frac{h}{s} \rfloor \\ \overset{(*)}{\iff} &\lceil \frac{n}{a} \rceil \le \lfloor \frac{h}{s} \rfloor \\ \overset{(10)}{\iff} &\lceil \frac{n}{a} \rceil \le \frac{h}{s} \\ \iff &\lceil \frac{n}{a} \rceil \frac{w}{h} \le \frac{w}{s} \\ \iff &a \ge r\lceil\frac{n}{a}\rceil \tag{13} \end{align*}$$

$\text{(*)}$ is a similar equivalence to $\text{(10)}$. For any $x \in \R$ and $n \in \N$ where $x \le n$, if $x \in \N$ too then clearly $x = \lceil x \rceil \le n$. If $x \in \R \setminus \N$:

$$\begin{align*} x \le n \iff x < n \iff &\lfloor x \rfloor + \{x\} < n \\ \iff &\{x\} < n - \lfloor x \rfloor \\ \iff & 1 \le n - \lfloor x \rfloor \\ \iff & \lfloor x \rfloor + 1 \le n \\ \iff & \lceil x \rceil \le n\end{align*}$$

We have proven in other words that $s \in \text{Sol}_{a} \iff a \ge r \lceil \frac{n}{a} \rceil$. How is this helpful? Let's look at the initial assumptions:

$$\begin{equation} \tag{14} n \le ab \land as = w \land bs \le h \iff b \ge \frac{n}{a} \land a \ge rb \land s = \frac{w}{a} \end{equation}$$

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

$$\begin{align*} \lceil rb - a_0 \rceil < \thickspace &r \lceil \frac{n}{a_0} \rceil - a_0 + 1 \\ < \thickspace &r \frac{n}{a_0} + r -a_0 + 1 \\ = \thickspace &r\frac{n}{\lceil \sqrt{rn} \rceil} + r - \lceil\sqrt{rn}\rceil + 1 \\ < \thickspace &\frac{rn}{\sqrt{rn}} + r - \sqrt{rn} \\ = \thickspace &r \tag{15} \end{align*}$$

This gives a runtime of $\mathcal{O}(\lfloor r \rfloor)$, dependent only on the aspect ratio of the grid. Here would be the full code:

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

### TODO

- Attempt a rigorous proof of the fact the first algorithm returns (perhaps most times, if not every time) only the maximum values as derived in $(2)$. This also includes a proof of the fact that the second branches of $s_a$ and $s_b$ are always smaller or equal to those values, and that one of those values will always be valid, i.e. the grid can _always_ be filled in a way to either fully cover it height-wise or length-wise.
- Attempt to prove that when the solution from $(2)$ fails to fit the optimal solution is never found when trying to fill the other dimension (or in other words if algorithm 2 enters the `while` loop for a branch the solution will be there). Could be false but can't say without proof or counterexample.
- Attempt a stricter bound for algorithm 2 iteration count, $r/2$ seems possible, and also a proof that the bound is (not) tight. Would be interesting to perhaps find the decrease rate of $b$.
- I speculate there should be a higher level of abstraction to work with these concepts: some patterns keep reemerging (around flooring and ceiling, for example) and attempts to prove the statements felt like being in the trenches of math. After finishing the document as it stands today, I questioned ChatGPT about the last algorithm and before it switched to the dumb version since I don't have a subscription it blabbered something about walking on lattices, even stricter runtime bounds by "actually using the discontinuous nature of ceil", $\mathcal{O}(\sqrt{n})$ algorithms and Dirichlet hyperbola method. See if/how these concepts relate to this algorithm, provided the LLM didn't just spit out nonsense.
<header>

# Filling the grid

**A rigorous proof**

</header>

For $n \in \mathbb{N}$ the number of squares and $r = \frac{w}{h}$ the ratio of the container's dimensions let the sets:

$$
\begin{gathered}
W = \left\{ (a, b) \in \mathbb{N}^2 : n \le ab \land a \ge rb \right\} \\
H = \left\{ (a, b) \in \mathbb{N}^2 : n \le ab \land a \le rb \right\}
\end{gathered}
$$

**Claim:** The optimal solution for the side length of the squares is:

$$
s = \max_{1 \le b \le n} \min \left\{ \frac{w}{\left\lceil \frac{n}{b} \right\rceil}, \frac{h}{b} \right\}.
$$

**Proof:** $W \cup H = \left\{ (a, b) \in \mathbb{N}^2 : n \le ab \right\}$, all possible grid configurations.<br>
For every $(a = \left\lceil \frac{n}{b} \right\rceil, b)$ with $b \le n$ let $s = \min \left\{ \frac{w}{a}, \frac{h}{b} \right\}$. Clearly, $n \le ab$ always, hence
$s = \frac{w}{a} \le \frac{h}{b} \iff a \ge rb \iff (a, b) \in W$ and similarly $s = \frac{h}{b} \iff (a, b) \in H$. Moreover, $a$ is the minimal choice such that $(a, b) \in W \cup H$.<br>Any $a' > a$ gives $s' = \min \left\{ \frac{w}{a'}, \frac{h}{b} \right\} \le \min \left\{ \frac{w}{a}, \frac{h}{b} \right\} = s$. Any $b' > n$ gives $s' \le \min \left\{ w, \frac{h}{n} \right\}$, which is $s$ for $(a = 1, b = n)$, therefore $s' \le s$ for some $s$ with $b \le n. \blacksquare$

**Claim:** If $(a, b) \in H$ then $b \ge b_0 = \left\lceil \sqrt{\frac{n}{r}} \right\rceil$. <br>
**Proof:**

$$
(a, b) \in H \implies \frac{n}{b} \le a \le rb \implies b \ge \sqrt{\frac{n}{r}} \overset{b \in \mathbb{N}}{\implies} b \ge b_0. \blacksquare
$$

**Claim:** For $r \ge 1$ and $b \in \mathbb{N}$, if $b \ge b_0 + 1$ then $(a, b) \in H$ for some $a \in \mathbb{N}$.<br>
**Proof:**

$$
(a, b) \in H \iff \frac{n}{b} \le a \le rb \iff \left\lceil \frac{n}{b} \right\rceil \le  rb.
$$

When $b \ge b_0 + 1$, $\left\lceil \frac{n}{b} \right\rceil \le \left\lceil \frac{n}{b_0 + 1} \right\rceil$ and $r(b_0 + 1) \le rb$, so it suffices to show the comparison holds for $b = b_0 + 1$. Suppose not; since $r \ge 1$:

$$
r(b_0 + 1) < \left\lceil \frac{n}{b_0 + 1} \right\rceil \implies rb_0 + 1 < \frac{n}{b_0 + 1} + 1
    \implies \sqrt{{b_0}^2 + b_0} < \sqrt{\frac{n}{r}} \le b_0.
$$

Contradiction. $\blacksquare$

**Corollary:** For $r \ge 1$ if $(a_h, b_h) \in H$ maximizes $s_h = \frac{h}{b_h}$ then $b_h \in \left\{ b_0, b_0 + 1 \right\}$.<br>
**Proof:** $b_h \ge b_0$ always; when $r \ge 1$ for every $b \ge b_0 + 1$ there is $a$ such that $(a, b) \in H$. Maximized $s_h$ means minimal $b_h$, hence $b_h \in \left\{ b_0, b_0 + 1 \right\}. \blacksquare$

**Claim:** For $r \ge 1$, $(a_w, b_w) \in W$, $(a_h, b_h) \in H$ with $s_h$ maximized, if $s_w = \frac{w}{a_w}$ is maximized and $s_w > s_h$ then $b_w \in \left\{ b_0 - 1, b_0 \right\}$. <br>
**Proof:** Every $(a_w, b_w) \in W$ has $a_w \ge rb_w \ge r$. If $b_h = 1$ then $a_w \ge rb_h$, meaning $s_w \le s_h$ for every $(a_w, b_w)$.<br>
If $b_h > 1$ choose $(a_w, b_w)$ with $b_w = b_h - 1$ and $a_w = \left\lceil \frac{n}{b_w} \right\rceil$. Since $b_w < b_h$ and $b_h$ is minimal, $(a_w, b_w) \notin H$, but $n \le a_wb_w$ by construction, so $(a_w, b_w) \in W$.<br>
If $(a, b) \in W$ with $a < a_w$ exists then:

$$
\begin{align*}
a < \left\lceil \frac{n}{b_h - 1} \right\rceil \le \left\lceil \frac{ab}{b_h - 1} \right\rceil \implies &a < \frac{ab}{b_h - 1} \implies b \ge b_h \\
    \implies &a_w > a \ge rb \ge rb_h \implies \frac{w}{a_w} < \frac{h}{b_h} \\
    \implies &s_w < s_h.
\end{align*}
$$

Hence $(a, b) \in W \land s_w > s_h \implies a \ge a_w$. Thus under $s_w > s_h$ this choice of $a_w$ maximizes $s_w$ and by the previous corollary has $b_w \in \left\{ b_0 - 1, b_0 \right\}. \blacksquare$

**Claim:** For $r \ge 1$ the optimal side length is:

$$
s = \max_{\substack{b_0 - 1 \le b \le b_0 + 1 \\[0.1em] b > 0}} \min \left\{\frac{w}{\left\lceil \frac{n}{b} \right\rceil}, \frac{h}{b} \right\}
$$

For $r \le 1$ solve for $r' = \frac{1}{r}$. This procedure finds solutions for every $r \in (0, \infty)$.

**Proof:** For $r \ge 1$, above has been shown that the optimal $s_h$ corresponds to $b_h \in \{ b_0, b_0 + 1 \}$ and the optimal $s_w$ to $b_w \in \{ b_0 - 1, b_0 \}$, hence $s = \max \{ s_w, s_h \}$ corresponds to $b \in \{ b_0 - 1, b_0, b_0 + 1 \}$. The first formula, proven to always find the optimal $s$, is simply restricted to a smaller range, proven to contain the optimal $s$.

Let $s_{w,h}(a, b) = \min \left\{ \frac{w}{a}, \frac{h}{b} \right\}$ the side length of $(a, b) \in W \cup H$. Let $r' = \frac{h}{w} = \frac{1}{r}$, $W'$ and $H'$ defined as $W$ and $H$ but with $r'$ substituted for $r$. $s_{h,w}$ is the side length of $(a, b) \in W' \cup H'$. Finally, let the symmetry function $\phi(a, b) = (b, a)$. It follows that:

$$
\begin{gathered}
(a, b) \in W \iff \phi(a, b) \in H' \\
(a, b) \in H \iff \phi(a, b) \in W' \\
s_{w,h}(a, b) = \min \left\{ \frac{w}{a}, \frac{h}{b} \right\} = \min \left\{  \frac{h}{b}, \frac{w}{a} \right\} = s_{h,w}(b, a) = s_{h,w}(\phi(a, b)). 
\end{gathered}
$$

$\phi$ bijectively maps $W$ to $H'$ and $H$ to $W'$ while preserving side lengths. Therefore the solution for $r'$ can be searched in the solution space for $r$, and the solutions for $r$ and $r'$ are equal. The mapping $r \mapsto \frac{1}{r}$ is bijective on $(0, \infty)$, thus this procedure finds all solutions.
$\blacksquare$

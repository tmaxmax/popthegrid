---
title: 'Filling the grid: a rigorous proof'
---
<header>

# Filling the grid

**A rigorous proof**

</header>

Given a $w \times h \in \mathbb{R}^{+}$ container and $n \in \mathbb{N}$ squares find the maximum square side length $s \in \mathbb{R}^{+}$ for which a grid $b \times a \in \mathbb{N}$ exists that fits the squares and fits in the container.

Let $r = \frac{w}{h}$ the ratio of the container's dimensions and the sets:

$$
\begin{gather*}
W = \left\{ (a, b) \in \mathbb{N}^2 : n \le ab \land a \ge rb \right\} \\
H = \left\{ (a, b) \in \mathbb{N}^2 : n \le ab \land a \le rb \right\}
\end{gather*}
$$

**Claim:** The optimal solution for the side length of the squares is:

$$
s = \max_{\mathclap{1 \le b \le n}} \, \min \left\{ \frac{w}{\left\lceil \frac{n}{b} \right\rceil}, \frac{h}{b} \right\}.
$$

**Proof:** $W \cup H = \left\{ (a, b) \in \mathbb{N}^2 : n \le ab \right\}$, all possible grid configurations.<br>
For every $(a = \left\lceil \frac{n}{b} \right\rceil, b)$ with $b \le n$ let $s = \min \left\{ \frac{w}{a}, \frac{h}{b} \right\}$. Clearly, $n \le ab$ always, hence
$s = \frac{w}{a} \le \frac{h}{b} \iff a \ge rb \iff (a, b) \in W$ and similarly $s = \frac{h}{b} \iff (a, b) \in H$. Moreover, $a$ is the minimal choice such that $(a, b) \in W \cup H$.<br>Any $a' > a$ gives $s' = \min \left\{ \frac{w}{a'}, \frac{h}{b} \right\} \le \min \left\{ \frac{w}{a}, \frac{h}{b} \right\} = s$. Any $b' > n$ gives $s' \le \min \left\{ w, \frac{h}{n} \right\}$, which is $s$ for $(a = 1, b = n)$, therefore $s' \le s$ for some $s$ with $b \le n. \thickspace \blacksquare$

**Claim:** If $(a = \left\lceil \frac{n}{b} \right\rceil, b) \in W \cup H$ maximizes $s$ then $b \ge \lfloor b^* \rfloor$, where $b^* = \sqrt{\frac{n}{r}}$.<br>
**Proof:** For $b \le b^*$:

$$
{b \le \sqrt{\frac{n}{r}} \implies rb \le \frac{n}{b} \le a} \implies {\frac{h}{b} \ge \frac{w}{a} \implies s = \frac{w}{\left\lceil \frac{n}{b} \right\rceil}}.
$$

To maximize $s$, either $b > b^*$ or $b = \lfloor b^* \rfloor. \thickspace \blacksquare$

**Claim:** For $r \ge 1$, if $\left(a = \left\lceil \frac{n}{b} \right\rceil, b\right) \in W \cup H$ maximizes $s$ then $b \le \lceil b^* \rceil$.<br>
**Proof:** For $b \ge b^*$:

$$
{b \ge \sqrt{\frac{n}{r}} \implies rb \ge \frac{n}{b}} \implies {\underbrace{rb > \left\lceil \frac{n}{b} \right\rceil}_{\text{(1)}} \lor \underbrace{\left\lceil \frac{n}{b} \right\rceil \ge rb}_{\text{(2)}}}.
$$

If case $\text{(1)}$ is true, under the $b \ge b^*$ constraint only $b = \lceil b^* \rceil$ maximizes $s$, since:

$$
{rb > a \implies \frac{h}{b} < \frac{w}{a} \implies s = \frac{h}{b}}.
$$

If case $\text{(2)}$ is true, assuming $r \ge 1$:

$$
\begin{align*}
\brk[3,]{&}rb \le \left\lceil \frac{n}{b} \right\rceil < \frac{n}{b} + 1 \brk[3,]
    \implies &rb^2 - b - n < 0 \brk
    \implies \brk[1,]{&}b < \frac{1}{2r}+\sqrt{\frac{1}{4r^2} + \frac{n}{r}} \\
    \implies &b < \frac{1}{2} + \sqrt{\left(\frac{1}{2} + \sqrt{\frac{n}{r}}\right)^2}
    \brk[,1]{=} \brk[2,]{\\ \implies &b <} b^* + 1
\end{align*}
$$

This means $b^* \le b < b^* + 1$ which forces $b = \lceil b^* \rceil$. In conclusion, either $b < b^*$ or $b = \lceil b^* \rceil. \thickspace \blacksquare$

**Claim:** For $r \ge 1$ the optimal side length is:

$$
s = \max_{\mathclap{\substack{\lfloor b^* \rfloor \le b \le \lceil b^* \rceil \\[0.18em] b > 0}}} \, \min \left\{\frac{w}{\left\lceil \frac{n}{b} \right\rceil}, \frac{h}{b} \right\}
$$

For $r \le 1$ solve for $r' = \frac{1}{r}$. This procedure finds solutions for every $r \in (0, \infty)$.

**Proof:** For $r \ge 1$, the first formula, proven to always find the maximal $s$, is simply restricted to $b \in \{\lfloor b^* \rfloor, \lceil b^* \rceil\}$, proven to always maximize $s$.

For $r \le 1$, let $s_{w,h}(a, b) = \min \left\{ \frac{w}{a}, \frac{h}{b} \right\}$ the side length of $(a, b) \in W \cup H$. Let $r' = \frac{h}{w} = \frac{1}{r} \ge 1$, $W'$ and $H'$ defined as $W$ and $H$ but with $r'$ substituted for $r$. $s_{h,w}$ is the side length of $(a, b) \in W' \cup H'$. Finally, let the symmetry function $\phi(a, b) = (b, a)$. It follows that:

$$
\begin{gather*}
(a, b) \in W \iff \phi(a, b) \in H' \\
(a, b) \in H \iff \phi(a, b) \in W'
\end{gather*}
$$

$$
s_{w,h}(a, b) = {\min \left\{ \frac{w}{a}, \frac{h}{b} \right\} = \min \left\{  \frac{h}{b}, \frac{w}{a} \right\}} = {s_{h,w}(b, a) = s_{h,w}(\phi(a, b))}. 
$$

$\phi$ bijectively maps $W$ to $H'$ and $H$ to $W'$ while preserving side lengths. Therefore the solution for $r$ can be searched in the solution space for $r'$, and the solutions for $r$ and $r'$ are equal. The mapping $r \mapsto \frac{1}{r}$ is bijective on $(0, \infty)$, thus this procedure finds all solutions.
$\blacksquare$

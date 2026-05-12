# Uniqueness of fit-width solution

Let $(a, b)$ be a minimal fit-width point. **Prove** there is no $b' \ne b$ such that $(a, b')$ is a fit-width point when $r \ge 1$ and $(a, b)$ corresponds to the best solution, meaning that $s_w > s_h$ for all $(a_h, b_h)$ fit-width points.

If you didn't read the main document, here's a self-contained problem statement:

Let: $r \in [1, \infin)$, <br>
$\quad n \in \N$ (for this task $\N$ does not include $0$),<br>
$\quad W = \Set{ (a, b) \in \N^2 | n \le ab \land a \ge rb }$ (the "fit-width" points),<br>
$\quad H = \Set{ (a, b) \in \N^2 | n \le ab \land rb \ge a }$ (the "fit-height" points),<br>
$\quad (a, b) = \argmin_{(a, b) \in W} a$. <br>
Assume $\forall b_h \in H : a < rb_h$. <br>
Prove there exists no $b' \ne b$ such that $(a, b') \in W$.

_Three hints are provided in case you get stuck; attempt to solve without them first, then try again, one more hint at a time. Don't jump to the end directly. Reading the [main document][6] may help; **do not** read its appendix section, it spoils the solution._

## Hint 1

Here are graphs for $n = 8, r = 5$ and $n = 23, r = 3.9$ (graphs A and C in the document): 

<p style="display: flex; gap: 1em; justify-content: center">
    <img src="https://raw.githubusercontent.com/tmaxmax/popthegrid/refs/heads/main/doc/img/first-graph.png" alt="Graph A" width="300" />
    <img src="https://raw.githubusercontent.com/tmaxmax/popthegrid/refs/heads/main/doc/img/multiple-points-same-solution.png" alt="Graph C" width="300" />
</p>

How do the fit-width and fit-height points compare in each of them?

## Hint 2

By hint 1 a viable proof path is to show that if such a $b'$ exists then one can find a point $(a', b')$ which is fit-height.

Try to prove that if $b'$ exists then specifically $(a - 1, b')$ is fit-height.

## Hint 3

Attached are proof attempts from LLMs. They present various useful approaches but have subtle mistakes. Find these mistakes and use the proofs as inspiration for your own! 

### Proof 1

Courtesy of DeepSeek v4.

---

#### Setup

Let the fit‑width solution be $(a, b)$ where  
$b = \lceil n/a \rceil$ and $a$ is the smallest integer satisfying $a \ge r\cdot b$.  
Its square side is $s_{\text{fw}} = w/a$.

A **valid fit‑width solution** with the same $a$ and side length $s_{\text{fw}}$ uses the same $a$ and any row count $b'$ with  
$$\begin{gather*}
\lceil n/a \rceil \le b' \le \lfloor a/r \rfloor.
\end{gather*}$$
The algorithm picks the minimal $b' = b$.

---

#### Claim
If $s_{\text{fw}} > s_{\text{fh}}$ for **every** fit‑height solution, then there is no $b' > b$ with $b' \le a/r$.  
In other words, the feasible interval for $b'$ collapses to a single value $b = \lfloor a/r \rfloor = \lceil n/a \rceil$.

---

#### Proof
Assume, for contradiction, that such a $b'$ exists. Then $b+1 \le \lfloor a/r \rfloor$, so  
$$\begin{gather*}
a \ge r(b+1). \tag{1}
\end{gather*}$$
Let $k = \lfloor a/r \rfloor$. Clearly $k \ge b+1$.

Now examine the fit‑height condition for row count $k$:  
$$\begin{gather*}
\lceil n/k \rceil \le r k .
\end{gather*}$$
We know $n \le a b$ (from $b = \lceil n/a \rceil$). Thus
$$\begin{gather*}
\frac{n}{k} \le \frac{a b}{k} \le \frac{a b}{b+1} = a - \frac{a}{b+1}.
\end{gather*}$$
From (1), $\displaystyle \frac{a}{b+1} \ge r$, so
$$\begin{gather*}
\frac{n}{k} \le a - r .
\end{gather*}$$
Since $r k > a - r$ (because $k = \lfloor a/r \rfloor > a/r - 1$), we obtain
$$\begin{gather*}
\frac{n}{k} < r k .
\end{gather*}$$
Hence $\lceil n/k \rceil \le r k$, i.e., $k$ satisfies the fit‑height condition.  
The fit‑height algorithm will therefore find an optimal row count $b_{\text{fh}} \le k \le a/r$.

Then
$$\begin{gather*}
s_{\text{fh}} = \frac{h}{b_{\text{fh}}} \ge \frac{h}{a/r} = \frac{r h}{a} = \frac{w}{a} = s_{\text{fw}} ,
\end{gather*}$$
contradicting the strict optimality of the fit‑width solution.  

Therefore, no such $b'$ can exist when the fit‑width solution is strictly better than all fit‑height solutions. The pair $(a,b)$ is the unique grid achieving the maximal square side length.

### Proof 2

Courtesy of [QED-Nano](https://huggingface.co/spaces/lm-provers/qed-nano-blogpost), a tiny 4B open-source model developed exclusively for math proofs.

---

#### Proof.

Define for each $b \in N$

$$\begin{gather*}
f(b)=\max \Set{\left\lceil rb \right\rceil, \left\lceil \frac{n}{b} \right\rceil}.
\end{gather*}$$

For a pair $(a,b) \in \N^2$ we have  

$$\begin{gather*}
(a,b) \in W \iff a \ge rb \text{ and } ab \ge n.
\end{gather*}$$

Because $a,b$ are integers,  

$$\begin{gather*}
a \ge rb \iff a \ge \left\lceil rb \right\rceil, \qquad ab \ge n \iff a \ge \left\lceil \frac{n}{b} \right\rceil.
\end{gather*}$$

Hence $(a,b) \in W$ iff $a \ge f(b)$.

By definition $a_w​=\min_{(a,b) \in W}​a$; therefore  

$$\begin{gather*}
a_w​=\min_{b \in N}​f(b).
\end{gather*}$$

Consequently for the fixed $a_w$​,

$$\begin{gather*}
(a_w​,b) \in W \iff f(b)=a_w​.
\end{gather*}$$

Thus the set we are interested in is exactly the set of minimizers of $f$.

---

#### 1. A useful auxiliary integer

Set  

$$\begin{gather*}
b_0​=\left\lceil n/a_w ​\right\rceil.
\end{gather*}$$

Then $b_0​ \ge n/a_w$​, so $a_w​b_0​ \ge n$. <br>
Because $b_w​ \in W$ we have $b_w​ \ge n/a_w$​; therefore  

$$\begin{equation} \tag{1}
b_0 \le b_w.
\end{equation}$$

From $a_w​ \ge rb_w$​ we obtain $b_w \le a_w​/r$, hence  

$$\begin{equation} \tag{2}
b_w \le \left\lfloor \frac{a_w}{r}​​ \right\rfloor.
\end{equation}$$

Together $(1)$ and $(2)$ give  

$$\begin{equation} \tag{3}
b_0 \le \left\lfloor \frac{a_w}{r}​​ \right\rfloor.
\end{equation}$$

The hypothesis $a_w​ < rb_h$​ yields  

$$\begin{equation} \tag{4}
\left\lfloor \frac{a_w}{r}​​ \right\rfloor \le b_h​−1.
\end{equation}$$

#### 2. Lower bound for $b_0$​

We prove that $b_0​ \ge b_h​−1$.

Assume, to the contrary, that $b_0 \le b_h​−2$. <br>
Then $b_0​+1 \le b_h​−1<b_h​$.

Because $a_w$​ is the minimum of $f$, we have $f(b_0​) \ge a_w​$. <br>
Now $f(b_0​)=\max \Set{\left\lceil rb_0 ​\right\rceil,\left\lceil n/b_0 ​\right\rceil}$. <br>
Since $n/b_0 \le a_w$​, we get $\left\lceil n/b_0 ​\right\rceil \le a_w$​; therefore the inequality $f(b_0​) \ge a_w$​ forces  

$$\begin{gather*}
\left\lceil rb_0 ​\right\rceil \ge a_w​.
\end{gather*}$$

The last inequality implies $rb_0​>a_w​−1$. Adding $r \ge 1$ gives  

$$\begin{gather*}
r(b_0​+1)=rb_0​+r>a_w​−1+r \ge a_w​.
\end{gather*}$$

Let $k=\left\lfloor r(b_0​+1) \right\rfloor$. Because $r(b_0​+1)>a_w$​, the integer $a_w$​ (which is $<r(b_0​+1)$) cannot exceed the greatest integer $\le r(b_0​+1)$; hence $a_w \le k$. Consequently  

$$\begin{gather*}
a_w \le r(b_0​+1).
\end{gather*}$$

Moreover $a_w​(b_0​+1)=a_w​b_0​+a_w​ \ge n+a_w​>n$, so $a_w​(b_0​+1) \ge n$.

Thus $(a_w​,b_0​+1)$ satisfies both conditions of $H$; i.e. $(a_w​,b_0​+1) \in H$. <br>
But $b_0​+1 \le  b_h​−1<b_h​$, contradicting the definition of $b_h$​ as the smallest second coordinate occurring in $H$.

Hence our assumption was false, and we must have  

$$\begin{equation} \tag{5}
b_0​ \ge b_h​−1.
\end{equation}$$

#### 3. Determining $b_0$​ and $b_w$​

From $(3)$ and $(4)$ we obtain $b_0 \le b_h​−1$; together with $(5)$ this yields $b_0​=b_h​−1$. Therefore  

$$\begin{equation} \tag{6}
\left\lceil \frac{n}{a_w} \right\rceil = b_h​−1.
\end{equation}$$

Because of $(1)$ and $(6)$ we have $b_w \ge b_h​−1$; together with $(2)$ and $(4)$ we get $b_w \le b_h​−1$. Hence  

$$\begin{equation} \tag{7}
b_w​=b_h​−1.
\end{equation}$$

Finally $(7)$ and $(4)$ give $b_h​−1 \le  \left\lfloor a_w​/r \right\rfloor$, while $(4)$ itself gives $\left\lfloor a_w​/r \right\rfloor \le b_h​−1$; thus  

$$\begin{equation} \tag{8}
\left\lfloor \frac{a_w}{r}​​ \right\rfloor = b_h​−1.
\end{equation}$$

#### 4. Conclusion

For an integer b we have $(a_w​,b) \in W$ exactly when  

$$\begin{gather*}
\left\lceil \frac{n}{a_w} \right\rceil \le b \le \left\lfloor \frac{a_w}{r} \right\rfloor.
\end{gather*}$$

By $(6)$ and $(8)$ the left‑hand side equals the right‑hand side and both equal $b_h​−1$. <br>
Because of (7) this common value is precisely b_w​. Consequently no other integer $b \ne b_w$​ can satisfy the inequalities, i.e.

$$\begin{gather*}
\left\lceil \frac{n}{a_w} \right\rceil = \left\lfloor ra_w \right\rfloor = b_w​.
\end{gather*}$$

Hence there is no $b \ne b_w$​ with $(a_w​,b) \in W$. ∎

### Proof 3

Another attempt from DeepSeek.

---

#### Proof

Assume the fit‑width solution $(a,b)$ is strictly optimal, meaning its square side $s_{\text{fw}} = w/a$ is larger than the side of every fit‑height solution.  
- Strict optimality forces $r = w/h > 1$ (for $r \le 1$ the fit‑height solution is at least as good).  
- The algorithm finds the smallest integer $a$ satisfying $a \ge r \lceil n/a \rceil$. Hence  
  $$\begin{gather*}
  a-1 < r \lceil n/(a-1) \rceil \quad \text{and} \quad a \ge r b,\;\; b = \lceil n/a \rceil.
  \end{gather*}$$
  Because $a$ is the *smallest* such integer, the gap $a - r b$ is strictly less than 1.  
- For $r > 1$, we have  
  $$\begin{gather*}
  \frac{a}{r} - b = \frac{a - rb}{r} < \frac{1}{r} < 1 \quad\Longrightarrow\quad \frac{a}{r} < b+1.
  \end{gather*}$$
  At the same time $a/r \ge b$. Thus $\lfloor a/r \rfloor = b$.  
- A different row count $b'$ would still be a valid fit‑width solution with the same $a$ only if $b' \in \bigl[\lceil n/a \rceil, \lfloor a/r \rfloor\bigr] = [b,\,b]$. Hence no $b' > b$ exists.

#### Why the converse (alternative grids) cannot happen under strict optimality
If a $b' > b$ existed with $b' \le a/r$, then $b+1 \le \lfloor a/r \rfloor$. One can show this forces the existence of a fit‑height solution with side $\ge w/a$, contradicting strict optimality. In practice, however, the simpler box argument above already forbids the existence of any such $b'$ when $r>1$.

## Thoughts on the LLMs' performance

Using the prompt in a fresh conversation:

> let r in [1, inf). <br> let n natural non-zero. <br> let W = { (a,b) in N² | n <= ab and a >= rb }. <br> let H = { (a,b) in N² | n <= ab and rb >= a }. <br> let (a_w, b_w) = \argmin_{(a,b) in W} a. <br> let (a_h, b_h) = \argmin_{(a,b) in H} b. <br> assume a_w < rb_h. <br> prove that there exists no other b ≠ b_w such that (a_w, b) is in W.

All current frontier models managed to prove the statement correctly (don't click on links if you didn't solve yet):

- [GPT 5.5 Pro][1] had a correct, concise, minimal proof, light on algebra and easy to follow;
- [Claude Opus 4.7][2] proved the same result as GPT 5.5 Pro but by more complex, slightly less readable means; a nice touch was providing the geometrical intuition for the proof, just as it is described in the main document;
- [Gemini 3.1 Pro][3] had an unintuitive roundabout excessively long but correct proof;
- [DeepSeek v4][4] had a different yet equally elegant approach as GPT & Claude but the writing itself was hard to follow and full of redundant statements.

DeepSeek's two failed proofs are part of a much greater conversation and used a more ambiguous prompt. It had a lot more context: the algorithm's code, its complexity analysis, the graph representation, the terminology. This seems to have hurt its performance.

The prompt itself was built such that QED-Nano managed to output a response. If any ambiguities were present it would "overthink" them and wouldn't make meaningful progress beyond continuously reanalyzing the problem statement. Running QED-Nano with smaller context (8k is all I could run locally), resulted in it forgetting about the initial problem and proving unrelated statements (e.g. that there are $a, b, c \in \N$ such that $a^3 + b^3 = c^3$, lol). I paid [vast.ai](https://vast.ai) 5$ to run it using the biggest supported context, which required ~46GB of VRAM.

That being said, [QED-Nano did prove][5] the statement with a very minor push in a second prompt. The approach is equivalent to DeepSeek's, with even more verbose writing. The cause for verbosity is not redundancy but derivations of intermediary results through alternative more inefficient methods.

I've also tried ChatGPT 5.5 Thinking Mini with the same prompt. After a failed proof which didn't use the $a_w < rb_h$ assumption and some subsequent corrective prompts, it concluded that:

> As it stands, I cannot honestly provide a correct proof because the crucial implication needed for the contradiction is not derivable from the assumptions you gave.

Such hubris!

[1]: https://github.com/tmaxmax/popthegrid/blob/alt-uniqueness-proof/doc/ai/gpt-5-5-pro.pdf
[2]: https://github.com/tmaxmax/popthegrid/blob/alt-uniqueness-proof/doc/ai/claude-opus-4-7.pdf
[3]: https://github.com/tmaxmax/popthegrid/blob/alt-uniqueness-proof/doc/ai/gemini-3-1-pro.pdf
[4]: https://github.com/tmaxmax/popthegrid/blob/alt-uniqueness-proof/doc/ai/deepseek-v4.pdf
[5]: https://github.com/tmaxmax/popthegrid/blob/alt-uniqueness-proof/doc/ai/qed-nano.pdf
[6]: https://github.com/tmaxmax/popthegrid/blob/main/doc/filling-the-grid.pdf
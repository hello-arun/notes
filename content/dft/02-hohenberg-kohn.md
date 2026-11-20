# Hohenberg–Kohn theorems

<p class="lede">In 1964 Hohenberg and Kohn proved that the ground-state density alone determines everything about a system. The proofs are short and are a favourite interview question. You should be able to reproduce the first one on a whiteboard in two minutes.</p>

## The setting

Fix the number of electrons $N$ and the universal operators $\hat T$ and $\hat W$. Each choice of external potential $v(\vr)$ defines a Hamiltonian $\hat H_v = \hat T + \hat W + \sum_i v(\vr_i)$, which has (assume non-degenerate) a ground state $\Psi_v$, which has a density $n_v$. So there are maps

<figure>
<svg class="fig" viewBox="0 0 560 140" width="560" role="img" aria-label="Mapping from potential to wavefunction to density, and back">
  <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--fg-soft)"/></marker>
  <marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker></defs>
  <g style="font-family:var(--serif);font-size:20px;fill:var(--fg)">
    <rect x="20" y="40" width="110" height="50" rx="10" style="fill:var(--bg-soft);stroke:var(--border)"/><text x="75" y="72" text-anchor="middle">v(r)</text>
    <rect x="225" y="40" width="110" height="50" rx="10" style="fill:var(--bg-soft);stroke:var(--border)"/><text x="280" y="72" text-anchor="middle">Ψ</text>
    <rect x="430" y="40" width="110" height="50" rx="10" style="fill:var(--accent-soft);stroke:var(--accent)"/><text x="485" y="72" text-anchor="middle">n(r)</text>
  </g>
  <g style="stroke:var(--fg-soft);stroke-width:1.6;fill:none">
    <path d="M132 58 L222 58" marker-end="url(#ar)"/><path d="M337 58 L427 58" marker-end="url(#ar)"/>
  </g>
  <path d="M485 94 C 430 135, 130 135, 75 94" style="stroke:var(--accent);stroke-width:1.8;fill:none;stroke-dasharray:6 4" marker-end="url(#ar2)"/>
  <g style="font-family:var(--font);font-size:12px;fill:var(--fg-soft)">
    <text x="177" y="50" text-anchor="middle">solve Ĥ_v</text><text x="382" y="50" text-anchor="middle">integrate |Ψ|²</text>
    <text x="280" y="134" text-anchor="middle" style="fill:var(--accent)">HK: this inverse map exists (v up to a constant)</text>
  </g>
</svg>
<figcaption>Going forward is "just" quantum mechanics. Hohenberg–Kohn proved the composite map $v \mapsto n$ is invertible.</figcaption>
</figure>

## Theorem 1: the density determines the potential

> [!KEY] HK1
> The ground-state density $n(\vr)$ uniquely determines the external potential $v(\vr)$, up to an additive constant. Hence it determines $\hat H$, and therefore *every* property of the system, excited states included.

### Proof (by contradiction, two steps)

Suppose two potentials $v_1 \neq v_2 + \text{const}$ give the **same** ground-state density $n$.

**Step 1: different potentials give different wavefunctions.** If $\Psi_1 = \Psi_2 = \Psi$, subtract the Schrödinger equations: $(\hat V_1 - \hat V_2)\Psi = (E_1-E_2)\Psi$, i.e. $\sum_i[v_1(\vr_i)-v_2(\vr_i)] = E_1-E_2$, a constant (wherever $\Psi\ne0$, which is almost everywhere). That contradicts $v_1 \ne v_2 + \text{const}$. So $\Psi_1\neq\Psi_2$.

**Step 2: they cannot share a density.** By the variational principle (strict, since the ground state is non-degenerate and $\Psi_2\ne\Psi_1$):

$$
E_1 < \langle\Psi_2|\hat H_1|\Psi_2\rangle = \langle\Psi_2|\hat H_2|\Psi_2\rangle + \langle\Psi_2|\hat H_1-\hat H_2|\Psi_2\rangle = E_2 + \int[v_1-v_2]\,n\,\dd\vr
$$

Swapping labels 1 ↔ 2:

$$
E_2 < E_1 + \int[v_2-v_1]\,n\,\dd\vr
$$

Adding the two gives $E_1 + E_2 < E_1 + E_2$, a contradiction. ∎

> [!TIP] Why it works
> The expectation value of a *local* potential depends on $\Psi$ only through the density: $\langle \Psi|\hat V|\Psi\rangle = \int v\,n$. That is why the same $n$ appears in both inequalities and the terms cancel.

## Theorem 2: a variational principle for the density

Since $n$ determines $\Psi$, any ground-state expectation value is a functional of $n$. In particular define the **universal functional**

$$
F_{\text{HK}}[n] = \langle\Psi[n]|\hat T + \hat W|\Psi[n]\rangle
$$

"Universal" means it does not depend on $v$: it is the same for atoms, molecules and solids. The energy functional for a given $v$ is

$$
E_v[n] = F_{\text{HK}}[n] + \int v(\vr)\,n(\vr)\,\dd\vr
$$

> [!KEY] HK2
> For any trial density $\tilde n$ that is the ground-state density of *some* potential (and integrates to $N$), $E_v[\tilde n] \ge E_0$, with equality only for the true ground-state density $n_0$.

Proof: $\tilde n$ comes from some $\tilde\Psi$, so $E_v[\tilde n] = \langle\tilde\Psi|\hat H_v|\tilde\Psi\rangle \ge E_0$ by the ordinary variational principle.

So the ground-state energy can be found by minimising over *densities*, with the constraint $\int n = N$ handled by a Lagrange multiplier $\mu$:

$$
\frac{\delta F[n]}{\delta n(\vr)} + v(\vr) = \mu
$$

$\mu = \partial E/\partial N$ is the **chemical potential**. It is the same everywhere, like the Fermi level.

## Fine print: representability and Levy–Lieb

HK's $F_{\text{HK}}$ is only defined on **v-representable** densities, those that are ground states of *some* local potential. Not every reasonable density is v-representable (counterexamples exist), and we don't know how to characterise the set. That is awkward for a minimisation.

**Levy (1979) and Lieb (1983)** fixed this with the **constrained search**:

$$
F_{\text{LL}}[n] = \min_{\Psi\to n}\langle\Psi|\hat T+\hat W|\Psi\rangle
$$

Search over all antisymmetric wavefunctions that yield $n$ and take the lowest $\langle \hat T+\hat W\rangle$. Then

$$
E_0 = \min_n\Big\{F_{\text{LL}}[n] + \int vn\Big\} = \min_n\,\min_{\Psi\to n}\langle\Psi|\hat H|\Psi\rangle
$$

which is just the usual variational principle, minimising in two stages. This needs only **N-representability** (that $n$ comes from *some* antisymmetric $\Psi$), and that is easy: any non-negative, normalised $n$ with $\int|\nabla\sqrt n|^2 < \infty$ qualifies (Gilbert/Harriman). It also handles degenerate ground states. Lieb's convex-conjugate formulation is the mathematically rigorous version.

> [!INTERVIEW] A good answer to "What's wrong with the original HK proof?"
> Nothing is wrong with HK1. The issue is the *domain* of $F_{\text{HK}}$: v-representability is unknown and not guaranteed. Levy–Lieb constrained search defines $F$ on all N-representable densities, so the variational principle is well posed. The original proof also assumed a non-degenerate ground state; constrained search removes that assumption.

## What HK does *not* tell you

- **It gives no formula for $F[n]$.** HK is an existence theorem. All the practical difficulty is hidden in $F$.
- It says nothing directly about **excited states** as density functionals. They are determined in principle, but not variationally (see TDDFT in Chapter 7).
- It concerns the **ground-state density**. Time-dependent, finite-temperature (Mermin, 1965), spin (spin-DFT, using $n_\uparrow, n_\downarrow$) and current versions are separate theorems.

## Thomas–Fermi: the first (crude) density functional

Thomas and Fermi (1927) approximated each region of space as a uniform electron gas of the local density:

$$
E_{\text{TF}}[n] = C_F\int n^{5/3}\,\dd\vr + \int vn\,\dd\vr + \EH[n], \qquad C_F = \tfrac{3}{10}(3\pi^2)^{2/3} \approx 2.871
$$

Dirac added exchange, $-\frac34(3/\pi)^{1/3}\int n^{4/3}$ (Thomas–Fermi–Dirac). It is cheap and orbital-free, but **qualitatively wrong**: Teller's theorem (1962) shows TF theory never binds molecules, and it has no shell structure.

The weak link is the kinetic energy. $T$ is about as large as the total energy (virial theorem: $T = -E$), and a local density approximation for it is far too crude. Small *relative* errors in $T$ wipe out chemical bonding. **Orbital-free DFT** still tries to find a good $T[n]$ (with gradient corrections like von Weizsäcker's $\frac18\int|\nabla n|^2/n$, and recently ML kinetic functionals), and it would give $O(N)$ cost if it succeeded.

The Kohn–Sham idea, in the next chapter, sidesteps this by computing most of the kinetic energy *exactly* using orbitals.

```quiz
? HK1 states that the ground-state density determines the external potential…
- exactly, including the additive constant
+ up to an additive constant
- only for non-interacting electrons
- only for spherically symmetric systems
= A constant shift in $v$ changes $E$ but not $\Psi$ or $n$. So $n$ determines $v$ only up to a constant.

? In the HK1 proof, which fact makes the cross terms reduce to $\int(v_1-v_2)\,n$?
+ A local potential's expectation value depends on $\Psi$ only through the density
- The kinetic energy is the same for both systems
- The Hartree energy is linear in $n$
- Both systems have the same number of electrons
= $\langle\Psi|\sum_i v(\vr_i)|\Psi\rangle = \int v(\vr)n(\vr)\,\dd\vr$. With the same $n$ for both systems, adding the inequalities gives the contradiction.

? What does "universal" mean for $F[n]$?
+ It is the same functional for every system with the same type of particle interaction
- It applies to both bosons and fermions
- It is the same for all exchange–correlation approximations
- It is independent of $N$
= $F[n]$ contains only $\hat T$ and $\hat W$, which do not depend on the nuclei. The same $F$ serves for H₂O and for bulk Si.

? What problem does the Levy–Lieb constrained search solve?
+ It defines $F[n]$ for all N-representable densities, avoiding the unknown v-representability condition
- It provides an explicit formula for $\Exc$
- It extends DFT to excited states
- It removes the need for self-consistency
= $F_{\text{LL}}[n] = \min_{\Psi\to n}\langle\hat T+\hat W\rangle$ is defined for any density coming from an antisymmetric $\Psi$, and that condition is easy to check.

? Why does Thomas–Fermi theory fail to bind molecules?
+ The local approximation to the kinetic energy is too crude for a term as large as the total energy
- It neglects the Hartree energy
- It uses the wrong external potential
- It does not conserve particle number
= $T \approx -E$ by the virial theorem, so small relative errors in $T[n]$ swamp binding energies. Teller proved TF molecules are never bound.

? The Lagrange multiplier $\mu$ in $\delta F/\delta n + v = \mu$ is physically…
+ the chemical potential $\partial E/\partial N$
- the HOMO energy of the Hartree–Fock method
- the total energy per electron
- zero for neutral systems
= $\mu$ enforces $\int n = N$, and in the minimum it equals $\partial E/\partial N$, the electronic chemical potential.
```

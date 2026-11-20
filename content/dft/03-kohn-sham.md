# Kohn–Sham equations

<p class="lede">Kohn and Sham (1965) turned the HK existence theorem into a working method. They replaced the interacting electrons with a fictitious system of <em>non-interacting</em> electrons that has the same density. This chapter derives the equations, explains each term, and lets you run a real self-consistent calculation.</p>

## The idea: a non-interacting reference system

The hard part of $F[n]$ is the kinetic energy. For **non-interacting** electrons we know the kinetic energy exactly, as long as we keep orbitals:

$$
\Ts[n] = \sum_i f_i\,\langle\phi_i|-\tfrac12\nabla^2|\phi_i\rangle, \qquad n(\vr) = \sum_i f_i|\phi_i(\vr)|^2
$$

Kohn and Sham **assumed** that for any interacting ground-state density there is a non-interacting system, moving in some local potential $v_s(\vr)$, with the same density. This is *non-interacting v-representability*, and it is believed to hold for practically all densities of interest. Then rewrite the exact universal functional as

$$
F[n] = \Ts[n] + \EH[n] + \Exc[n]
$$

which **defines** the exchange–correlation energy:

$$
\boxed{\;\Exc[n] \equiv \underbrace{(T[n] - \Ts[n])}_{\text{kinetic correlation}} + \underbrace{(W[n] - \EH[n])}_{\text{non-classical e–e}}\;}
$$

> [!KEY] Why this is a good split
> The three terms we compute exactly ($\Ts$, $\EH$, $\int \vext n$) are the bulk of the energy. $\Exc$ is roughly 10 % of the total, and much of it (exchange) has a simple, nearly local form. A crude approximation to a *small* term is far better than a crude approximation to the large kinetic energy, which is how Thomas–Fermi failed.

## Derivation

Minimise

$$
E[n] = \Ts[\{\phi_i\}] + \int \vext n\,\dd\vr + \EH[n] + \Exc[n]
$$

with respect to the orbitals, keeping them orthonormal (Lagrange multipliers $\varepsilon_{ij}$, which can be diagonalised by a unitary rotation). Use the chain rule $\frac{\delta}{\delta\phi_i^*} = \frac{\delta n}{\delta \phi_i^*}\frac{\delta}{\delta n} = f_i\phi_i\,\frac{\delta}{\delta n}$:

$$
\frac{\delta \Ts}{\delta\phi_i^*} = -\tfrac12 f_i\nabla^2\phi_i, \qquad
\frac{\delta \EH}{\delta n} = \int\frac{n(\vr')}{|\vr-\vr'|}\dd\vr' = v_{\mathrm H}(\vr), \qquad
\frac{\delta \Exc}{\delta n} \equiv \vxc(\vr)
$$

The result is the **Kohn–Sham equations**:

$$
\boxed{\;\Big[-\tfrac12\nabla^2 + \veff(\vr)\Big]\phi_i(\vr) = \varepsilon_i\phi_i(\vr), \qquad \veff = \vext + v_{\mathrm H}[n] + \vxc[n]\;}
$$

These are single-particle Schrödinger equations. $\veff$ depends on $n$, which depends on the $\phi_i$, so they must be solved **self-consistently**. The structure is the same as Hartree's equations, with the exact physics of exchange and correlation folded into the *local, multiplicative* potential $\vxc(\vr)$.

> [!INTERVIEW] "Is DFT a mean-field theory?"
> The KS equations *look* like mean-field equations, but KS-DFT with the exact $\Exc$ gives the exact density and energy, correlation included. That is not true of HF. With approximate functionals it behaves like an (improved) mean-field theory. A careful answer separates the formal framework from the approximations.

## The total energy

The sum of eigenvalues is *not* the total energy, because it double-counts interactions. Multiply each KS equation by $f_i\phi_i^*$, integrate and sum:

$$
\sum_i f_i\varepsilon_i = \Ts + \int\vext n + \int v_{\mathrm H}n + \int\vxc n = \Ts + \int\vext n + 2\EH + \int\vxc n
$$

Therefore

$$
E = \sum_i f_i\varepsilon_i - \EH[n] - \int\vxc(\vr)n(\vr)\,\dd\vr + \Exc[n] \;\;(+E_{\text{nn}})
$$

The subtracted terms are the **double-counting corrections**. Plane-wave codes print a breakdown like this every SCF step.

## What do the Kohn–Sham orbitals and eigenvalues mean?

Strictly, the $\phi_i$ and $\varepsilon_i$ are auxiliary quantities. Only $n$ and $E$ are guaranteed to be physical. Still:

- **Janak's theorem:** $\dfrac{\partial E}{\partial f_i} = \varepsilon_i$. An eigenvalue is the slope of the energy as you fractionally (de)occupy that orbital.
- **Ionisation-potential theorem:** with the *exact* functional, $\varepsilon_{\text{HOMO}} = -I$ (for finite systems, setting $\vxc(\infty)=0$). This follows from Janak plus piecewise linearity of $E(N)$, or from the asymptotic decay $n \sim e^{-2\sqrt{2I}r}$.
- In practice, with LDA/GGA, $-\varepsilon_{\text{HOMO}}$ underestimates $I$ by several eV, because the approximate potential decays too fast (no $-1/r$ tail) and is too shallow.
- **Band structures**: KS band structures of solids are widely used as approximate quasiparticle bands. Band *shapes* and dispersions are often good, but the **gap is too small** (Chapter 5). Treat KS bands as a useful zeroth-order picture that GW corrects.
- KS orbitals are usually very close to HF or Dyson orbitals in shape, so chemists happily use them for qualitative MO analysis.

## Spin: Kohn–Sham for magnetic and open-shell systems

For spin-polarised systems use spin densities $n_\uparrow$, $n_\downarrow$ (spin-DFT, von Barth–Hedin 1972):

$$
\Big[-\tfrac12\nabla^2 + \vext + v_{\mathrm H}[n] + v_{\mathrm{xc}}^\sigma[n_\uparrow,n_\downarrow]\Big]\phi_{i\sigma} = \varepsilon_{i\sigma}\phi_{i\sigma}, \qquad v_{\text{xc}}^\sigma = \frac{\delta\Exc}{\delta n_\sigma}
$$

The spin polarisation is $\zeta = (n_\uparrow-n_\downarrow)/n$. Practical notes: initialise magnetic moments or you may converge to a non-magnetic saddle point; antiferromagnets need explicit initial moment patterns; non-collinear magnetism and spin–orbit coupling use 2-component spinors.

## Generalised Kohn–Sham

Hybrid functionals include the *non-local* HF exchange operator, so their potential is not a local multiplicative $\vxc(\vr)$. Strictly they are **generalised Kohn–Sham** (GKS, Seidl et al. 1996): a reference system described by a single determinant but with a non-local operator. This is why hybrid eigenvalue gaps can be close to fundamental gaps: in GKS part of the derivative discontinuity moves into the eigenvalue gap. Meta-GGAs, implemented with orbital-dependent potentials, are also GKS.

## The self-consistent field loop

<figure>
<svg class="fig" viewBox="0 0 620 250" width="620" role="img" aria-label="The Kohn-Sham self-consistent field loop">
  <defs><marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--fg-soft)"/></marker></defs>
  <g style="font-family:var(--font);font-size:13px;fill:var(--fg)">
    <rect x="10" y="20" width="170" height="44" rx="9" style="fill:var(--bg-soft);stroke:var(--border)"/><text x="95" y="47" text-anchor="middle">Initial guess n₀(r)</text>
    <rect x="225" y="20" width="170" height="44" rx="9" style="fill:var(--bg-soft);stroke:var(--border)"/><text x="310" y="40" text-anchor="middle">Build v_eff = v_ext</text><text x="310" y="56" text-anchor="middle">+ v_H[n] + v_xc[n]</text>
    <rect x="440" y="20" width="170" height="44" rx="9" style="fill:var(--bg-soft);stroke:var(--border)"/><text x="525" y="40" text-anchor="middle">Solve KS equations</text><text x="525" y="56" text-anchor="middle">→ φᵢ, εᵢ</text>
    <rect x="440" y="110" width="170" height="44" rx="9" style="fill:var(--bg-soft);stroke:var(--border)"/><text x="525" y="130" text-anchor="middle">Occupy (Fermi level)</text><text x="525" y="146" text-anchor="middle">n_out = Σ fᵢ|φᵢ|²</text>
    <rect x="225" y="110" width="170" height="44" rx="9" style="fill:var(--accent-soft);stroke:var(--accent)"/><text x="310" y="130" text-anchor="middle">Converged?</text><text x="310" y="146" text-anchor="middle">|n_out − n_in| , ΔE small</text>
    <rect x="10" y="110" width="170" height="44" rx="9" style="fill:var(--bg-soft);stroke:var(--border)"/><text x="95" y="130" text-anchor="middle">Mix: n_in ← f(n_in, n_out,</text><text x="95" y="146" text-anchor="middle">history)  (Pulay/Broyden)</text>
    <rect x="225" y="196" width="170" height="44" rx="9" style="fill:var(--good-soft);stroke:var(--good)"/><text x="310" y="216" text-anchor="middle">Energy, forces, stress,</text><text x="310" y="232" text-anchor="middle">bands, DOS …</text>
  </g>
  <g style="stroke:var(--fg-soft);stroke-width:1.5;fill:none" marker-end="url(#a3)">
    <path d="M182 42 L222 42" marker-end="url(#a3)"/><path d="M397 42 L437 42" marker-end="url(#a3)"/>
    <path d="M525 66 L525 107" marker-end="url(#a3)"/><path d="M438 132 L398 132" marker-end="url(#a3)"/>
    <path d="M223 132 L183 132" marker-end="url(#a3)"/><path d="M95 108 C 95 90, 300 92, 305 67" marker-end="url(#a3)"/>
    <path d="M310 156 L310 193" marker-end="url(#a3)"/>
  </g>
  <g style="font-family:var(--font);font-size:11px;fill:var(--fg-faint)"><text x="203" y="125" text-anchor="middle">no</text><text x="322" y="180">yes</text></g>
</svg>
<figcaption>The Kohn–Sham SCF cycle. The mixing step is what makes or breaks convergence.</figcaption>
</figure>

Below is a **working** 1D Kohn–Sham code: soft-Coulomb Hartree interaction, a toy LDA-like exchange, finite-difference kinetic energy, and an exact tridiagonal eigensolver. Things to try:

1. **Flat box, 8 electrons, linear mixing α = 1 → Run.** The residual never goes down: the density jumps between two shapes, overshooting every time. This is **charge sloshing** (undamped "plain" SCF iteration).
2. Lower α to 0.7: it converges in about 20 iterations. Lower it to 0.3: about 50. Too much damping is safe but slow.
3. Switch to **Pulay/DIIS** (any α): about 10 iterations. The faint grey curve keeps the previous run for comparison.
4. Set λ = 2 with linear α = 0.7: it fails again. Stronger interactions mean a stiffer Hartree response and need more damping.
5. Set λ = 0 (no interaction): converged after one step, since there is nothing to make self-consistent.

```anim
scf-1d
pot: box
N: 8
alpha: 1
```

> [!NOTE] Why sloshing gets worse with system size
> The Hartree response to a long-wavelength density change $\delta n(\mathbf G)$ is $\delta v_{\mathrm H} = 4\pi\,\delta n/G^2$. Small $G$ (long wavelength) means a huge potential response, so a density error at small $G$ is amplified. Large cells, and metals in particular, have small-$G$ components, so simple mixing must use a tiny α. **Kerker preconditioning** damps small-$G$ components by $G^2/(G^2+G_0^2)$, and is standard in plane-wave codes for metals and slabs.

### Mixing schemes in one table

| Scheme | Update | Notes |
|---|---|---|
| Linear (simple) | $n_{k+1} = n_k + \alpha (n^{\text{out}}_k - n_k)$ | Robust but slow; α must shrink with system size |
| Kerker | Linear mixing with $\alpha(G) = \alpha\, G^2/(G^2+G_0^2)$ | Kills charge sloshing in metals and large cells |
| Pulay / DIIS | Minimise $\lVert\sum_j c_j R_j\rVert$ with $\sum_j c_j=1$ over a history of residuals | The default in most codes; quasi-Newton in disguise |
| Broyden (modified) | Builds an approximate inverse Jacobian from history | Similar performance to Pulay; used in QE, many all-electron codes |
| Direct minimisation | Minimise $E[\{\phi\}]$ directly (CG, OT in CP2K) | Robust for insulators; avoids diagonalisation |

The **residual** $R = n^{\text{out}} - n^{\text{in}}$ is zero at self-consistency, so the SCF problem is a root-finding problem $R[n]=0$. Pulay and Broyden are (approximate) Newton methods for it, which is a good way to explain them in an interview.

## Summary

- KS replaces interacting electrons by non-interacting ones with the same density; $\Exc$ absorbs everything we don't know, including $T-\Ts$.
- KS equations are single-particle equations in $\veff = \vext + v_{\mathrm H} + \vxc$, solved self-consistently.
- Total energy = sum of eigenvalues minus double counting.
- Only $n$ and $E$ are rigorously physical. $\varepsilon_{\text{HOMO}} = -I$ for the exact functional; KS gaps are not fundamental gaps.
- The SCF loop is root finding. Mixing (Pulay/Broyden, Kerker for metals) determines whether it converges.

```quiz
? The Kohn–Sham exchange–correlation energy includes…
+ The difference between the true and non-interacting kinetic energies, $T-\Ts$
+ The non-classical part of the electron–electron interaction, $W-\EH$
- The Hartree energy
- The nuclear–nuclear repulsion
= $\Exc \equiv (T-\Ts) + (W-\EH)$. People often forget the kinetic part. It is why "exchange–correlation" is more than an interaction energy.

? Why is the sum of KS eigenvalues not the total energy?
+ It double-counts the Hartree and xc interaction energies
- KS eigenvalues have no physical meaning at all
- It misses the kinetic energy
- It equals the total energy only for metals
= $\sum f_i\varepsilon_i$ contains $\int v_{\mathrm H}n = 2\EH$ and $\int \vxc n$. Subtract $\EH$ and $\int\vxc n$, and add $\Exc$.

? Janak's theorem states that
+ $\partial E/\partial f_i = \varepsilon_i$
- $\varepsilon_{\text{HOMO}} = -I$ for any functional
- the KS gap equals the fundamental gap
- $\sum_i\varepsilon_i = E$
= Janak holds for any functional with the KS structure. Combined with exact piecewise linearity, it gives the IP theorem for the exact functional.

? Charge sloshing during SCF is caused mainly by…
+ The $4\pi/G^2$ divergence of the Hartree response at long wavelengths
- Too high a plane-wave cutoff
- Using too many k-points
- The exchange–correlation potential being non-local
= Small-$G$ density errors produce huge potential changes. Large cells and metals suffer most. The fixes are Kerker preconditioning and Pulay/Broyden mixing with a smaller α.

? Hybrid functionals are strictly implemented in which framework?
+ Generalised Kohn–Sham, because the exact-exchange operator is non-local
- Ordinary Kohn–Sham with a local potential
- Hartree theory
- Orbital-free DFT
= GKS uses a determinant reference with a non-local operator. Part of the derivative discontinuity moves into the eigenvalue gap, which is why hybrid gaps are larger and closer to experiment.

? For the exact functional of a finite system, the HOMO eigenvalue equals
+ minus the ionisation energy, $-I$
- minus the electron affinity, $-A$
- the chemical potential of the electron gas
- zero
= The IP theorem. With LDA/GGA, $-\varepsilon_{\text{HOMO}}$ is typically several eV smaller than $I$ because the potential lacks the $-1/r$ tail.

? Pulay (DIIS) mixing works by…
+ Finding the combination of previous densities whose combined residual has the smallest norm
- Using only the most recent output density
- Randomly perturbing the density to escape local minima
- Increasing the smearing until convergence
= Minimise $\lVert\sum c_jR_j\rVert$ subject to $\sum c_j=1$, then step from the corresponding density combination. It is effectively a quasi-Newton method.
```

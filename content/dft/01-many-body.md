# The many-electron problem

<p class="lede">Before we can appreciate why DFT is clever, we need to see why the direct approach of solving the Schrödinger equation for all electrons is hopeless beyond a handful of particles, and what the classic approximations (Hartree, Hartree–Fock) get right and wrong.</p>

## The full Hamiltonian and Born–Oppenheimer

A molecule or solid is a set of nuclei (charges $Z_I$, masses $M_I$, positions $\vR_I$) and $N$ electrons. In atomic units:

$$
\hat H_{\text{tot}} = -\sum_I \frac{\nabla_I^2}{2M_I} - \frac12\sum_i\nabla_i^2 - \sum_{i,I}\frac{Z_I}{|\vr_i-\vR_I|} + \frac12\sum_{i\ne j}\frac{1}{|\vr_i-\vr_j|} + \frac12\sum_{I\ne J}\frac{Z_IZ_J}{|\vR_I-\vR_J|}
$$

Nuclei are at least ~1836 times heavier than electrons, so electrons adjust almost instantly to nuclear motion. The **Born–Oppenheimer (BO) approximation** freezes the nuclei, solves the electronic problem for fixed $\{\vR_I\}$, and treats the resulting energy as a potential for the nuclei:

$$
\hat H_{\text{el}}\,\Psi(\{\vr_i\};\{\vR_I\}) = E_{\text{el}}(\{\vR_I\})\,\Psi, \qquad
U(\{\vR_I\}) = E_{\text{el}}(\{\vR_I\}) + E_{\text{nn}}(\{\vR_I\})
$$

$U(\{\vR\})$ is the **potential energy surface (PES)**. Its gradient gives forces, $\mathbf F_I = -\nabla_I U$; its minima are stable structures; its saddle points are transition states; its curvature gives vibrational frequencies. Almost everything DFT is used for, including MD and ML potentials, is about computing points on this surface.

> [!INTERVIEW] "What is an ML interatomic potential actually learning?"
> The Born–Oppenheimer potential energy surface $U(\{\vR_I\}, \{Z_I\})$ as computed by some level of theory, usually a particular DFT functional with particular settings. Forces are $-\nabla U$. This is why "conservative" (gradient-based) forces matter, see [Chapter 8](08-ml-dft.md).

When does BO fail? When electronic states come close in energy, at conical intersections, in photochemistry, and in some processes with light nuclei (H tunnelling). Then non-adiabatic couplings matter.

From now on, "the Hamiltonian" means the electronic one for fixed nuclei:

$$
\hat H = \hat T + \hat V_{\text{ext}} + \hat W, \qquad \hat V_{\text{ext}} = \sum_i \vext(\vr_i), \quad \vext(\vr) = -\sum_I \frac{Z_I}{|\vr-\vR_I|}
$$

The important point is that $\hat T$ and $\hat W$ are the **same for every system of $N$ electrons**. Only $\vext$, i.e. where the nuclei are and what they are, distinguishes a water molecule from a silicon crystal. DFT builds on this observation.

## The exponential wall

The wavefunction $\Psi(\vr_1\sigma_1,\dots,\vr_N\sigma_N)$ lives in $3N$ spatial dimensions. Store it on a grid with only $p$ points per dimension and you need $p^{3N}$ numbers.

| System | $N$ electrons | Numbers for $p=10$ |
|---|---|---|
| He atom | 2 | $10^{6}$ |
| H₂O | 10 | $10^{30}$ |
| Benzene | 42 | $10^{126}$ |
| A small protein | ~10⁴ | more than atoms in the universe, many times over |

Walter Kohn's Nobel lecture argues that for large $N$ the wavefunction is not even a *legitimate* scientific concept: you could neither compute nor store it, nor measure it to meaningful accuracy (the overlap of an approximate and exact $\Psi$ decays exponentially with $N$ even when each electron is described very well). This is the **exponential wall**.

The density is different. It is always a function of just 3 variables:

$$
n(\vr) = N \sum_{\sigma_1\ldots\sigma_N}\int |\Psi(\vr\sigma_1, \vr_2\sigma_2,\dots,\vr_N\sigma_N)|^2\,\dd\vr_2\cdots \dd\vr_N, \qquad \int n(\vr)\,\dd\vr = N
$$

> [!KEY] The motivating question
> Can we work with $n(\vr)$, three variables regardless of $N$, instead of $\Psi$? Hohenberg and Kohn proved the answer is *yes, in principle*.

## Hartree: mean field without exchange

The simplest idea: each electron moves in the average electrostatic field of all the others. Writing $\Psi$ as a simple product $\phi_1(\vr_1)\phi_2(\vr_2)\cdots$ and minimising the energy gives

$$
\Big[-\tfrac12\nabla^2 + \vext(\vr) + v_{\mathrm H}(\vr)\Big]\phi_i = \varepsilon_i\phi_i, \qquad v_{\mathrm H}(\vr) = \int\frac{n(\vr')}{|\vr-\vr'|}\,\dd\vr'
$$

The Hartree potential $v_{\mathrm H}$ satisfies Poisson's equation, $\nabla^2 v_{\mathrm H} = -4\pi n$. Because $v_{\mathrm H}$ depends on the orbitals through $n$, the equations must be solved **self-consistently**: guess $n$ → build $v_{\mathrm H}$ → solve → new $n$ → repeat. Kohn–Sham DFT has exactly this structure.

Two flaws:

1. **Self-interaction.** $v_{\mathrm H}$ is built from the *total* density, including electron $i$ itself, so each electron repels itself. For hydrogen (one electron) the Hartree energy should be zero but isn't.
2. **No antisymmetry.** A product wavefunction ignores the Pauli principle.

## Hartree–Fock: exact exchange, no correlation

Use a single **Slater determinant**, which is antisymmetric by construction:

$$
\Psi_{\text{SD}} = \frac{1}{\sqrt{N!}}\det\big[\chi_j(\mathbf x_i)\big], \qquad \mathbf x = (\vr,\sigma)
$$

Minimising $\langle\Psi_{\text{SD}}|\hat H|\Psi_{\text{SD}}\rangle$ gives the Hartree–Fock equations:

$$
\Big[-\tfrac12\nabla^2 + \vext + v_{\mathrm H}\Big]\chi_i(\mathbf x) - \sum_j \int \frac{\chi_j^*(\mathbf x')\chi_i(\mathbf x')}{|\vr-\vr'|}\,\dd\mathbf x'\;\chi_j(\mathbf x) = \varepsilon_i\chi_i(\mathbf x)
$$

The last term is the **exchange operator**. It is *non-local*: it acts on $\chi_i$ at $\vr'$, not just $\vr$. It does two things:

- It **cancels self-interaction exactly**: the $j=i$ exchange term cancels the $i$-th orbital's contribution to $v_{\mathrm H}$.
- It keeps same-spin electrons apart (the **Fermi hole**): the probability of finding two same-spin electrons at the same point is zero.

The exchange energy is

$$
E_{\text x}^{\text{HF}} = -\frac12\sum_{\sigma}\sum_{i,j\in\sigma}\iint\frac{\phi_i^*(\vr)\phi_j(\vr)\phi_j^*(\vr')\phi_i(\vr')}{|\vr-\vr'|}\,\dd\vr\,\dd\vr'
$$

This same expression, evaluated with *Kohn–Sham* orbitals, is the "exact exchange" mixed into hybrid functionals.

### Correlation: what HF misses

By definition, the **correlation energy** is what a single determinant misses:

$$
E_{\text c} = E_{\text{exact}} - E_{\text{HF}} \quad (<0)
$$

It is small in absolute terms (~1 % of the total energy) but chemically huge. HF:

- underestimates binding: F₂ is *unbound* in HF,
- has no dispersion (van der Waals) at all,
- gives qualitatively wrong dissociation curves (restricted HF H₂ dissociates to an ionic H⁺ + H⁻ mixture),
- predicts a metal's density of states at the Fermi level to be zero (pathological for the electron gas).

Correlation comes in two flavours that are worth naming in an interview:

| Type | Physics | Example | Handled by |
|---|---|---|---|
| **Dynamic** | Electrons avoid each other instantaneously (the Coulomb hole) | Most closed-shell molecules near equilibrium | MP2, CCSD(T), and roughly by DFT functionals |
| **Static (strong)** | Several determinants are nearly degenerate | Bond breaking, transition-metal oxides, diradicals | CASSCF, DMRG; poorly by standard DFT |

## The wavefunction ladder (for comparison)

| Method | Scaling | Typical accuracy | Comment |
|---|---|---|---|
| Hartree–Fock | $N^4$ (formally) | poor energies | no correlation |
| MP2 | $N^5$ | ~2–5 kcal/mol | perturbative; fails for metals and small gaps |
| CCSD(T) | $N^7$ | ~0.5–1 kcal/mol | the "gold standard" for single-reference molecules |
| Full CI | exponential | exact in the basis | only tiny systems |
| QMC (DMC) | ~$N^3$–$N^4$ (large prefactor) | very accurate | fixed-node error; stochastic |
| **KS-DFT (GGA)** | $N^3$ | 2–10 kcal/mol | the best accuracy/cost ratio known |

> [!TIP] Where ML comes in
> Coupled-cluster accuracy at DFT cost is the dream. Δ-learning (learn CCSD(T) − DFT), learned functionals trained on high-level data, and neural-network wavefunctions (FermiNet, PauliNet, Psiformer) all target this gap.

## Summary

- Born–Oppenheimer reduces chemistry to an electronic problem on a potential energy surface.
- The many-electron wavefunction grows exponentially with $N$ (the exponential wall); the density doesn't.
- Hartree has self-interaction and no Pauli principle. HF adds exact exchange (and removes self-interaction) but has no correlation.
- Correlation, dynamic and static, is what makes chemistry hard. DFT includes it approximately at mean-field cost.

```quiz
? Under the Born–Oppenheimer approximation, what plays the role of the potential energy for nuclear motion?
+ The electronic ground-state energy plus nuclear repulsion, as a function of nuclear positions
- The kinetic energy of the nuclei
- The Hartree potential
- The external potential $\vext(\vr)$ evaluated at the nuclei
= $U(\{\vR\}) = E_{\text{el}}(\{\vR\}) + E_{\text{nn}}$ is the potential energy surface. Forces are its negative gradient.

? Which of these distinguishes one $N$-electron system from another in the electronic Hamiltonian?
- The kinetic energy operator $\hat T$
- The electron–electron repulsion $\hat W$
+ The external potential $\vext$
- The number of spin states
= $\hat T$ and $\hat W$ are universal for a given $N$. Only $\vext$ (nuclear positions and charges) changes. This is why a *universal* functional $F[n]$ can exist.

? What does the exchange term in Hartree–Fock accomplish? (select all)
+ Cancels the self-interaction contained in the Hartree term
+ Keeps same-spin electrons apart (Fermi hole)
- Keeps opposite-spin electrons apart (Coulomb hole)
- Includes dispersion interactions
= Exchange acts only between same-spin electrons. Opposite-spin avoidance (the Coulomb hole) and dispersion are correlation effects, missing in HF.

? The correlation energy is defined as
+ $E_{\text{exact}} - E_{\text{HF}}$
- $E_{\text{HF}} - E_{\text{Hartree}}$
- $\Exc - E_{\text x}$ in LDA
- The kinetic energy difference $T - \Ts$
= This is the traditional quantum-chemistry definition. (The DFT correlation energy is defined slightly differently, relative to the KS determinant, but is numerically very close.)

? Static (strong) correlation is important when…
- Molecules are near their equilibrium geometry
+ Several determinants are nearly degenerate, e.g. stretched bonds
- The system has many electrons
- The basis set is small
= Near-degeneracy (bond breaking, open-shell transition metals, diradicals) makes a single determinant qualitatively wrong. That is static correlation.

? Why does storing $\Psi$ for 10 electrons on a coarse 10-point-per-dimension grid fail?
+ It needs $10^{30}$ numbers
- It needs $10^{10}$ numbers, which is too slow
- Electrons cannot be put on a grid
- Antisymmetry cannot be imposed on a grid
= $p^{3N} = 10^{30}$. The density needs only $p^3 = 10^3$ numbers whatever $N$ is.
```

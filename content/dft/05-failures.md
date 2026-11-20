# Where DFT fails — and the fixes

<p class="lede">Knowing <em>when not to trust</em> DFT is what separates a practitioner from someone who has only run calculations. Almost every failure of approximate functionals traces back to a few root causes: self-interaction and delocalisation error, missing derivative discontinuity, static correlation, and missing non-local correlation.</p>

## Self-interaction error (SIE)

For any one-electron system the exact functional must satisfy

$$
\Exc[n_{1e}] = -\EH[n_{1e}] \qquad (E_{\text c}[n_{1e}] = 0)
$$

so that the electron does not repel itself. HF satisfies this by construction. LDA and GGA do **not**: a small piece of spurious self-repulsion remains. Consequences:

- **H₂⁺ dissociation:** the energy is far too low at large separation, because half an electron on each proton has less self-repulsion than one whole electron on one proton. The exact curve goes to $E(\text H) = -0.5$ Ha; GGA goes lower.
- Potentials decay exponentially instead of as $-1/r$, so anions are often unbound and $-\varepsilon_{\text{HOMO}}$ underestimates $I$.
- Spurious charge transfer and over-delocalised charges (e.g. a hole spread over several sites instead of a localised polaron).

The **Perdew–Zunger self-interaction correction (1981)** subtracts the self-interaction orbital by orbital,

$$
E^{\text{PZ-SIC}} = E^{\text{DFA}}[n_\uparrow,n_\downarrow] - \sum_{i\sigma}\Big(\EH[n_{i\sigma}] + \Exc^{\text{DFA}}[n_{i\sigma},0]\Big)
$$

It fixes one-electron systems but often worsens equilibrium properties, and makes the functional orbital-dependent and not unitarily invariant. Modern variants: Fermi–Löwdin orbital SIC, and Koopmans-compliant functionals.

## Delocalisation error and fractional charges

For an open system the exact $E(N)$ is a set of **straight lines** between integer electron numbers (Perdew, Parr, Levy, Balduz 1982), because a system with fractional charge is a statistical mixture of the neighbouring integer states:

$$
E(N_0 + \delta) = (1-\delta)E(N_0) + \delta E(N_0+1), \qquad 0\le\delta\le1
$$

Semilocal functionals make $E(N)$ **convex** (curving below the line). That means a fractional charge spread over two fragments is artificially stabilised: **delocalisation error** (Mori-Sánchez, Cohen, Yang 2008). HF makes it **concave**: localisation error. Hybrids partially cancel the two.

```anim
fractional-charge
```

In the figure, the slope of $E(N)$ is the chemical potential. For the exact functional it **jumps** at the integer: from $-I$ on the left to $-A$ on the right. The convex DFA curve smears this jump out, so the gap read off from the derivatives (equivalently the KS eigenvalues) is too small.

> [!INTERVIEW] Things that delocalisation error explains
> Underestimated band gaps; underestimated reaction barriers (transition states have stretched, delocalised bonds); spurious charge transfer in donor–acceptor complexes; over-binding of anions and halide complexes; too-delocalised polarons and defect states; wrong dissociation limits of odd-electron radicals like H₂⁺ and (H₂O)₂⁺.

## The band-gap problem

The fundamental gap is $E_g = I - A$. For the exact functional,

$$
E_g = \underbrace{(\varepsilon_{N+1} - \varepsilon_N)}_{E_g^{\text{KS}}} + \Delta_{\text{xc}}, \qquad \Delta_{\text{xc}} = \vxc^{+}(\vr) - \vxc^{-}(\vr)
$$

$\Delta_{\text{xc}}$ is the **derivative discontinuity**: the exact xc potential jumps by a constant when $N$ crosses an integer. Two separate problems lower LDA/GGA gaps:

1. They have $\Delta_{\text{xc}} = 0$ (smooth in $N$), and
2. their KS gap is itself different from the exact KS gap.

For solids even the exact KS gap is smaller than the true gap, so "KS gap = real gap" is wrong in principle, not only in practice.

| Material | PBE gap (eV) | HSE06 (eV) | Experiment (eV) |
|---|---|---|---|
| Si | ≈ 0.6 | ≈ 1.2 | 1.17 |
| Ge | ≈ 0 (metallic) | ≈ 0.8 | 0.74 |
| GaAs | ≈ 0.5 | ≈ 1.3 | 1.52 |
| ZnO | ≈ 0.7 | ≈ 2.4 | 3.4 |
| Diamond | ≈ 4.1 | ≈ 5.3 | 5.5 |
| NiO | ≈ 0.5–1 | ≈ 4 | ≈ 4 |

Fixes, in rising cost order:

- **Scissor shift**: rigidly shift the conduction bands (empirical).
- **Meta-GGAs** (mBJ potential, TB09) are fitted to give good gaps cheaply. mBJ is a potential, not an energy functional.
- **DFT+U** for localised d/f states.
- **Hybrids** (HSE06, or dielectric-dependent hybrids with $\alpha = 1/\varepsilon_\infty$).
- **GW** (many-body perturbation theory) on top of DFT: the gold standard for quasiparticle gaps (Chapter 7).
- **Koopmans-compliant functionals**: enforce piecewise linearity orbital by orbital.

## Static (strong) correlation

When several determinants are nearly degenerate, a single KS determinant built from approximate functionals struggles.

- **H₂ dissociation:** spin-restricted KS gives a dissociation energy that is far too high (wrong limit). Spin-*unrestricted* KS gets the right energy at large $R$ by breaking spin symmetry (up spin on one H, down on the other), but the resulting state is spin-contaminated, and there is a sudden "Coulson–Fischer" point where symmetry breaks.
- **Mott insulators** (NiO, CoO, MnO, many cuprates): LDA/GGA often predicts metals or tiny gaps, because partially filled d-bands are delocalised by SIE.
- **Transition-metal complexes, spin-state energetics:** results depend strongly on the exact-exchange fraction (more exact exchange favours high spin).
- **Diradicals, stretched bonds, multi-reference transition states.**

Remedies: broken-symmetry DFT (useful but use carefully), DFT+U, DFT+DMFT for correlated solids, multiconfigurational pair-density functional theory (MC-PDFT), or genuine wavefunction methods (CASSCF/NEVPT2, DMRG).

## DFT+U

The **Hubbard U** correction targets self-interaction in localised d/f shells. In the rotationally invariant Dudarev form:

$$
E_{\text{DFT+U}} = E_{\text{DFT}} + \frac{U_{\text{eff}}}{2}\sum_{\sigma}\operatorname{Tr}\big[\mathbf n^\sigma(1-\mathbf n^\sigma)\big], \qquad U_{\text{eff}} = U - J
$$

$\mathbf n^\sigma$ is the occupation matrix of the localised orbitals (projected onto atomic-like d or f states). The penalty is zero for occupations 0 or 1 and largest for half-filled fractional occupation. It pushes the system toward integer occupation, i.e. it *restores* piecewise linearity for those orbitals. The potential shift is $V_{m\sigma} = U_{\text{eff}}(\tfrac12 - n_{m\sigma})$: occupied states move down and empty states move up, so a gap opens.

Points interviewers like to hear:

- **U is not universal.** It depends on the projector, the pseudopotential and the code. Values come from linear response (Cococcioni & de Gironcoli), from cRPA, or from fitting to experiment (e.g. oxide formation enthalpies in Materials Project: U(Fe) ≈ 5.3 eV, U(Ni) ≈ 6.2 eV, U(Co) ≈ 3.3 eV).
- **Total energies with different U are not comparable.** Materials Project mixes GGA and GGA+U data by fitting energy corrections so reaction energies are consistent. If you train an ML model on such data, you must know which entries are +U and apply the same corrections, or your phase diagrams are wrong.
- DFT+U can have **multiple self-consistent solutions** (different orbital orderings). Starting occupations matter.

## Other known failure modes

| Problem | Cause | Fix |
|---|---|---|
| No dispersion; layered materials fall apart | Missing non-local correlation | D3/D4, MBD, vdW-DF, rVV10 |
| Reaction barriers too low | Delocalisation error at the transition state | Hybrids with ≥ 40–50 % exact exchange (BH&HLYP, M06-2X), range-separated hybrids |
| Charge-transfer excitations too low in TDDFT | Wrong asymptotics; no $-1/R$ electron–hole attraction | Range-separated hybrids (ωB97X, CAM-B3LYP), optimally tuned ω |
| Anions unbound / diffuse states wrong | Exponentially decaying potential | Diffuse basis + LC hybrids; or trust the energy, not the orbital energy |
| Density-driven errors | The self-consistent density is wrong (SIE) | HF-DFT: evaluate the functional on the HF density (Burke and co-workers) |
| Magnetic ordering energies off | SIE in d states | DFT+U, hybrids |
| Overstabilised metallic states in oxides | SIE | DFT+U, hybrids |
| Strongly correlated f-electron physics | Static correlation | DFT+DMFT |

> [!DANGER] A common mistake in ML datasets
> Combining energies from different functionals, or from GGA and GGA+U, or from different pseudopotentials, without consistent corrections. The model then learns artefacts (e.g. jumps in energy that track U, not chemistry). Always record the "level of theory" with every label.

## Summary

- **SIE / delocalisation error** (convex $E(N)$) underlies too-small gaps, too-low barriers and spurious charge transfer.
- The **fundamental gap** needs the derivative discontinuity. KS gaps are not fundamental gaps, even in principle.
- **Static correlation** breaks single-determinant pictures: use broken symmetry, +U, DMFT or multireference methods.
- **DFT+U** penalises fractional occupation of localised orbitals. U is system- and code-dependent, and energies across U are not directly comparable.

```quiz
? The exact $E(N)$ between integer electron numbers is…
+ Piecewise linear
- Convex (curving below the straight line)
- Concave (curving above the straight line)
- Quadratic
= Perdew–Parr–Levy–Balduz: a fractional-$N$ system is an ensemble of the neighbouring integer states, so $E$ is linear in between.

? Semilocal functionals make $E(N)$ convex. What is this called and what does it cause?
+ Delocalisation error; it artificially stabilises spread-out charge and lowers gaps and barriers
- Localisation error; it localises charges too much
- Static correlation error; it breaks spin symmetry
- Basis-set superposition error
= Convexity favours fractional charges spread over fragments. HF has the opposite (concave) localisation error.

? With the exact functional, the KS gap of a solid…
- Equals the fundamental gap
+ Differs from the fundamental gap by the derivative discontinuity
- Is always zero
- Equals the optical gap
= $E_g = E_g^{\text{KS}} + \Delta_{\text{xc}}$. The exact KS gap of a solid is generally smaller than the true gap.

? What does the Hubbard U term do?
+ Penalises fractional occupation of localised orbitals, pushing occupied states down and empty states up
- Adds dispersion interactions
- Increases the plane-wave cutoff for d electrons
- Replaces exchange with HF exchange everywhere
= $\frac{U}{2}\operatorname{Tr}[\mathbf n(1-\mathbf n)]$ vanishes for integer occupation. Its potential $U(\frac12 - n_m)$ opens a gap between occupied and empty localised states.

? Why can't you directly compare total energies from GGA and GGA+U calculations?
+ The +U term changes the energy zero in a composition-dependent way, so corrections must be fitted to mix them
- GGA+U energies are always positive
- They use different numbers of electrons
- GGA+U can only be used for metals
= Materials Project fits elemental/anion corrections so GGA and GGA+U data give consistent formation and reaction energies.

? Spin-unrestricted DFT gets the H₂ dissociation energy roughly right at large separation by…
+ Breaking spin symmetry (spin up on one atom, spin down on the other)
- Using a larger basis set
- Including dispersion corrections
- Using a smaller smearing
= Broken symmetry mimics the static correlation of the two-determinant wavefunction, at the cost of spin contamination.

? Which failure is most directly addressed by range-separated (long-range corrected) hybrids?
+ Too-low charge-transfer excitation energies in TDDFT
- Missing dispersion between layers of graphite
- Lattice constants of simple metals
- Phonon frequencies of silicon
= 100 % long-range exact exchange restores the $-1/r$ potential and the $-1/R$ electron–hole attraction needed for charge-transfer states.
```

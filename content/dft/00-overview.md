# Roadmap & one-page cheat sheet

<p class="lede">Density functional theory (DFT) is the method behind most of computational chemistry and materials science: about a third of all supercomputer time in materials science, almost every crystal in the Materials Project, and the training data for nearly every machine-learned interatomic potential. This chapter tells you what is in these notes and lists the facts you should be able to state from memory.</p>

## What DFT is, in three sentences

1. The ground-state energy of $N$ interacting electrons in an external potential is a **functional of the electron density** $n(\vr)$, a function of 3 variables, rather than of the wavefunction $\Psi(\vr_1,\dots,\vr_N)$, a function of $3N$ variables (**Hohenberg–Kohn**, 1964).
2. That functional can be minimised by solving single-particle equations for a fictitious **non-interacting** system with the same density (**Kohn–Sham**, 1965).
3. Everything we do not know exactly is lumped into one small term, the **exchange–correlation energy** $\Exc[n]$, which has to be approximated (LDA, GGA, hybrids, …). The quality of a DFT calculation depends on that approximation.

> [!KEY] The one-line summary
> DFT is exact in principle and approximate in practice. Every known error comes from the approximate $\Exc$, or from numerical choices such as the basis, pseudopotentials, k-points and smearing.

## Why tech companies care

AI-for-science groups (Google DeepMind, Microsoft Research AI for Science, Meta FAIR Chemistry, NVIDIA, and start-ups building materials and drug-discovery platforms) use DFT in three ways:

- **As a data generator.** Datasets such as Materials Project, OC20/OC22, OMat24, MPtrj, SPICE and QM9 are all DFT labels. If you don't know what a PBE energy *means*, including its errors, its convergence parameters and the pitfalls of mixing PBE with PBE+U, you will train models on inconsistent targets.
- **As the thing to replace or speed up.** Machine-learned interatomic potentials (MLIPs) emulate DFT at a tiny fraction of the cost. Learned functionals (DM21, Skala) try to improve $\Exc$ directly.
- **As the validator.** Generated crystals (GNoME, MatterGen) and screened catalysts are checked with DFT relaxations before anyone believes them.

> [!INTERVIEW] What interviewers probe
> (1) Can you derive the KS equations and explain what each term is? (2) Do you understand *why* standard functionals fail (self-interaction, band gaps, dispersion)? (3) Do you know the practical knobs (cutoff, k-points, smearing, pseudopotentials, SCF mixing) and how to converge them? (4) Can you connect all of this to ML: what the labels are, why forces should be conservative, why equivariance matters, how to evaluate a universal potential?

## How to use these notes

| If you want to… | Read |
|---|---|
| Learn DFT from scratch | Chapters 1 → 7 in order, doing every quiz |
| Prepare for an ML-for-science interview in a week | 0, 3, 4, 5, 6, 8, then the [question bank](11-interview.md) |
| Revise the night before | This page, then the [final exam & flashcards](12-exam.md) |
| Get hands-on | [Chapter 9](09-hands-on.md): a full 1D Kohn–Sham code, then PySCF and ASE |

Interactive figures are **real computations**. The SCF solver in Chapter 3 diagonalises a Kohn–Sham Hamiltonian in your browser on every iteration. Change the parameters and watch what happens.

## The cheat sheet

### Hamiltonian (atomic units: $\hbar = m_e = e = 4\pi\varepsilon_0 = 1$)

$$
\hat H = -\frac12\sum_i \nabla_i^2 \;-\; \sum_{i,I}\frac{Z_I}{|\vr_i-\vR_I|} \;+\; \frac12\sum_{i\neq j}\frac{1}{|\vr_i-\vr_j|} \;=\; \hat T + \hat V_{\text{ext}} + \hat W
$$

### Hohenberg–Kohn

$$
E_v[n] = F[n] + \int v(\vr)\,n(\vr)\,\dd\vr, \qquad F[n] = \min_{\Psi\to n}\langle\Psi|\hat T+\hat W|\Psi\rangle, \qquad E_0 = \min_n E_v[n]
$$

### Kohn–Sham energy and equations

$$
E[n] = \Ts[n] + \int \vext\, n \,\dd\vr + \underbrace{\frac12\iint\frac{n(\vr)n(\vr')}{|\vr-\vr'|}\dd\vr\,\dd\vr'}_{\EH[n]} + \Exc[n]
$$

$$
\Big[-\tfrac12\nabla^2 + \underbrace{\vext(\vr) + v_{\mathrm H}(\vr) + \vxc(\vr)}_{\veff(\vr)}\Big]\phi_i(\vr) = \varepsilon_i\,\phi_i(\vr), \qquad n(\vr)=\sum_i f_i|\phi_i(\vr)|^2, \qquad \vxc = \frac{\delta \Exc}{\delta n}
$$

### Total energy from eigenvalues ("double counting")

$$
E = \sum_i f_i\varepsilon_i \;-\; \EH[n] \;-\; \int \vxc(\vr)\, n(\vr)\,\dd\vr \;+\; \Exc[n]
$$

### Exchange–correlation

$$
\Exc^{\text{LDA}} = \int n\,\epsilon_{\text{xc}}^{\text{unif}}(n)\,\dd\vr, \quad
\epsilon_{\text x}^{\text{unif}} = -\frac34\Big(\frac3\pi\Big)^{1/3} n^{1/3}, \quad
\Exc^{\text{GGA}} = \int n\,\epsilon_{\text x}^{\text{unif}}(n)\,F_{\text{xc}}(r_s,\zeta,s)\,\dd\vr, \quad
s = \frac{|\nabla n|}{2(3\pi^2)^{1/3}n^{4/3}}
$$

$$
E_{\text{xc}}^{\text{PBE0}} = \tfrac14 E_{\text x}^{\text{HF}} + \tfrac34 E_{\text x}^{\text{PBE}} + E_{\text c}^{\text{PBE}}
\qquad
E_{\text{xc}}^{\text{HSE06}}:\ \text{same, but HF exchange only at short range } (\omega = 0.11\,a_0^{-1})
$$

### Exact conditions worth quoting

- **Janak:** $\partial E/\partial f_i = \varepsilon_i$.
- **Ionisation-potential theorem:** for the exact functional, $\varepsilon_{\text{HOMO}} = -I$.
- **Piecewise linearity:** $E(N)$ is a straight line between integer $N$. Semilocal functionals are convex between integers (delocalisation error).
- **Derivative discontinuity:** $E_g = I - A = \varepsilon_{\text{LUMO}}^{\text{KS}} - \varepsilon_{\text{HOMO}}^{\text{KS}} + \Delta_{\text{xc}}$. The KS gap is *not* the fundamental gap, even with the exact functional.
- **Asymptotics:** the exact $\vxc(\vr) \to -1/r$ far from a finite system. LDA and GGA potentials decay exponentially.
- **Lieb–Oxford bound:** $\Exc \ge -1.68\int n^{4/3}$, which a GGA enforces as $F_x \le 1.804$ in PBE.

### Practical numbers

| Quantity | Typical value |
|---|---|
| 1 Hartree | 27.211 eV = 627.5 kcal/mol |
| 1 eV | 23.06 kcal/mol = 96.49 kJ/mol |
| 1 bohr | 0.529 Å |
| Chemical accuracy | 1 kcal/mol ≈ 43 meV |
| PBE lattice constants | ~1 % too large (LDA: ~1–2 % too small) |
| PBE band gaps | typically 30–50 % too small (Si: 0.6 eV vs 1.17 eV) |
| Plane-wave cutoffs (PAW, VASP) | 400–600 eV for most production work |
| KS-DFT cost | $O(N^3)$ in the number of electrons (diagonalisation/orthogonalisation) |

```quiz
? What is the basic variable of DFT?
+ The ground-state electron density $n(\vr)$
- The $N$-electron wavefunction $\Psi(\vr_1,\dots,\vr_N)$
- The one-body reduced density matrix $\gamma(\vr,\vr')$
- The Kohn–Sham eigenvalues $\varepsilon_i$
= Hohenberg–Kohn showed that the ground-state density determines the external potential (up to a constant) and therefore every ground-state property.

? In Kohn–Sham DFT, which term must be approximated?
- The kinetic energy of the interacting system, entirely
- The Hartree energy
+ The exchange–correlation energy $\Exc[n]$
- The external-potential energy
= $\Ts$ (non-interacting kinetic energy), $\EH$ and $\int \vext n$ are computed exactly from the orbitals and density. Only $\Exc$ is unknown. It also absorbs the kinetic-energy difference $T - \Ts$.

? Why do ML-for-materials teams need to understand DFT details such as cutoffs and +U?
+ Training labels come from DFT, and inconsistent settings make targets inconsistent
- Because ML models must solve the KS equations internally
- Because ML models need pseudopotentials as input features
- They don't; DFT is a black box for ML
= MLIPs and property models learn DFT outputs. Mixing PBE and PBE+U energies, different pseudopotentials or unconverged k-meshes puts systematic noise into the labels.

? With the *exact* functional, the Kohn–Sham HOMO–LUMO gap equals…
- the fundamental gap $I-A$
+ the fundamental gap minus the derivative discontinuity $\Delta_{\text{xc}}$
- the optical gap
- the HOMO eigenvalue
= $E_g = E_g^{\text{KS}} + \Delta_{\text{xc}}$. Even the exact KS potential gives a gap that differs from $I-A$ by the jump in $\vxc$ when the electron number crosses an integer.
```

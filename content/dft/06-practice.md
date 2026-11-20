# DFT in practice

<p class="lede">The functional sets the physics, but numerical choices decide whether you get the answer that functional actually gives. This chapter covers what every practitioner (and every ML engineer consuming DFT data) must understand: periodic boundary conditions, k-points, basis sets, pseudopotentials, smearing, SCF algorithms and convergence testing.</p>

## Periodic systems and Bloch's theorem

A crystal has a periodic potential, $\veff(\vr+\vR) = \veff(\vr)$ for every lattice vector $\vR$. **Bloch's theorem** says the eigenstates can be chosen as

$$
\psi_{n\vk}(\vr) = e^{i\vk\cdot\vr}\,u_{n\vk}(\vr), \qquad u_{n\vk}(\vr+\vR) = u_{n\vk}(\vr)
$$

with a band index $n$ and a crystal momentum $\vk$ in the first **Brillouin zone (BZ)**. An infinite crystal turns into a finite cell problem for every $\vk$. Densities and energies become BZ averages:

$$
n(\vr) = \sum_n\frac{1}{\Omega_{\text{BZ}}}\int_{\text{BZ}} f_{n\vk}\,|\psi_{n\vk}(\vr)|^2\,\dd\vk \;\approx\; \sum_n\sum_{\vk} w_\vk\, f_{n\vk}\,|\psi_{n\vk}(\vr)|^2
$$

## k-point sampling

The BZ integral is replaced by a weighted sum over a grid. The standard choice is the **Monkhorst–Pack (1976)** grid: $n_1\times n_2\times n_3$ points evenly spaced along each reciprocal lattice vector, optionally shifted off Γ. Symmetry reduces it to the **irreducible** wedge with weights.

```anim
kpoints
```

Rules of thumb:

- **Insulators** converge exponentially fast with grid density (the bands are smooth and the occupied manifold is analytic in $\vk$). **Metals** converge slowly because the Fermi surface cuts bands discontinuously, so they need smearing plus dense grids.
- The number of k-points needed scales **inversely with cell size**: a 2×2×2 supercell needs half the grid in each direction. Specify a k-point *density* (e.g. spacing ≤ 0.2 Å⁻¹, or "k-points per reciprocal atom") rather than a grid for high-throughput work.
- **Γ-centred** grids are required for hexagonal cells (shifted MP grids break the hexagonal symmetry) and are often preferred in general.
- Slabs need only one k-point in the vacuum direction; isolated molecules in a box need only Γ.

## Basis sets

Expand $\phi_i = \sum_\mu c_{\mu i}\chi_\mu$, which turns the KS equations into a matrix eigenvalue problem $\mathbf H\mathbf c = \varepsilon\mathbf S\mathbf c$.

| Basis | Pros | Cons | Codes |
|---|---|---|---|
| **Plane waves** $e^{i(\vk+\vG)\cdot\vr}$ | Systematic (one parameter, $E_{\text{cut}}$); orthogonal; no basis-set superposition error; no Pulay forces; FFTs make $\hat H\psi$ cheap | Need pseudopotentials; vacuum costs as much as matter; exact exchange expensive | VASP, Quantum ESPRESSO, ABINIT, CASTEP |
| **Gaussians** $x^ly^mz^ne^{-\alpha r^2}$ | Compact for molecules; analytic integrals; exact exchange cheap; all-electron | Basis-set superposition error (BSSE); overcompleteness; harder to converge systematically | Gaussian, ORCA, PySCF, Q-Chem, Psi4 |
| **Numerical atomic orbitals** | Compact; linear scaling possible | Pulay forces, BSSE | SIESTA, FHI-aims, ABACUS |
| **Gaussian + plane waves** (GPW) | Gaussians for orbitals, PW for density/Hartree | Pseudopotentials needed | CP2K |
| **(L)APW** | All-electron gold standard for solids | Expensive, complex | WIEN2k, exciting, FLEUR |
| **Real-space grids / wavelets** | Easy parallelisation, flexible boundaries | Egg-box effect | GPAW (grid mode), Octopus, BigDFT |

### Plane waves and the cutoff energy

For each $\vk$:

$$
\psi_{n\vk}(\vr) = \sum_{|\vk+\vG|^2/2 \,<\, E_{\text{cut}}} c_{n,\vk+\vG}\;e^{i(\vk+\vG)\cdot\vr}
$$

The single parameter $E_{\text{cut}}$ controls the quality; the number of plane waves grows as $E_{\text{cut}}^{3/2}\,\Omega$. The kinetic energy is diagonal in this basis; the local potential is diagonal in real space. So $\hat H\psi$ is applied by FFT-ing back and forth, at $O(N_{\text{PW}}\log N_{\text{PW}})$ per band, without ever building $\mathbf H$.

**Why pseudopotentials are unavoidable with plane waves:** near a nucleus the all-electron wavefunction has a cusp, and valence orbitals have nodes (orthogonality to core states). Sharp features need huge $\vG$, so all-electron plane-wave calculations of, say, Fe would need cutoffs of tens of thousands of eV. Try it:

```anim
pw-cutoff
```

## Pseudopotentials and PAW

Core electrons are chemically inert. **Freeze them** and replace nucleus plus core with a smooth effective potential that reproduces the valence scattering properties outside a core radius $r_c$.

| Type | Idea | Typical cutoff | Notes |
|---|---|---|---|
| **Norm-conserving** (Hamann, Troullier–Martins, ONCV) | Pseudo-wavefunction equals all-electron one beyond $r_c$ and has the same charge inside | High (60–100 Ry) | Simple, required by some methods (DFPT for some codes, GW codes); SG15, PseudoDojo libraries |
| **Ultrasoft** (Vanderbilt 1990) | Drop norm conservation; add augmentation charges | Low (25–50 Ry) | Generalised eigenproblem with an overlap $\hat S$; GBRV, SSSP libraries |
| **PAW** (Blöchl 1994) | Linear transformation $\lvert\psi\rangle = \lvert\tilde\psi\rangle + \sum_i(\lvert\phi_i\rangle - \lvert\tilde\phi_i\rangle)\langle\tilde p_i\vert\tilde\psi\rangle$ maps smooth pseudo-wavefunctions to all-electron ones | Low | Recovers all-electron quantities (the frozen core is the only approximation); VASP's default |

Trade-offs: a **smaller $r_c$** is more transferable (works across more chemical environments) but harder (needs a higher cutoff). Including **semicore states** (e.g. 3s3p for Ti, Fe_pv in VASP) improves accuracy for high-pressure, magnetic and some oxide systems at higher cost. The pseudopotential must match the functional used to generate it (a PBE potential for PBE calculations), although people often violate this in hybrid calculations.

> [!TIP] Verification
> The "Δ-test" (Lejaeghere et al., *Science* 2016) compared 40 codes and pseudopotential libraries on the equations of state of elemental solids. Modern codes agree with all-electron results to within ~1 meV/atom, comparable to the difference between experiments. Pseudopotential choice is a solved problem *if* you use a verified library (SSSP, PseudoDojo) at its recommended cutoff.

## Smearing and metals

At $T=0$ the occupations jump from 1 to 0 at the Fermi level. With a finite k-grid this makes the energy a jagged function of the grid and the SCF unstable (bands crossing $E_F$ flip occupancy between iterations). Replace the step by a smooth function of width $\sigma$:

```anim
smearing
```

| Scheme | Properties | When |
|---|---|---|
| Fermi–Dirac | Physical electronic temperature; long tails; free energy $F = E - TS$ | Finite-temperature physics; also robust generally |
| Gaussian | Simple; energy error $O(\sigma^2)$ | Semiconductors/insulators, unknown systems |
| Methfessel–Paxton | Energy error tiny for the same σ; negative occupations | Metals (avoid for insulators and gap/DOS work) |
| Marzari–Vanderbilt (cold) | Positive-definite density; small error | Metals, forces, relaxations |
| Tetrahedron (Blöchl) | No σ; linear interpolation | Accurate DOS and total energies on dense grids; not for forces in older codes |

Smearing gives the free energy $F(\sigma)$, not $E(\sigma=0)$. Codes report an extrapolated $E_0 \approx \frac12(E+F)$ for Gaussian-type smearing. Keep σ small enough that the entropy term $-TS$ is below ~1 meV/atom, and report the smearing used.

## Solving the eigenproblem

Plane-wave codes never fully diagonalise a matrix of dimension $N_{\text{PW}}\sim10^5$. They need only the lowest $N_b \approx N_e/2$ bands (plus a few buffer bands), so they use **iterative eigensolvers** that only apply $\hat H$ to vectors:

- **Davidson** (block Davidson): robust default (VASP `ALGO = Normal`, QE `diagonalization='david'`).
- **RMM-DIIS**: minimises the residual of each band separately; fast but can miss states, so start from Davidson (VASP `Fast`, `VeryFast`).
- **LOBPCG**, **PPCG**, **Chebyshev filtering** (ChASE, ELPA for dense steps).
- **Direct minimisation**: CG on the energy (CASTEP EDFT, CP2K's orbital transformation) for difficult insulators.

The precondition for all of them is the kinetic energy: high-$G$ components of the residual are damped by roughly $1/(G^2/2 - \varepsilon)$.

### Cost and scaling

| Step | Scaling |
|---|---|
| Applying $\hat H$ via FFTs | $O(N_b N_{\text{PW}}\log N_{\text{PW}})$, roughly $O(N^2\log N)$ |
| Orthogonalisation / subspace diagonalisation | $O(N_b^2 N_{\text{PW}})$, i.e. $O(N^3)$, which dominates for large systems |
| Exact exchange (hybrids) | $O(N_b^2 N_{\text{PW}}\log N_{\text{PW}})$ per k-pair, with large prefactors |

Practical limits: routine work with ~100–500 atoms; ~1000–5000 atoms on large machines; **linear-scaling DFT** ($O(N)$, exploiting the nearsightedness of electronic matter, Kohn 1996) in ONETEP, CONQUEST and BigDFT for insulators with 10⁴–10⁶ atoms. GPU acceleration is now standard (VASP, QE, CP2K, and JAX-based research codes).

## Convergence testing: the checklist

You converge **energy differences**, not absolute energies. Errors in absolute energy cancel when comparing similar systems.

1. **Cutoff $E_{\text{cut}}$:** increase until the energy difference you care about changes < 1 meV/atom. Stress and phonons converge more slowly than energies; with ultrasoft/PAW potentials use ~1.3× the default for cell relaxations (Pulay stress).
2. **k-points:** same test at fixed cutoff; metals need dense grids plus smearing.
3. **Smearing σ:** small enough that $TS$ is negligible, large enough for the k-grid to sample the Fermi surface.
4. **SCF tolerance:** 10⁻⁶ eV for relaxations, 10⁻⁸ eV for phonons (finite differences amplify noise).
5. **Supercell size:** for defects, surfaces and isolated molecules: vacuum ≥ 10–15 Å, slab thickness, defect–defect separation. Charged defects need finite-size corrections (Makov–Payne, Freysoldt–Neugebauer–Van de Walle). Asymmetric slabs need a dipole correction.
6. **Spin:** test magnetic configurations explicitly (FM, AFM, non-magnetic). The SCF only finds the state your initial moments point to.
7. **Pseudopotential and functional:** use consistent choices across a study. Write them down.

> [!WARNING] Pulay stress
> With plane waves the basis is fixed by $E_{\text{cut}}$. When the cell volume changes during a relaxation the *number* of plane waves stays fixed, so the effective cutoff changes and the stress is biased (too compressive). Remedies: higher cutoff, or recompute at the final geometry with a fresh basis.

## A minimal Quantum ESPRESSO input

```text
&control
  calculation = 'scf', prefix = 'si', pseudo_dir = './pseudo', tprnfor = .true., tstress = .true.
/
&system
  ibrav = 2, celldm(1) = 10.26, nat = 2, ntyp = 1,
  ecutwfc = 40.0, ecutrho = 320.0,       ! Rydberg! (1 Ry = 13.6 eV)
  occupations = 'smearing', smearing = 'mv', degauss = 0.01
/
&electrons
  conv_thr = 1.0d-10, mixing_beta = 0.5
/
ATOMIC_SPECIES
  Si 28.086 Si.pbe-n-rrkjus_psl.1.0.0.UPF
ATOMIC_POSITIONS crystal
  Si 0.00 0.00 0.00
  Si 0.25 0.25 0.25
K_POINTS automatic
  8 8 8 0 0 0
```

`ecutrho` (the density cutoff) must be ≥ 4×`ecutwfc` (the density is a product of two wavefunctions); use 8–12× for ultrasoft/PAW. Silicon is a semiconductor, so in practice you would use `occupations='fixed'`; smearing is shown for illustration.

## Codes you should recognise

| Code | Basis | Known for |
|---|---|---|
| VASP | PW + PAW | Materials science workhorse; Materials Project, OC20 |
| Quantum ESPRESSO | PW + NC/US/PAW | Open source; DFPT phonons; many tutorials |
| CP2K | Gaussian + PW (GPW) | Large-scale AIMD, liquids, interfaces |
| Gaussian / ORCA / Q-Chem | Gaussians | Molecular quantum chemistry; ORCA free for academics |
| PySCF | Gaussians (+ PBC) | Python, hackable; ML-for-chemistry research |
| GPAW | PAW on grids / PW / LCAO | Python + ASE integration |
| FHI-aims | NAOs, all-electron | Accurate all-electron, hybrids for large systems |
| ABINIT, CASTEP, SIESTA, ABACUS | various | DFPT; UK academic standard; linear scaling; Chinese open-source PW/NAO |

**ASE** (Atomic Simulation Environment) and **pymatgen** are the Python glue for building structures, driving codes and parsing outputs. Expect to be asked about them in ML-for-materials roles.

```quiz
? Why do metals need more k-points than insulators?
+ The Fermi surface makes occupations change discontinuously across the BZ
- Metals have larger unit cells
- Metals have more core electrons
- Insulators do not have a Brillouin zone
= Discontinuous integrands converge slowly with grid density. Smearing smooths the discontinuity; insulators converge exponentially.

? If you double the supercell in every direction, the k-point grid needed for the same accuracy…
+ Halves in each direction
- Doubles in each direction
- Stays the same
- Must include Γ
= The BZ shrinks by the same factor the cell grows, so the same k-point *density* needs half as many points per direction.

? What is the main reason plane-wave codes use pseudopotentials?
+ Cusps and core-orthogonality nodes need an enormous number of plane waves
- Plane waves cannot describe valence electrons
- To include relativistic effects
- To remove the need for k-points
= Smooth pseudo-wavefunctions converge with far fewer plane waves, as the interactive figure shows.

? Which statement about PAW is correct?
+ It reconstructs all-electron wavefunctions from smooth pseudo-wavefunctions via a linear transformation
- It is a type of norm-conserving pseudopotential
- It requires a higher cutoff than norm-conserving potentials
- It cannot be used with hybrid functionals
= Blöchl's projector augmented wave method: $\lvert\psi\rangle = \mathcal T\lvert\tilde\psi\rangle$. Apart from the frozen core it gives all-electron accuracy at ultrasoft-like cutoffs.

? Methfessel–Paxton smearing should be avoided for…
+ Insulators and semiconductors, and DOS or band-gap analysis
- Metals
- Geometry relaxations of metals
- Phonons of simple metals
= MP produces negative occupations and can give wrong results when the Fermi level sits in a gap. Use Gaussian or tetrahedron there.

? What dominates the cost of a large plane-wave DFT calculation?
+ Orthogonalisation and subspace diagonalisation, which scale as $O(N^3)$
- The FFTs, which scale as $O(N^4)$
- Reading pseudopotentials
- Computing the Hartree energy, which scales as $O(N^5)$
= FFT-based $\hat H\psi$ is roughly $O(N^2\log N)$; orthogonalising $N_b$ bands of $N_{\text{PW}}$ coefficients is $O(N_b^2N_{\text{PW}}) = O(N^3)$.

? Pulay stress in plane-wave calculations arises because…
+ The basis (fixed number of plane waves) changes quality as the cell volume changes
- The basis functions are centred on atoms
- The smearing is too large
- The k-point grid is shifted
= For atom-centred bases "Pulay forces" come from basis functions moving with atoms. For plane waves the analogous problem appears for cell changes, as a stress.

? In QE, `ecutwfc = 40` means
+ 40 Rydberg ≈ 544 eV
- 40 eV
- 40 Hartree
- 40 plane waves
= QE uses Rydberg units for cutoffs, a classic trap when converting from VASP (eV).

? You want the formation energy of a neutral vacancy. Which convergence tests matter? (select all)
+ Supercell size (defect–defect interaction)
+ k-points and cutoff on energy differences
+ Relaxation of atoms around the defect
- The number of empty bands in the band-structure plot
= Converge differences, check finite-size effects, and relax. Charged defects additionally need electrostatic corrections.
```

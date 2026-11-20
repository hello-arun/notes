# Interview question bank

<p class="lede">Questions of the kind asked for research scientist and research engineer roles in AI-for-science teams (materials, chemistry, catalysis, drug discovery). Try each one aloud <em>before</em> opening the answer. Model answers are deliberately compact, roughly what you'd say in two minutes, with pointers back to the chapters.</p>

> [!TIP] How to answer well
> State the core idea in one sentence, give the key equation or mechanism, then name a limitation or practical consequence. Interviewers look for the *limitation* part: it shows you have used the method rather than only read about it.

## A. Foundations

<details>
<summary>A1. Explain DFT to a software engineer with no physics background.</summary>

To predict how atoms bond, you need the behaviour of their electrons, which is governed by a wave equation over all electron coordinates at once. That costs exponentially more with every electron. DFT proves you only need the electron *density*, a 3D field like a cloud, and gives a recipe for computing it by solving a set of single-electron problems repeatedly until they agree with each other (self-consistency). One part of the recipe, the exchange–correlation energy, is unknown and approximated. It's like replacing an $O(e^N)$ algorithm with an $O(N^3)$ one that's exact in principle but uses a heuristic for one subroutine.

</details>

<details>
<summary>A2. State and prove the first Hohenberg–Kohn theorem.</summary>

The ground-state density determines the external potential up to a constant. Proof by contradiction: assume $v_1\ne v_2+c$ with the same ground-state $n$. Then $\Psi_1\ne\Psi_2$ (otherwise subtracting the Schrödinger equations gives $v_1-v_2=$ const). The variational principle gives $E_1<\langle\Psi_2|H_1|\Psi_2\rangle = E_2+\int(v_1-v_2)n$, and symmetrically $E_2<E_1+\int(v_2-v_1)n$. Adding them: $E_1+E_2<E_1+E_2$, a contradiction. The key step is that a local potential couples only to the density. See [Chapter 2](02-hohenberg-kohn.md).

</details>

<details>
<summary>A3. If HK says the energy is a functional of the density, why do we need orbitals at all?</summary>

Because we don't know the functional, and the kinetic energy is the hard part. It's comparable to the total energy, and density-only approximations (Thomas–Fermi) are too crude to bind molecules. Kohn–Sham computes the non-interacting kinetic energy $\Ts$ exactly from orbitals and leaves only the small remainder $T-\Ts$ to $\Exc$. Orbital-free DFT tries to avoid orbitals for $O(N)$ cost but needs a very accurate $T[n]$.

</details>

<details>
<summary>A4. Derive the Kohn–Sham equations.</summary>

Write $E[n] = \Ts[\{\phi_i\}] + \int\vext n + \EH[n] + \Exc[n]$ with $n = \sum_i f_i|\phi_i|^2$. Minimise with respect to $\phi_i^*$ subject to orthonormality (Lagrange multipliers $\varepsilon_i$). Using $\delta n/\delta\phi_i^* = f_i\phi_i$: $-\frac12\nabla^2\phi_i + [\vext + v_{\mathrm H} + \vxc]\phi_i = \varepsilon_i\phi_i$, with $v_{\mathrm H} = \int n/|\vr-\vr'|$ and $\vxc = \delta\Exc/\delta n$. Self-consistent because $\veff$ depends on $n$.

</details>

<details>
<summary>A5. What exactly is in the exchange–correlation energy?</summary>

$\Exc = (T-\Ts) + (W - \EH)$: the kinetic energy correction plus all non-classical electron–electron interaction (exchange, Coulomb correlation, and the self-interaction correction to Hartree). Through the adiabatic connection it equals $\int_0^1 W_\lambda\,\dd\lambda$, the interaction of electrons with their coupling-averaged xc hole.

</details>

<details>
<summary>A6. Is Kohn–Sham DFT exact? Is it a mean-field theory?</summary>

Formally exact for the ground-state density and energy if $\Exc$ were exact. HF is not exact even in principle. The KS equations have a mean-field *form*, and with approximate (semilocal) functionals DFT behaves like a sophisticated mean-field theory, which is why it struggles with strong correlation. A good answer distinguishes the framework from the approximations.

</details>

<details>
<summary>A7. Do KS eigenvalues mean anything?</summary>

Formally they are Lagrange multipliers. But Janak's theorem gives $\varepsilon_i = \partial E/\partial f_i$, and for the exact functional $\varepsilon_{\text{HOMO}} = -I$. KS band structures are qualitatively useful (dispersion, band ordering), but the KS gap is not the fundamental gap, even with the exact functional, because of the derivative discontinuity. With LDA/GGA, $-\varepsilon_{\text{HOMO}}$ underestimates $I$ by several eV.

</details>

<details>
<summary>A8. Why isn't the total energy the sum of eigenvalues?</summary>

The eigenvalue sum counts every electron–electron interaction twice (each electron sees the Hartree potential of all others), and it includes $\int\vxc n$ rather than $\Exc$. So $E = \sum f_i\varepsilon_i - \EH - \int\vxc n + \Exc$.

</details>

<details>
<summary>A9. Compare Hartree–Fock and DFT.</summary>

HF: a single determinant, exact exchange (non-local, no self-interaction), no correlation, variational upper bound, systematically improvable by post-HF methods, concave $E(N)$ (localisation error), gaps too large. DFT (semilocal): approximate local exchange and correlation, self-interaction error, convex $E(N)$ (delocalisation error), gaps too small, generally much better energetics at similar or lower cost, not systematically improvable. Hybrids mix them, and their errors partly cancel.

</details>

<details>
<summary>A10. What is the Born–Oppenheimer approximation and when does it fail?</summary>

Separate electronic and nuclear motion because nuclei are much heavier. Solve electrons for fixed nuclei to get a potential energy surface $U(\vR)$. It fails near conical intersections and avoided crossings (photochemistry, non-adiabatic dynamics), for some light-nucleus quantum effects, and for electron–phonon-dominated phenomena that need explicit coupling.

</details>

<details>
<summary>A11. What is v-representability and why does it matter?</summary>

A density is v-representable if it is the ground-state density of some local potential. HK defines $F[n]$ only on such densities, which can't be characterised, so the variational search domain is unclear. Levy–Lieb constrained search defines $F$ on N-representable densities (any reasonable non-negative normalised density), which fixes this. KS additionally assumes non-interacting v-representability.

</details>

## B. Functionals and their failures

<details>
<summary>B1. Walk me through Jacob's ladder.</summary>

LDA ($n$) → GGA ($n$, $\nabla n$) → meta-GGA (+ $\tau$) → hybrid (+ exact exchange from occupied orbitals) → double hybrid/RPA (+ virtual orbitals). Each rung adds ingredients, accuracy (on average) and cost. Examples: PW92; PBE; SCAN/r2SCAN; PBE0, B3LYP, HSE06; B2PLYP, RPA. See [Chapter 4](04-xc-functionals.md).

</details>

<details>
<summary>B2. Why does LDA work at all?</summary>

It uses the xc hole of a real system (the uniform gas), so it satisfies exact constraints such as the sum rule $\int n_{\text{xc}} = -1$. The energy depends only on the spherical average of the hole, so shape errors cancel. Error cancellation between exchange (underestimated in magnitude) and correlation (overestimated) also helps.

</details>

<details>
<summary>B3. What is self-interaction error? Give a concrete example.</summary>

In approximate functionals, an electron's Hartree repulsion with itself is not exactly cancelled by its own xc energy. Example: H₂⁺ dissociation. GGA gives far too low an energy at large separation, because a half-electron on each proton has less spurious self-repulsion. It also produces too-shallow potentials, unbound anions and over-delocalised charges.

</details>

<details>
<summary>B4. Explain the band-gap problem. How would you get a better gap?</summary>

$E_g = I-A = E_g^{\text{KS}} + \Delta_{\text{xc}}$. Semilocal functionals have no derivative discontinuity and suffer delocalisation error (convex $E(N)$), so gaps come out 30–50 % too small (Si: 0.6 vs 1.17 eV). Fixes: HSE06 or dielectric-dependent hybrids; mBJ (cheap, potential-only); DFT+U for d/f states; G₀W₀ or self-consistent GW as the reference standard; Koopmans-compliant functionals.

</details>

<details>
<summary>B5. What is delocalisation error and what does it explain?</summary>

The convexity of approximate $E(N)$ between integers, which stabilises fractional charges spread over fragments. It explains small gaps, low reaction barriers, spurious charge transfer, over-binding of charge-transfer complexes, over-delocalised polarons, and wrong dissociation limits of radical cations. HF has the opposite (localisation) error. See the interactive figure in [Chapter 5](05-failures.md).

</details>

<details>
<summary>B6. Why do hybrid functionals help? Where does the 25 % in PBE0 come from?</summary>

The adiabatic connection $\Exc = \int_0^1 W_\lambda\,\dd\lambda$ has $W_0 = E_{\text x}^{\text{exact}}$. Mixing exact exchange improves the $\lambda\approx0$ end and reduces self-interaction and delocalisation error. Perdew–Ernzerhof–Burke modelled $W_\lambda$ so that the mixing fraction is $1/n$, with $n=4$ suggested by perturbation theory, hence ¼.

</details>

<details>
<summary>B7. HSE06 vs PBE0: what's the difference and why use HSE for solids?</summary>

HSE splits the Coulomb operator with $\operatorname{erfc}(\omega r)/r$ and applies 25 % exact exchange only at short range ($\omega\approx0.11$ bohr⁻¹). Long-range exact exchange is expensive and slowly convergent with k-points in periodic systems, and is screened in real solids anyway. HSE is cheaper and better behaved for metals and semiconductors, with gaps close to experiment for sp semiconductors.

</details>

<details>
<summary>B8. Why can't GGAs describe van der Waals interactions? How do you fix it?</summary>

Dispersion is non-local correlation between distant charge fluctuations ($-C_6/R^6$). Semilocal functionals only see the density near each point, so they give no attraction between non-overlapping fragments. Fixes: pairwise corrections (Grimme D3(BJ), D4, TS), many-body dispersion (MBD), or non-local correlation functionals (vdW-DF2, rVV10). RPA captures dispersion naturally.

</details>

<details>
<summary>B9. What is DFT+U? What are its pitfalls?</summary>

It adds a Hubbard-like penalty $\frac{U}{2}\operatorname{Tr}[\mathbf n(1-\mathbf n)]$ on localised d/f occupations, which favours integer occupation and opens gaps in Mott/charge-transfer insulators. Pitfalls: U is empirical or computed and not transferable; it depends on the projectors; energies at different U aren't comparable (Materials Project fits corrections to mix GGA and GGA+U); multiple metastable solutions; it can worsen metals.

</details>

<details>
<summary>B10. Why does restricted DFT fail for H₂ dissociation?</summary>

At large $R$ the exact ground state is a two-determinant (static correlation) singlet. A spin-restricted single determinant forces 50 % ionic character, so the energy is too high. Unrestricted DFT breaks spin symmetry and gets the energy roughly right, but gives a spin-contaminated state and a kink at the Coulson–Fischer point.

</details>

<details>
<summary>B11. PBE vs PBEsol vs RPBE: when would you use each?</summary>

PBE: general default, especially for database consistency. PBEsol: lattice constants, elastic and surface properties of solids (restores the gradient expansion). RPBE: adsorption and chemisorption energies on surfaces (PBE overbinds adsorbates), as used in OC20. Add dispersion where needed.

</details>

<details>
<summary>B12. What makes SCAN special, and what are its problems?</summary>

A non-empirical meta-GGA satisfying all 17 known exact constraints for its rung. It uses $\alpha$ (from $\tau$) to identify single-orbital, slowly varying and weak-bonding regions, so it is often accurate across diverse bonding. Problems: numerical instability (fine integration grids needed, SCF trouble). r2SCAN keeps most of the benefit with smooth behaviour. Still semilocal: SIE and gaps remain.

</details>

## C. Practice and numerics

<details>
<summary>C1. How do you converge a plane-wave DFT calculation?</summary>

Converge *energy differences* relevant to your property. Raise the cutoff until changes are < 1 meV/atom (higher for stress and phonons); then the k-point density; choose smearing so $TS$ is negligible; tighten SCF thresholds (1e-6 eV for relaxations, 1e-8 for phonons); check supercell, vacuum and slab-thickness convergence; test magnetic configurations. Keep settings fixed across a study. See [Chapter 6](06-practice.md).

</details>

<details>
<summary>C2. Why do we need pseudopotentials? NC vs US vs PAW?</summary>

Core electrons are inert, and the cusp plus nodes of all-electron orbitals need huge plane-wave cutoffs. Norm-conserving: simple, higher cutoff. Ultrasoft: relax norm conservation with augmentation charges, giving low cutoffs and a generalised eigenproblem. PAW: a linear transformation reconstructs all-electron wavefunctions, giving all-electron accuracy (frozen core) at ultrasoft-like cost. Use verified libraries (SSSP, PseudoDojo).

</details>

<details>
<summary>C3. What is smearing and why do metals need it?</summary>

It replaces the step-function occupation by a smooth function of width σ (Fermi–Dirac, Gaussian, Methfessel–Paxton, Marzari–Vanderbilt). In metals the Fermi surface cuts bands, so occupations jump discontinuously across the BZ. Smearing stabilises the SCF and accelerates k-point convergence. You get a free energy; extrapolate to σ→0; avoid MP for insulators.

</details>

<details>
<summary>C4. My SCF won't converge. What do you try?</summary>

Diagnose: oscillating vs slowly drifting, metal vs insulator, magnetic? Fixes: reduce the mixing parameter; switch to or extend Pulay/Broyden history; Kerker preconditioning for metals and slabs; increase smearing temporarily; better initial guess (atomic densities, a converged lower-level run, sensible magnetic moments); more empty bands; check geometry (atoms too close?); different algorithm (Davidson vs RMM-DIIS, direct minimisation); for DFT+U, ramp U or control occupations. Charge sloshing in large cells is the classic culprit.

</details>

<details>
<summary>C5. How does the cost of DFT scale and why?</summary>

$O(N^3)$: orthogonalising and diagonalising $\sim N$ bands expanded in $\sim N$ basis functions. Applying $\hat H$ via FFT is roughly $O(N^2\log N)$. Hybrids add exact exchange at about $O(N^4)$ with large prefactors in plane waves. Linear-scaling methods exploit nearsightedness (exponentially decaying density matrix in insulators) to reach $O(N)$ at large $N$.

</details>

<details>
<summary>C6. What are Hellmann–Feynman forces? When do you need corrections?</summary>

$\mathbf F_I = -\langle\partial\hat H/\partial\vR_I\rangle$, valid for variationally converged states when basis functions don't depend on $\vR$. Corrections: Pulay forces for atom-centred bases, incomplete SCF, augmentation terms in PAW/US. For plane waves, the analogous issue for cell changes is Pulay stress.

</details>

<details>
<summary>C7. How would you compute the formation energy of a charged point defect?</summary>

$E_f[X^q] = E_{\text{tot}}[X^q] - E_{\text{tot}}[\text{bulk}] - \sum_i n_i\mu_i + q(E_F + \varepsilon_{\text{VBM}} + \Delta V) + E_{\text{corr}}$. Use a large supercell, relax, set chemical potentials within stability limits, align potentials ($\Delta V$), apply a finite-size electrostatic correction (Freysoldt or Kumagai–Oba), and ideally use hybrids for gap-sensitive levels. Plot $E_f$ vs $E_F$ to get transition levels.

</details>

<details>
<summary>C8. How do you compute a reaction barrier on a surface?</summary>

Build a converged slab (layers, vacuum, k-points, dipole correction) and relax the initial and final states. Run climbing-image NEB with ~5–9 images; confirm the saddle point with a frequency calculation (one imaginary mode); add zero-point and thermal corrections as needed; use RPBE or BEEF-vdW, or a hybrid if delocalisation error matters. Report the barrier with an error estimate.

</details>

<details>
<summary>C9. Plane waves vs Gaussians: trade-offs?</summary>

Plane waves: systematic (single $E_{\text{cut}}$), no BSSE, no Pulay forces, natural for periodic systems, FFT-friendly; need pseudopotentials; vacuum is expensive; exact exchange is costly. Gaussians: compact, all-electron, cheap exact exchange (molecules), natural for isolated systems; BSSE, overcompleteness, and basis convergence is less systematic (use cc-pVnZ/def2 families and counterpoise or extrapolation).

</details>

<details>
<summary>C10. What is Kerker preconditioning?</summary>

Mixing with a wavevector-dependent factor $G^2/(G^2+G_0^2)$ that damps long-wavelength (small-$G$) density updates. These are amplified by the $4\pi/G^2$ Hartree response and cause charge sloshing in metals and large cells. It approximates the inverse dielectric function of a metal (Thomas–Fermi screening).

</details>

<details>
<summary>C11. How do you get phonons from DFT?</summary>

Finite displacements in a supercell (Phonopy): displace atoms, compute Hellmann–Feynman forces, build force constants, Fourier-transform to the dynamical matrix at any $\mathbf q$. Or DFPT, linear response in the primitive cell at chosen $\mathbf q$, which also gives Born charges and $\varepsilon_\infty$ for LO–TO splitting. Requires tightly converged SCF and forces. Imaginary modes indicate instability.

</details>

## D. ML × DFT

<details>
<summary>D1. How do machine-learned interatomic potentials work?</summary>

Learn $E(\{\vr_i, Z_i\})$ as a sum of atomic energies over local environments (cutoff ~5–6 Å), with forces as $-\nabla E$ by autodiff. Architectures range from descriptor-based (Behler–Parrinello, SOAP/GAP, ACE) to message-passing GNNs, now equivariant (NequIP, MACE, Allegro, Equiformer). Train on DFT energies, forces and stresses. You get near-DFT accuracy at linear cost, 10³–10⁶× faster. See [Chapter 8](08-ml-dft.md).

</details>

<details>
<summary>D2. Why do equivariant networks matter?</summary>

Physical laws are invariant under E(3). Invariant energy and equivariant forces built into the architecture mean no data is spent learning symmetry and generalisation to new orientations is exact. Empirically they are 10–1000× more data-efficient than invariant models. Mechanism: features are O(3) irreps combined via Clebsch–Gordan tensor products of spherical harmonics. Trade-off: computational cost, partly addressed by eSCN-style tricks, or by non-equivariant models trained with augmentation at scale.

</details>

<details>
<summary>D3. Should a force field predict forces directly or as the energy gradient?</summary>

Gradient (conservative) forces guarantee energy conservation, a consistent PES, correct relaxations and phonons, and automatic equivariance. They cost a backward pass. Direct forces are faster and can score well on static MAE but cause drift and instability in MD. A common compromise is direct-force pretraining with conservative fine-tuning. For production MD, use conservative forces.

</details>

<details>
<summary>D4. Your MLIP has excellent test MAE but MD explodes after 50 ps. Why, and what do you do?</summary>

The training data don't cover configurations visited in MD (high-energy, close contacts, rare events), so the model extrapolates into unphysical "holes" in the PES. Also check non-conservative forces and too-large timesteps. Fix: active learning with an ensemble or other uncertainty, add short-range repulsion data or a ZBL baseline, sample with AIMD at higher temperature, check energy conservation in NVE, monitor uncertainty during production runs.

</details>

<details>
<summary>D5. How do you evaluate a universal potential?</summary>

Go beyond energy/force MAE: stability classification against the convex hull (Matbench Discovery: F1, discovery acceleration factor), relaxed-structure RMSD, phonon spectra and thermal conductivity ($\kappa_{\text{SRME}}$), elastic constants, surface energies, migration barriers, MD stability and NVE energy conservation, out-of-distribution chemistries and temperatures. Check for systematic PES softening. Use structure- or composition-based splits.

</details>

<details>
<summary>D6. What pitfalls arise when building ML datasets from DFT?</summary>

Mixed levels of theory (functional, +U, pseudopotentials, code versions); unconverged SCF or k-points; inconsistent spin states (magnetic solutions vary between runs); smearing differences; near-duplicates leaking between splits; biased sampling (only equilibrium structures); reference energies that differ across datasets. Mitigation: record full provenance, apply consistent corrections, filter outliers, multi-fidelity heads.

</details>

<details>
<summary>D7. What are DM21 and Skala, and why is learning a functional harder than learning a potential?</summary>

DM21 (DeepMind, 2021): an NN local-hybrid functional trained with fractional-charge/spin data to obey piecewise linearity, fixing delocalisation and static-correlation errors in hard cases. Skala (Microsoft, 2025): a deep-learned functional with learned non-local features, trained on a large high-accuracy dataset, reaching near chemical accuracy on main-group thermochemistry at semilocal-like cost. It's harder because the functional must be used self-consistently: $\vxc = \delta\Exc/\delta n$ must be smooth, it must transfer across all chemistry, accurate density data are scarce, and SCF convergence must remain robust.

</details>

<details>
<summary>D8. What is Δ-learning? When would you use it?</summary>

Learn the difference between a cheap baseline and a target, e.g. CCSD(T) − DFT, or DFT − semi-empirical. The difference is smoother and lower-variance, so it needs far fewer expensive labels. Used to reach coupled-cluster accuracy for molecules (with transfer learning, e.g. ANI-1ccx) or to correct systematic errors.

</details>

<details>
<summary>D9. How do generative models like MatterGen fit with DFT?</summary>

Generators (diffusion over lattice, coordinates and species) propose candidates, optionally conditioned on properties. MLIPs relax and pre-screen them; DFT validates stability (energy above hull) and properties; promising ones go to synthesis. Key issues: novelty against known structures (and disordered analogues), the gap between 0 K stability and synthesisability, and the systematic errors of PBE stability.

</details>

<details>
<summary>D10. How would you add long-range electrostatics to an MLIP?</summary>

Predict environment-dependent atomic charges (or Wannier centres, or latent charges) and compute Coulomb energy with Ewald/PME. Enforce total charge (charge equilibration, as in 4G-HDNNP). Alternatives: reciprocal-space message passing, latent Ewald summation, or adding D3 for dispersion. Needed for ionic systems, interfaces, electrolytes and charged defects, where locality fails.

</details>

<details>
<summary>D11. How would you quantify uncertainty in an MLIP?</summary>

Deep ensembles (variance of predictions; simple and robust), committee models, last-layer Bayesian or GP approaches, Monte Carlo dropout (often poorly calibrated), evidential or mean-variance heads, distance in latent space. Calibrate on held-out data. Use force uncertainty (per atom) to trigger active learning or flag unreliable MD.

</details>

<details>
<summary>D12. Why can't you just train one model on all public DFT data?</summary>

Datasets use different functionals (PBE, RPBE, r2SCAN, ωB97M-V), +U schemes, pseudopotentials and energy references, so their labels aren't on the same scale. Pooling them naively teaches artefacts. Solutions: multi-task or multi-head architectures, fidelity embeddings, per-dataset reference energies, or recomputing a subset consistently. Large efforts (OMat24, OMol25, UMA) design for this explicitly.

</details>

## E. Coding

<details>
<summary>E1. Write an SCF loop for a 1D model (whiteboard).</summary>

Key steps: grid and kinetic matrix → initial density → loop { build $v_{\mathrm H}$, $\vxc$ → diagonalise $T + \text{diag}(v_{\text{eff}})$ → occupy lowest orbitals → new density → residual check → mix }. The full 50-line solution is in [Chapter 9](09-hands-on.md). Mention normalisation with the grid spacing, double occupation, and mixing.

</details>

<details>
<summary>E2. Implement Pulay/DIIS mixing.</summary>

Store the last $m$ input densities $n_i$ and residuals $R_i = n_i^{\text{out}}-n_i$. Solve $\begin{pmatrix}B & -\mathbf 1\\ -\mathbf 1^T & 0\end{pmatrix}\begin{pmatrix}\mathbf c\\ \lambda\end{pmatrix} = \begin{pmatrix}\mathbf 0\\ -1\end{pmatrix}$ with $B_{ij} = \langle R_i|R_j\rangle$. Then $n_{\text{new}} = \sum_i c_i(n_i + \alpha R_i)$. Watch for ill-conditioning (drop the oldest entries, regularise). Code in Chapter 9.

</details>

<details>
<summary>E3. Implement a simple pairwise potential with forces in PyTorch, using autodiff.</summary>

```python
import torch

def lj_energy(pos, eps=1.0, sigma=1.0, rc=2.5):
    d = pos[:, None, :] - pos[None, :, :]
    r = d.norm(dim=-1)
    i, j = torch.triu_indices(len(pos), len(pos), 1)
    r = r[i, j]
    r = r[r < rc]
    sr6 = (sigma / r) ** 6
    return (4 * eps * (sr6**2 - sr6)).sum()

pos = torch.randn(10, 3, requires_grad=True) * 2
E = lj_energy(pos)
F = -torch.autograd.grad(E, pos, create_graph=True)[0]   # create_graph=True to train on forces
```

Discuss: the $O(N^2)$ pair list vs neighbour lists (cell lists, $O(N)$); periodic minimum-image convention; `create_graph=True` when forces enter the loss; a smooth cutoff function to avoid force discontinuities.

</details>

<details>
<summary>E4. How would you build a neighbour list for a periodic system?</summary>

Cell lists: bin atoms into cells of size ≥ $r_c$, check only neighbouring cells, $O(N)$. Handle periodicity by including image shifts (vectors $\mathbf n\cdot\mathbf a$) for each pair; for small cells, multiple images are within $r_c$. Store edge index pairs plus shift vectors so displacement vectors can be differentiated. Libraries: ASE `neighbor_list`, matscipy, torch-cluster, vesin.

</details>

<details>
<summary>E5. Compute the stress tensor of an MLIP.</summary>

Apply a symmetric strain $\boldsymbol\epsilon$ to positions and cell, $\vr\to(\mathbf I+\boldsymbol\epsilon)\vr$, $\mathbf h\to(\mathbf I+\boldsymbol\epsilon)\mathbf h$; then $\sigma = \frac1\Omega\partial E/\partial\boldsymbol\epsilon$ at $\boldsymbol\epsilon=0$ via autodiff. Equivalently, the virial $-\frac1\Omega\sum_{\text{edges}}\mathbf r_{ij}\otimes\partial E/\partial\mathbf r_{ij}$. Sign conventions differ between codes (VASP reports pressure-like values in kbar).

</details>

## F. Research and system design

<details>
<summary>F1. Design a high-throughput DFT pipeline for 100,000 hypothetical materials.</summary>

Workflow engine (atomate2/AiiDA/jobflow) with a database (MongoDB) and provenance. Standardised input sets (MP-style: PBE/PBE+U, PAW set, cutoff, k-point density). Staged approach: MLIP pre-relaxation and pre-screening → DFT relaxation (two-step: coarse then fine) → static run → properties. Automatic error handling (custodian: SCF failures, ZBRENT errors, memory). Magnetic initialisation strategies. Compatibility corrections for mixing +U. Computing the convex hull (pymatgen). Monitoring, failure analysis, cost budgeting. Store raw outputs and parsed results.

</details>

<details>
<summary>F2. You have a fixed DFT budget of 10,000 calculations to build a potential for Li diffusion in a new solid electrolyte. Plan it.</summary>

Start from a foundation model (MACE-MP, etc.) and evaluate it on a small DFT validation set (energies, forces, barrier for one hop via NEB). Generate configurations: AIMD at 600–1200 K (short), strained and rattled cells, vacancy and interstitial configurations, NEB images. Fine-tune with active learning (ensemble uncertainty during MLIP MD at target temperatures). Validate: NEB barriers against DFT, diffusivity Arrhenius plots, conductivity versus experiment. Account for finite-size effects and simulation length. Keep ~10–20 % of the budget for validation.

</details>

<details>
<summary>F3. A colleague's ML model predicts formation energies with 20 meV/atom MAE. Is that good enough for stability prediction?</summary>

Depends. Typical hull distances that decide stability are tens of meV/atom, and the *relevant* error is in energy differences with competing phases. Systematic errors may cancel while random errors don't. 20 meV/atom MAE can still give poor stability classification (many false positives near the hull). Evaluate with stability-classification metrics (precision/recall, F1 at 0 meV/atom above hull) on a realistic prospective split, and compare against DFT's own error versus experiment (~25–50 meV/atom for PBE formation enthalpies, which is the ceiling anyway).

</details>

<details>
<summary>F4. What would you work on to improve the accuracy ceiling of ML materials models?</summary>

Training data beyond PBE (r2SCAN, hybrids, RPA, CCSD(T) or QMC for subsets) with multi-fidelity learning; learned functionals to generate better data cheaply; long-range physics and explicit charge or magnetic degrees of freedom; uncertainty-aware active learning; better benchmarks tied to experiment (synthesisability, finite-temperature properties); efficient architectures for scale. Show judgement: data quality and consistency are usually the bottleneck.

</details>

## G. Rapid-fire facts

| Question | Answer |
|---|---|
| 1 Ha in eV? | 27.211 eV |
| Chemical accuracy? | 1 kcal/mol ≈ 0.043 eV |
| PBE μ and κ? | 0.2195, 0.804 |
| PBE0 exact exchange fraction? | 25 % |
| B3LYP exact exchange fraction? | 20 % |
| HSE06 ω? | 0.11 bohr⁻¹ (≈ 0.2 Å⁻¹) |
| Lieb–Oxford bound in PBE? | $F_x \le 1.804$ |
| LDA exchange per electron? | $-\frac34(3/\pi)^{1/3}n^{1/3}$ |
| Dispersion asymptotics? | $-C_6/R^6$ |
| Si: PBE gap vs experiment? | ~0.6 vs 1.17 eV |
| KS-DFT scaling? | $O(N^3)$ |
| CCSD(T) scaling? | $O(N^7)$ |
| Typical MLIP cutoff? | 5–6 Å |
| QE cutoff units? | Rydberg |
| VASP default functional & basis? | PBE, PAW + plane waves |
| Who proposed Jacob's ladder? | John Perdew (2001) |

```quiz
? An interviewer asks why your universal-potential relaxations give lattice constants ~1 % too large. Best answer?
+ The model reproduces its PBE training data, and PBE overestimates lattice constants by ~1 %
- The model is underfitted
- Neural networks always overestimate distances
- The cutoff radius is too small
= Errors relative to experiment usually come from the training functional. Compare against PBE before blaming the model.

? Which property is the most sensitive test of an MLIP's curvature (second derivatives)?
+ Phonon frequencies
- Total energy MAE
- Number of parameters
- Atomic number embedding
= Phonons probe the Hessian of the PES. Softened potentials show systematically low frequencies.

? You must compute a band gap for a new oxide semiconductor quickly but reasonably accurately. Best first choice?
+ HSE06 (or PBE+U as a cheaper first look), noting the limitations
- PBE, reporting the KS gap as the fundamental gap
- LDA with Methfessel–Paxton smearing
- Hartree–Fock
= PBE underestimates gaps badly; HF overestimates. Screened hybrids are the practical standard, with GW for high accuracy.
```

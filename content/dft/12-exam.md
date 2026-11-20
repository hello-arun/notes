# Final exam & flashcards

<p class="lede">A mixed test across every chapter. Questions and options are shuffled each time you press <em>Reset & shuffle</em>, and your best score is saved in this browser. Aim for 90 % or more before an interview, then drill the flashcards until you can answer each one aloud without flipping.</p>

## Part 1: mixed exam

```quiz
? The Hohenberg–Kohn theorems guarantee that…
+ The ground-state density determines the external potential and hence all properties
- The Kohn–Sham orbitals are the true electron orbitals
- LDA is exact for molecules
- Excited states can be found variationally from the density
= HK1 is an existence and uniqueness statement. It says nothing about practical functionals or orbital meanings.

? Which term in the Kohn–Sham energy is computed from orbitals rather than the density alone?
+ The non-interacting kinetic energy $\Ts$
- The Hartree energy
- The external potential energy
- The nuclear repulsion
= $\Ts = \sum_i f_i\langle\phi_i|-\frac12\nabla^2|\phi_i\rangle$ needs orbitals. That is the entire point of the KS construction.

? $\Exc$ contains (select all)
+ $T - \Ts$
+ Exchange
+ Correlation
- The classical Hartree energy
= The Hartree energy is treated exactly and separately.

? For the exact functional, the energy of a system with $N_0 + 0.3$ electrons is…
+ $0.7E(N_0) + 0.3E(N_0+1)$
- $E(N_0) + 0.3\varepsilon_{\text{HOMO}}$
- below the straight line connecting $E(N_0)$ and $E(N_0+1)$
- undefined
= Piecewise linearity. Semilocal functionals give a convex curve below this line.

? Which functional is most appropriate for a high-throughput study meant to be consistent with the Materials Project?
+ PBE (with +U for selected transition-metal oxides)
- B3LYP
- LDA
- HF
= Database consistency matters for mixing data and computing hulls. MP uses PBE/PBE+U (and increasingly r2SCAN).

? The reduced gradient $s$ is large in…
+ Density tails and surfaces
- The interior of a uniform metal
- Every bond midpoint
- Nowhere; it is bounded by 1
= $s = |\nabla n|/(2k_Fn)$ grows where the density decays exponentially.

? In PBE, $\kappa=0.804$ is fixed by…
+ The Lieb–Oxford bound
- Fitting to atomisation energies
- The uniform-gas correlation energy
- The band gap of silicon
= $F_x\to1+\kappa\le1.804$.

? A semiconductor calculated with PBE has a 0.3 eV gap; experiment says 1.4 eV. The most likely explanation is…
+ The derivative discontinuity is missing and delocalisation error is present in semilocal DFT
- The k-point grid is too dense
- The smearing is too small
- PBE overestimates gaps
= Classic band-gap underestimation. Use HSE06 or GW.

? Which correction is essential for graphite interlayer binding?
+ A dispersion correction (D3, vdW-DF, MBD…)
- DFT+U
- Spin–orbit coupling
- A larger smearing
= The layers are held together by van der Waals forces, which semilocal functionals miss.

? Bloch's theorem lets us write states as $e^{i\vk\cdot\vr}u_{n\vk}(\vr)$ where $u_{n\vk}$…
+ Has the periodicity of the lattice
- Is a plane wave
- Is localised on one atom
- Is independent of $n$
= This reduces the infinite crystal to the unit cell for each $\vk$.

? Doubling a plane-wave cutoff multiplies the number of plane waves by about…
+ $2^{3/2}\approx2.8$
- 2
- 4
- 8
= $N_{\text{PW}}\propto E_{\text{cut}}^{3/2}$ (a sphere of radius $G_{\max}\propto\sqrt{E_{\text{cut}}}$).

? Which smearing method produces negative occupations?
+ Methfessel–Paxton
- Fermi–Dirac
- Gaussian
- Tetrahedron
= MP's Hermite-polynomial expansion overshoots. It is harmless for metals but bad for insulators.

? An SCF in a large metallic slab oscillates. The best first fix is…
+ Kerker preconditioning and/or a smaller mixing parameter with Pulay/Broyden
- Increasing the cutoff
- Reducing the number of k-points
- Switching to Hartree–Fock
= Charge sloshing from small-$G$ components. Damp them.

? PAW differs from ultrasoft pseudopotentials mainly by…
+ Reconstructing the all-electron wavefunction in the core region
- Requiring a much higher cutoff
- Not using projectors
- Being limited to LDA
= PAW gives (frozen-core) all-electron quantities at similar cost.

? Hellmann–Feynman forces are exact when…
+ The SCF is converged and the basis does not depend on atomic positions
- The basis is atom-centred
- The smearing is large
- Hybrid functionals are used
= Otherwise there are Pulay and non-self-consistency corrections.

? An imaginary phonon frequency indicates…
+ A dynamical instability (saddle point)
- Metallic behaviour
- A converged calculation
- Negative thermal expansion
= Negative curvature of the PES along that mode.

? Runge–Gross is to TDDFT what … is to ground-state DFT.
+ Hohenberg–Kohn
- Kohn–Sham
- Janak
- Hellmann–Feynman
= It establishes the one-to-one map between time-dependent densities and potentials.

? Charge-transfer excitations are badly underestimated by TDDFT with semilocal functionals. The standard fix is…
+ Range-separated hybrids with 100 % long-range exact exchange
- DFT+U
- More k-points
- Larger basis sets only
= LC hybrids restore the $-1/R$ electron–hole attraction.

? MLIPs usually decompose the energy as a sum of atomic energies because…
+ Of nearsightedness: it gives locality, linear scaling and size extensivity
- DFT energies are exactly additive
- It makes forces non-conservative
- It removes the need for training data
= Locality is a physically motivated approximation. Long-range terms are added when needed.

? Why are forces valuable training targets for MLIPs?
+ $3N$ labels per calculation at almost no extra DFT cost, constraining the PES shape
- They are easier to compute than energies
- They are rotation-invariant
- They do not depend on the functional
= Hellmann–Feynman makes forces cheap, and they are far more informative than one energy.

? A universal MLIP systematically underestimates phonon frequencies. This is called…
+ PES softening
- Overfitting
- Self-interaction error
- Pulay stress
= It is common in models trained mostly on near-equilibrium data, and fine-tuning helps.

? Which statement about learned functionals is FALSE?
+ They only need to predict the energy; the potential is irrelevant
- They must work inside the SCF loop
- Exact constraints can improve transferability
- DM21 was trained on fractional-charge systems
= The functional derivative $\vxc$ determines the self-consistent density, so it must be smooth and accurate.

? Which split is most appropriate to test discovery of new crystals?
+ A prospective or composition/prototype-based split
- A random split of all structures
- Training and testing on the same data
- A split by number of atoms only
= Random splits leak near-duplicates and overestimate performance.

? The DFT cost bottleneck for large systems is…
+ $O(N^3)$ orthogonalisation and diagonalisation
- $O(N)$ FFTs
- Reading the input file
- The xc functional evaluation, $O(N^5)$
= Semilocal xc evaluation is cheap ($O(N)$ on a grid).

? The Levy–Lieb functional is defined as
+ $\min_{\Psi\to n}\langle\Psi|\hat T+\hat W|\Psi\rangle$
- $\max_{\Psi}\langle\Psi|\hat H|\Psi\rangle$
- $\int n\,\epsilon_{\text{xc}}(n)$
- $\Ts[n] + \EH[n]$
= A constrained search over all antisymmetric wavefunctions that give density $n$.

? GGA vs GGA+U total energies for Fe₂O₃ and Fe metal can be combined in a reaction energy only if…
+ Consistent correction schemes (e.g. fitted energy adjustments) are applied
- Both use the same k-point grid
- The smearing is identical
- Never, under any circumstances
= Materials Project-style compatibility schemes fit corrections so mixed GGA/GGA+U reaction energies are meaningful.
```

## Part 2: flashcards

```cards
Q: State HK1 in one sentence.
A: The ground-state density determines the external potential up to an additive constant, and therefore every property of the system.

Q: State HK2.
A: $E_v[n] = F[n]+\int vn$ is minimised by the true ground-state density, and the minimum is $E_0$.

Q: Write the Kohn–Sham equation.
A: $\left[-\tfrac12\nabla^2 + \vext + v_{\mathrm H}[n] + \vxc[n]\right]\phi_i = \varepsilon_i\phi_i$, with $n = \sum_i f_i|\phi_i|^2$.

Q: Define $\Exc$ exactly.
A: $\Exc = (T-\Ts) + (W-\EH)$

Q: Total energy in terms of eigenvalues?
A: $E = \sum_i f_i\varepsilon_i - \EH - \int\vxc n + \Exc$

Q: Janak's theorem?
A: $\partial E/\partial f_i = \varepsilon_i$

Q: Ionisation-potential theorem?
A: For the exact functional, $\varepsilon_{\text{HOMO}} = -I$.

Q: What is the derivative discontinuity?
A: The jump $\Delta_{\text{xc}}$ in the exact xc potential as $N$ crosses an integer. $E_g = E_g^{\text{KS}} + \Delta_{\text{xc}}$.

Q: Piecewise linearity?
A: The exact $E(N)$ is linear between integers. DFAs are convex (delocalisation error); HF is concave.

Q: xc hole sum rule?
A: $\int n_{\text{xc}}(\vr,\vr')\,\dd\vr' = -1$. Exchange hole −1, correlation hole 0.

Q: Adiabatic connection formula?
A: $\Exc = \int_0^1 W_\lambda\,\dd\lambda$, with $W_0 = E_{\text x}$ (exact exchange of the KS determinant).

Q: LDA exchange energy per electron?
A: $\epsilon_{\text x} = -\frac34\left(\frac{3}{\pi}\right)^{1/3}n^{1/3}$

Q: Reduced gradient $s$?
A: $s = |\nabla n| / (2(3\pi^2)^{1/3}n^{4/3})$

Q: PBE exchange enhancement factor?
A: $F_x = 1+\kappa - \kappa/(1+\mu s^2/\kappa)$, with $\kappa=0.804$, $\mu=0.2195$.

Q: What does $\tau$ add in meta-GGAs?
A: The kinetic-energy density. Via $\alpha$ it identifies single-orbital ($\alpha=0$), uniform ($\alpha=1$) and weak-overlap ($\alpha\gg1$) regions.

Q: PBE0 formula?
A: $\Exc = \frac14E_{\text x}^{\text{HF}} + \frac34E_{\text x}^{\text{PBE}} + E_{\text c}^{\text{PBE}}$

Q: What does HSE do differently?
A: Exact exchange only at short range, $\operatorname{erfc}(\omega r)/r$ with $\omega = 0.11$ bohr⁻¹. Cheaper and better for solids.

Q: Why do semilocal functionals miss dispersion?
A: Dispersion is non-local correlation between distant fragments ($-C_6/R^6$), invisible to local density information.

Q: Name three dispersion corrections.
A: Grimme D3(BJ)/D4, Tkatchenko–Scheffler / MBD, vdW-DF2 / rVV10.

Q: Self-interaction error: one-line example.
A: H₂⁺ dissociation: GGA energy far too low at large separation.

Q: DFT+U energy (Dudarev)?
A: $E = E_{\text{DFT}} + \frac{U_{\text{eff}}}{2}\sum_\sigma\operatorname{Tr}[\mathbf n^\sigma(1-\mathbf n^\sigma)]$

Q: Bloch's theorem?
A: $\psi_{n\vk}(\vr) = e^{i\vk\cdot\vr}u_{n\vk}(\vr)$ with $u$ lattice-periodic.

Q: Why pseudopotentials with plane waves?
A: Core cusps and valence nodes need enormous cutoffs. Smooth pseudo-wavefunctions converge quickly.

Q: NC vs US vs PAW in one line each.
A: NC: norm-conserving, high cutoff. US: augmentation charges, low cutoff. PAW: reconstructs all-electron wavefunctions, low cutoff.

Q: Scaling of the number of plane waves with cutoff?
A: $N_{\text{PW}}\propto\Omega\,E_{\text{cut}}^{3/2}$

Q: Why smearing for metals?
A: The Fermi surface makes occupations discontinuous across the BZ. Smearing stabilises the SCF and speeds k-point convergence.

Q: What is charge sloshing?
A: SCF oscillation of long-wavelength density components, amplified by the $4\pi/G^2$ Hartree response. Fix with Kerker plus Pulay/Broyden.

Q: Pulay/DIIS in one line?
A: Combine previous densities to minimise the residual norm with coefficients summing to 1, then step.

Q: Hellmann–Feynman theorem?
A: $\partial E/\partial\lambda = \langle\Psi|\partial\hat H/\partial\lambda|\Psi\rangle$ for exact or variational, converged states.

Q: Pulay forces arise when?
A: Basis functions depend on atomic positions (atom-centred bases).

Q: Finite displacement vs DFPT?
A: FD: supercell forces, simple, any code. DFPT: linear response at any $\mathbf q$ in the primitive cell, plus dielectric properties.

Q: Car–Parrinello vs Born–Oppenheimer MD?
A: CP propagates orbitals as fictitious dynamical variables (no SCF per step). BOMD converges the SCF every step.

Q: Runge–Gross theorem?
A: The time-dependent density determines the time-dependent potential (up to $c(t)$) for a given initial state.

Q: GW in one line?
A: Quasiparticle energies from the self-energy $\Sigma = iGW$. It fixes band gaps; G₀W₀@PBE is common.

Q: Why equivariant MLIPs?
A: E(3) symmetry built in exactly: no data spent learning rotations, much better data efficiency and generalisation.

Q: Conservative vs direct forces?
A: Conservative ($-\nabla E$): energy-conserving, consistent PES, costs a backward pass. Direct: faster, but can break MD.

Q: Name four DFT datasets used in ML and their level of theory.
A: QM9 (B3LYP), MPtrj (PBE/PBE+U), OC20 (RPBE), SPICE (ωB97M-D3BJ); also OMat24 (PBE/PBE+U), OMol25 (ωB97M-V).

Q: What is Matbench Discovery?
A: A benchmark for predicting crystal stability (energy above hull) of hypothetical materials, plus thermal-conductivity tests ($\kappa_{\text{SRME}}$).

Q: DM21's main idea?
A: An NN local-hybrid functional trained on fractional-charge and fractional-spin systems to reduce delocalisation and static-correlation errors.

Q: Δ-learning?
A: Learn $E_{\text{high}} - E_{\text{low}}$. It is smoother and needs fewer expensive labels.

Q: Why can't you pool OC20 and MPtrj energies directly?
A: Different functionals and settings (RPBE vs PBE/PBE+U) put energies on different scales.

Q: Exponential wall?
A: Storing $\Psi$ for $N$ electrons on $p$ points per dimension needs $p^{3N}$ numbers. The density needs $p^3$.
```

> [!TIP] Spaced repetition
> Revisit the flashcards after 1 day, 3 days, 1 week and 2 weeks. If a card takes more than five seconds, go back to the chapter section and re-derive the result rather than memorising it.

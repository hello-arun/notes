# Forces, dynamics & beyond the ground state

<p class="lede">A single-point energy is rarely the goal. We want structures, barriers, vibrations, finite-temperature dynamics and spectra. This chapter covers how DFT delivers them, and where ground-state DFT stops and other theories (TDDFT, GW, DMFT) take over.</p>

## Forces: the Hellmann–Feynman theorem

The force on nucleus $I$ is $\mathbf F_I = -\partial E/\partial\vR_I$. For an exact eigenstate (or any variational state that is fully converged in a complete or position-independent basis), the **Hellmann–Feynman theorem** gives

$$
\frac{\partial E}{\partial\lambda} = \Big\langle\Psi\Big|\frac{\partial\hat H}{\partial\lambda}\Big|\Psi\Big\rangle
\quad\Longrightarrow\quad
\mathbf F_I = -\int n(\vr)\,\frac{\partial \vext(\vr)}{\partial\vR_I}\,\dd\vr - \frac{\partial E_{\text{nn}}}{\partial\vR_I}
$$

Only the explicit dependence of $\hat H$ on $\vR_I$ matters, because the energy is stationary with respect to wavefunction changes. So forces cost about one extra density integral: **forces are nearly free**, which makes geometry optimisation and MD affordable.

Corrections appear when the assumptions fail:

- **Pulay forces:** atom-centred basis functions move with atoms, so $\partial\chi_\mu/\partial\vR_I\neq0$ and extra terms appear. Plane waves have none (but have Pulay *stress*).
- **Incomplete SCF:** non-variational errors. Forces are noisier than energies if the SCF is loosely converged.
- **Smearing:** forces are derivatives of the *free energy* $F$, not $E$.
- **PAW/ultrasoft:** augmentation terms add contributions (handled by codes).

The **stress tensor** $\sigma_{\alpha\beta} = -\frac1\Omega\partial E/\partial\epsilon_{\alpha\beta}$ (Nielsen–Martin 1985) comes the same way and drives variable-cell relaxations.

> [!INTERVIEW] Why ML potentials train on forces
> One DFT calculation gives one energy but $3N$ force components, essentially free via Hellmann–Feynman. Forces carry far more information per calculation and constrain the *shape* of the PES. Training on forces as gradients of a predicted energy (conservative forces) keeps the learned PES physically consistent, so energy is conserved in MD.

## Geometry optimisation and transition states

- **Local minimisers:** BFGS / L-BFGS (quasi-Newton; approximate Hessian), conjugate gradient, **FIRE** (MD-like with velocity damping; robust). Converge until max force < 0.01–0.05 eV/Å.
- **Variable cell:** include stress (target pressure); watch out for Pulay stress.
- **Transition states:** the **nudged elastic band** (NEB) optimises a chain of images between reactant and product connected by springs; **climbing-image NEB** drives the highest image to the saddle point. Alternatives: dimer method, growing-string method. Verify a saddle point with a frequency calculation: exactly one imaginary mode.
- Barriers from NEB feed **transition-state theory**: $k = \nu^* e^{-\Delta E^\ddagger/k_BT}$ (harmonic TST, Vineyard).

## Phonons and lattice dynamics

In the harmonic approximation, expand the PES to second order:

$$
U \approx U_0 + \frac12\sum_{I\alpha,J\beta}\Phi_{I\alpha,J\beta}\,u_{I\alpha}u_{J\beta}, \qquad
D_{\alpha\beta}^{IJ}(\mathbf q) = \frac{1}{\sqrt{M_IM_J}}\sum_{\vR}\Phi_{I\alpha,J\beta}(\vR)\,e^{i\mathbf q\cdot\vR}
$$

Diagonalising the **dynamical matrix** $D(\mathbf q)$ gives frequencies $\omega_\nu(\mathbf q)$. Imaginary frequencies signal a dynamical instability (the structure is a saddle point, not a minimum), which is a common sanity check on predicted crystals.

Two routes to the force constants $\Phi$:

| Method | How | Notes |
|---|---|---|
| **Finite displacement** (frozen phonon) | Displace atoms in a supercell, compute forces, $\Phi \approx -\Delta F/\Delta u$ | Simple, works with any code/functional; supercell must be large enough. Tools: Phonopy, phono3py |
| **DFPT** (density-functional perturbation theory) | Linear response: solve the Sternheimer equation for $\partial\psi/\partial u$ at any $\mathbf q$ in the primitive cell | Efficient, exact $\mathbf q$; also gives dielectric tensor, Born effective charges, electron–phonon couplings. QE `ph.x`, ABINIT |

DFPT relies on the **$2n+1$ theorem**: knowing the wavefunction to order $n$ gives the energy to order $2n+1$. First-order wavefunctions give second derivatives (force constants) and even third. Polar materials need the non-analytic term (LO–TO splitting) built from Born charges and $\varepsilon_\infty$.

From phonons: vibrational free energy $F_{\text{vib}}(T)$ (quasi-harmonic approximation gives thermal expansion), heat capacity, thermal conductivity (needs anharmonic third-order constants), and IR/Raman spectra.

## Ab initio molecular dynamics (AIMD)

Move nuclei classically on the DFT PES: $M_I\ddot\vR_I = \mathbf F_I$.

- **Born–Oppenheimer MD:** fully converge the SCF at every step. Time step ~0.5–2 fs (smaller with hydrogen; use deuterium mass to cheat). The SCF must be tight or energy drifts.
- **Car–Parrinello MD (1985):** treat orbitals as fictitious classical degrees of freedom with a small mass $\mu$ and propagate them alongside the nuclei. No SCF at each step, as long as electrons stay "cold" (adiabatic separation; problematic for metals). It made AIMD feasible and was a landmark (it also popularised plane-wave + pseudopotential DFT).
- **Extended Lagrangian BOMD** (Niklasson) and good initial-guess extrapolation make modern BOMD efficient.

Cost is the bottleneck: ~10³–10⁵ steps of a ~100-atom system, i.e. picoseconds to maybe a nanosecond. Rare events (nucleation, diffusion in solids, protein dynamics) are out of reach. This is the **main motivation for ML interatomic potentials**, which give DFT-quality forces at 10³–10⁶× lower cost and linear scaling, enabling nanoseconds and millions of atoms.

Thermostats (Nosé–Hoover, Langevin, CSVR) give NVT; barostats give NPT. Enhanced sampling (metadynamics, umbrella sampling) yields free-energy surfaces.

## Spin, magnetism and relativity

- **Collinear spin-DFT**: separate $n_\uparrow$, $n_\downarrow$; magnetic moment $m = \int(n_\uparrow-n_\downarrow)$.
- **Non-collinear magnetism + spin–orbit coupling (SOC)**: 2-component spinors; needed for heavy elements, topological insulators, magnetic anisotropy energies. SOC splits bands (e.g. the GaAs valence band, Bi₂Se₃ band inversion).
- **Scalar-relativistic** effects (mass–velocity, Darwin) are built into most pseudopotentials. All-electron codes use ZORA or DKH Hamiltonians for heavy elements.

## Time-dependent DFT (TDDFT)

**Runge–Gross theorem (1984):** for a given initial state, the time-dependent density $n(\vr,t)$ uniquely determines the time-dependent potential (up to a purely time-dependent function). This is the time-dependent analogue of HK. The time-dependent KS equations are

$$
i\frac{\partial}{\partial t}\phi_i(\vr,t) = \Big[-\tfrac12\nabla^2 + \veff[n](\vr,t)\Big]\phi_i(\vr,t)
$$

Two ways to use it:

- **Real-time propagation:** apply a field, propagate, Fourier-transform the dipole to get absorption spectra; also for strong-field and non-linear dynamics.
- **Linear response (Casida equations):** excitation energies $\Omega$ come from a matrix eigenvalue problem built from KS orbital-energy differences and a coupling kernel:

$$
\begin{pmatrix}\mathbf A & \mathbf B\\ \mathbf B^* & \mathbf A^*\end{pmatrix}\begin{pmatrix}\mathbf X\\ \mathbf Y\end{pmatrix} = \Omega\begin{pmatrix}\mathbf 1 & 0\\ 0 & -\mathbf 1\end{pmatrix}\begin{pmatrix}\mathbf X\\ \mathbf Y\end{pmatrix},\quad
A_{ia,jb} = \delta_{ij}\delta_{ab}(\varepsilon_a-\varepsilon_i) + K_{ia,jb}
$$

$K$ contains Hartree and xc kernels, $f_{\text{xc}} = \delta\vxc/\delta n$. The **adiabatic approximation** uses a frequency-independent ground-state kernel. Its consequences: no double excitations; charge-transfer excitations too low with semilocal kernels (fix with range-separated hybrids); in solids no excitons from ALDA (needs long-range kernels or BSE). The Tamm–Dancoff approximation sets $\mathbf B = 0$.

TDDFT is the workhorse for UV-vis spectra of molecules, typically accurate to ~0.2–0.4 eV for valence excitations.

## Many-body perturbation theory: GW and BSE

For accurate **quasiparticle** energies (band gaps, photoemission) the standard is **GW** (Hedin 1965; Hybertsen–Louie 1986). The self-energy is approximated as $\Sigma = iGW$, the product of the Green's function and the screened Coulomb interaction $W = \varepsilon^{-1}v$. In the common **G₀W₀@PBE** approach the KS eigenvalues are corrected perturbatively:

$$
\varepsilon_n^{\text{QP}} = \varepsilon_n^{\text{KS}} + \langle\phi_n|\Sigma(\varepsilon_n^{\text{QP}}) - \vxc|\phi_n\rangle
$$

Gaps of semiconductors come within ~0.1–0.3 eV (depending on starting point and self-consistency: evGW, QSGW). Cost is roughly $O(N^4)$ with large prefactors and slow convergence in empty bands. The **Bethe–Salpeter equation (BSE)** on top of GW adds electron–hole interaction for optical spectra with excitons.

## Other extensions worth knowing by name

- **Mermin finite-temperature DFT (1965):** grand-canonical extension; free-energy functionals; warm dense matter.
- **DFT+DMFT:** dynamical mean-field theory for local correlations in d/f materials (Mott physics), with DFT for the rest.
- **Embedding** (QM/MM, projection-based embedding, DMET): treat an active region at a high level inside a DFT or classical environment.
- **Modern theory of polarisation** (King-Smith–Vanderbilt 1993): Berry phase of occupied bands, giving ferroelectric polarisation and Born charges.
- **Wannier functions** (maximally localised; Marzari–Vanderbilt): a localised picture of bands, tight-binding models, band interpolation for electron–phonon calculations.
- **Constrained DFT, ΔSCF:** charge-transfer states, core-level spectroscopy.
- **Implicit solvation** (PCM, SMD, VASPsol): electrochemistry and solution chemistry.

```quiz
? Why are DFT forces "nearly free" once the SCF is converged?
+ The Hellmann–Feynman theorem: the energy is stationary in the wavefunction, so only the explicit $\vR$-dependence of $\hat H$ contributes
- Forces are computed by finite differences, which are cheap
- Forces do not depend on the density
- Forces are only needed for metals
= $\partial E/\partial\vR = \langle\partial\hat H/\partial\vR\rangle$, about one extra integral over the density (plus Pulay/augmentation terms where applicable).

? Pulay forces arise when…
+ Basis functions depend on atomic positions (e.g. atom-centred Gaussians)
- Plane waves are used
- The temperature is non-zero
- Spin–orbit coupling is included
= Basis functions that move with atoms make $\partial\chi/\partial\vR\neq0$, so extra terms are needed beyond Hellmann–Feynman.

? A relaxed structure shows one imaginary phonon frequency at a zone-boundary q-point. This means…
+ The structure is dynamically unstable; distorting along that mode (in a supercell) lowers the energy
- The calculation used too many k-points
- The material is a metal
- The structure is the global minimum
= An imaginary frequency means negative curvature of the PES along that mode: a saddle point.

? The main advantage of DFPT over finite displacements is…
+ Response at arbitrary $\mathbf q$ in the primitive cell, plus dielectric properties, without supercells
- It works with any functional, including hybrids, more easily
- It needs no SCF calculation
- It includes anharmonicity automatically
= DFPT solves linear-response equations for each $\mathbf q$ and also gives $\varepsilon_\infty$, Born charges and electron–phonon matrix elements.

? Car–Parrinello MD avoids…
+ Converging the SCF at every MD step, by propagating orbitals as fictitious dynamical variables
- Computing forces
- Using pseudopotentials
- The Born–Oppenheimer approximation entirely
= Orbitals get a fictitious mass and follow the nuclei adiabatically. It works well for gapped systems and less well for metals.

? What does the adiabatic approximation in TDDFT neglect?
+ The frequency (memory) dependence of the xc kernel
- The Hartree kernel
- Spin
- Excited states altogether
= Adiabatic kernels use the ground-state functional at each instant. Consequences include missing double excitations.

? G₀W₀ is mainly used to…
+ Correct quasiparticle energies such as band gaps
- Relax geometries faster
- Compute phonons
- Replace the SCF loop
= GW replaces $\vxc$ with a non-local, energy-dependent self-energy $\Sigma = iGW$, fixing the band-gap problem.

? Why is AIMD the main motivation for ML interatomic potentials?
+ AIMD is limited to ~100s of atoms and ~picoseconds; MLIPs reach DFT-like accuracy at a tiny fraction of the cost
- AIMD gives wrong forces
- AIMD cannot use thermostats
- MLIPs are more accurate than DFT by construction
= MLIPs inherit DFT accuracy (at best) but scale linearly and run 10³–10⁶× faster, enabling long, large simulations.
```

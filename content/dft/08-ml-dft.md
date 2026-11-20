# Machine learning × DFT

<p class="lede">This is the chapter most likely to come up in an interview at an AI-for-science team. ML now touches every layer of electronic-structure work: it emulates DFT (interatomic potentials), corrects it (Δ-learning, learned functionals), accelerates it (Hamiltonian and density prediction), and uses it as a data engine and validator for generative materials design.</p>

## The landscape

| Approach | Learns | Example models |
|---|---|---|
| **Property prediction** | structure → scalar property (formation energy, gap) | CGCNN, MEGNet, ALIGNN |
| **ML interatomic potentials (MLIPs)** | structure → energy, forces, stress (the PES) | Behler–Parrinello NN, GAP, SchNet, NequIP, Allegro, MACE, Equiformer |
| **Universal / foundation potentials** | one MLIP across the periodic table | M3GNet, CHGNet, MACE-MP-0, GNoME, MatterSim, Orb, SevenNet, eqV2, UMA |
| **Δ-learning / transfer learning** | correction from cheap to expensive theory | Δ-ML (Ramakrishnan 2015), ANI-1ccx |
| **Learned xc functionals** | $\Exc[n]$ itself | DM21 (DeepMind), Skala (Microsoft), NeuralXC, KS-regulariser |
| **Hamiltonian / density prediction** | KS Hamiltonian matrix or $n(\vr)$ | SchNOrb, PhiSNet, DeepH, QHNet, ChargE3Net |
| **Generative design** | distribution of stable structures | CDVAE, DiffCSP, MatterGen; GNoME (active-learning discovery) |
| **Neural wavefunctions** | $\Psi$ directly (variational Monte Carlo) | FermiNet, PauliNet, Psiformer |

## ML interatomic potentials

### The locality ansatz

Almost all MLIPs write the energy as a sum of atomic contributions that depend on each atom's local environment within a cutoff $r_c$ (typically 5–6 Å):

$$
E = \sum_{i=1}^{N} \varepsilon\big(\{\vr_{ij}, Z_j\}_{j\,:\,r_{ij}<r_c}\big), \qquad \mathbf F_i = -\nabla_{\vr_i} E, \qquad \sigma = \frac1\Omega\frac{\partial E}{\partial\boldsymbol\epsilon}
$$

This is justified by the **nearsightedness of electronic matter** (Kohn), it gives **linear scaling** in $N$, and it makes models size-extensive and transferable across system sizes. It fails for long-range electrostatics, charge transfer and dispersion beyond $r_c$. Fixes: explicit Coulomb terms with learned charges (4G-HDNNP, charge equilibration), Ewald-type message passing, latent long-range terms (LES), or analytic D3 added on top. Message passing with $T$ layers extends the receptive field to $T\cdot r_c$, but not truly to long range.

### Symmetries

The PES must be invariant to **translations, rotations, reflections (parity) and permutations of identical atoms**. Forces must be **equivariant**: rotating the input rotates the forces.

$$
E(\mathbf Q\vr_1+\mathbf t,\dots) = E(\vr_1,\dots), \qquad \mathbf F_i(\mathbf Q\vr+\mathbf t) = \mathbf Q\,\mathbf F_i(\vr)
$$

If $E$ is invariant and $\mathbf F = -\nabla E$, force equivariance comes for free.

Three generations of architectures handle symmetry differently:

1. **Hand-crafted invariant descriptors + regression.** Behler–Parrinello (2007) atom-centred symmetry functions with one NN per element; SOAP + Gaussian process (GAP, Bartók 2010); moment tensor potentials; ACE (atomic cluster expansion, Drautz 2019), a complete, systematic body-ordered basis.
2. **Invariant message-passing GNNs.** SchNet (continuous-filter convolutions on distances), DimeNet (adds angles), PaiNN (vector features).
3. **Equivariant GNNs.** Features are irreducible representations of O(3) (scalars $\ell=0$, vectors $\ell=1$, rank-2 tensors $\ell=2$, …) combined with Clebsch–Gordan tensor products of spherical harmonics $Y_\ell^m(\hat\vr_{ij})$. **NequIP** (2022) showed very high data efficiency; **Allegro** is strictly local, which suits massive parallel MD; **MACE** (2022) builds high body-order messages (ACE inside message passing) so 2 layers suffice; **Equiformer/EquiformerV2** use equivariant attention. **eSCN** reduces tensor-product cost from $O(L^6)$ to $O(L^3)$ by rotating edges to align with the $z$-axis.

> [!INTERVIEW] "Why equivariance? Can't you just augment data with rotations?"
> Equivariance builds in an exact symmetry, so the model wastes no capacity or data learning it, and it extrapolates correctly to unseen orientations. NequIP-style models reach a given accuracy with 10–1000× less data than invariant models. Some state-of-the-art models (e.g. Orb) are *not* strictly equivariant and use augmentation instead, trading exact symmetry for speed and scale. That works when data are plentiful. Know both sides.

### Training

$$
\mathcal L = \lambda_E\sum_{s}\Big(\frac{\hat E_s - E_s}{N_s}\Big)^2 + \lambda_F\sum_s\frac{1}{3N_s}\sum_{i}\big\lVert\hat{\mathbf F}_i - \mathbf F_i\big\rVert^2 + \lambda_\sigma\sum_s\lVert\hat\sigma_s-\sigma_s\rVert^2
$$

- Energies are usually normalised **per atom**, after subtracting per-element reference energies (a linear fit of $E$ on composition).
- Forces dominate the information content ($3N$ labels per structure) and are usually weighted heavily.
- **Conservative vs direct forces.** Computing $\mathbf F = -\nabla E$ by autodiff costs a backward pass (about 2–3× slower) but guarantees energy conservation and a consistent PES. A **direct** force head predicts forces as separate outputs: faster, but the forces are not the gradient of anything, so MD can drift and phonons or relaxations can be unreliable. Recent work found direct-force models score well on static benchmarks yet fail in dynamics, so the field has largely moved back to conservative forces or uses direct-force pretraining followed by conservative fine-tuning.
- Typical accuracy targets: energy MAE of a few meV/atom; force MAE ~20–50 meV/Å for specialised potentials (higher for universal ones).

### Data and active learning

The model is only as good as its coverage of configuration space. Standard practice:

1. Seed data: relaxations, AIMD at several temperatures, rattled structures, strained cells, surfaces, defects.
2. Train an **ensemble/committee** (or use another uncertainty estimate).
3. Run MD with the MLIP; when the committee disagrees (high force variance), compute DFT for those configurations and add them.
4. Repeat until uncertainty stays low along the trajectories you care about.

Tools: DP-GEN (DeePMD), FLARE (on-the-fly with GPs), VASP's on-the-fly ML force field, and ASE/ase-calculators for scripting.

### Evaluation: MAE is not enough

> [!DANGER] Interview trap: "Our model has state-of-the-art force MAE, so it's ready for MD."
> Low test MAE on near-equilibrium data says little about **stability** (does MD explode or drift?), **physical observables** (radial distribution functions, diffusion coefficients, phonons, elastic constants, barriers), or **out-of-distribution** behaviour (high temperature, rare events, new chemistry). Evaluate downstream tasks. Check energy conservation in NVE, phonon spectra against DFT, and rare configurations such as atoms that come very close (short-range repulsion holes).

Known systematic issue: universal potentials trained mostly on near-equilibrium data tend to **soften the PES**, underestimating curvatures (phonon frequencies, surface energies, migration barriers). A small amount of fine-tuning data largely fixes this.

## Datasets you should know

| Dataset | Content | Level of theory |
|---|---|---|
| **QM9** | ~134k small organic molecules (≤ 9 heavy atoms C, N, O, F) | B3LYP/6-31G(2df,p) |
| **MD17 / rMD17** | MD trajectories of small molecules (energy + forces) | PBE (rMD17 recomputed, less noisy) |
| **ANI-1x / ANI-2x** | Millions of off-equilibrium organic conformers | ωB97X/6-31G(d) |
| **SPICE** | Drug-like molecules, peptides, dimers | ωB97M-D3(BJ)/def2-TZVPPD |
| **OMol25** (Meta, 2025) | >100M molecular calculations: biomolecules, electrolytes, metal complexes | ωB97M-V/def2-TZVPD |
| **Materials Project** | ~150k+ inorganic crystals, relaxations, properties | PBE / PBE+U (plus r2SCAN) |
| **MPtrj** | ~1.6M structures from MP relaxation trajectories | PBE / PBE+U (CHGNet's training set) |
| **Alexandria** | Millions of hypothetical crystals | PBE / PBEsol / SCAN |
| **OC20 / OC22** | Adsorbates on catalyst surfaces: ~1.3M relaxations, ~260M single points (OC20); oxides (OC22) | RPBE (OC20); PBE+U (OC22) |
| **OMat24** (Meta, 2024) | ~110M non-equilibrium bulk structures (rattled, AIMD) | PBE / PBE+U |
| **ODAC23** | MOF + CO₂/H₂O adsorption | PBE-D3 |

> [!WARNING] Mixing datasets
> Different datasets use different functionals, +U values, pseudopotentials and codes, so their energies are on **different scales**. You cannot pool raw energies from OC20 (RPBE) and MPtrj (PBE/PBE+U). Multi-fidelity or multi-head models (e.g. one head per level of theory, as in UMA-style models) or task embeddings are needed.

## Universal potentials and foundation models

Since 2022, models trained on very large, diverse DFT datasets run reasonably well on almost any inorganic material out of the box:

- **M3GNet** (2022) and **CHGNet** (2023; adds magnetic moments): trained on MP relaxations.
- **MACE-MP-0** (2023): MACE trained on MPtrj; showed stable MD across a huge range of chemistries, from water to catalysts to MOFs.
- **GNoME** (DeepMind, *Nature* 2023): large-scale active learning that reported ~2.2M new crystal structures, ~380k on the convex hull; its potential was trained on the resulting data.
- **MatterSim** (Microsoft, 2024): trained across wide temperature and pressure ranges.
- **Orb, SevenNet, eqV2 / eSEN, UMA** (Meta, 2025: a mixture-of-linear-experts model across molecules, materials and catalysts): leaderboards change every few months.

**Matbench Discovery** is the standard benchmark: predict thermodynamic stability (energy above the convex hull) of hypothetical crystals, with metrics such as F1, discovery acceleration factor and RMSD, plus thermal conductivity ($\kappa_{\text{SRME}}$, which tests second- and third-order derivatives, i.e. phonons and anharmonicity). Leaderboard models now classify stability with F1 above ~0.8.

**Fine-tuning** a foundation model on a few hundred system-specific DFT calculations typically beats training from scratch and fixes PES softening.

## Learned exchange–correlation functionals

Instead of emulating DFT, improve it:

- **DM21** (DeepMind, Kirkpatrick et al., *Science* 2021): a neural network maps local features (density, gradient, kinetic-energy density, and local HF-exchange energy densities at two range-separation parameters) to an xc energy density, making it a *local hybrid*. The key idea was training on **fractional-charge and fractional-spin** systems so the functional learns piecewise linearity, which reduces delocalisation and static-correlation errors in cases where conventional functionals fail (H₂⁺, stretched H₂, charge-transfer systems). Cost is that of a hybrid; SCF convergence can be delicate.
- **Skala** (Microsoft Research, 2025): a deep-learned functional that learns *non-local* features from semi-local inputs on the integration grid, trained on a large, newly generated set of highly accurate wavefunction-method reference energies. It reported near chemical accuracy for main-group atomisation energies at a cost comparable to semilocal functionals. It shows that data scale, not only clever constraints, can climb Jacob's ladder.
- **Differentiable DFT**: implement the SCF loop in an autodiff framework (JAX-DFT, PySCFAD, DQC, Grad-DFT), so the loss can be placed on *self-consistent* densities and energies. Li et al. (*PRL* 2021), "Kohn–Sham equations as regularizer", showed that backpropagating through the SCF loop gives much better generalisation from very little data.
- **ML kinetic-energy functionals** for orbital-free DFT (Snyder et al. 2012) target $O(N)$ cost.

> [!KEY] Why learned functionals are hard
> The functional must work *inside* the SCF loop: its functional derivative $\vxc = \delta\Exc/\delta n$ must be smooth and well behaved, not just its energy. It should satisfy exact constraints for transferability. Training data with accurate *densities* are scarce. And the result must beat decades of human-designed functionals across chemistry, not on one benchmark.

## Δ-learning, Hamiltonians and densities

- **Δ-learning:** $E_{\text{high}} \approx E_{\text{low}} + \text{ML}(\Delta)$. The correction is smoother and easier to learn than the total. **Transfer learning** (ANI-1ccx): pretrain on millions of DFT points, fine-tune on ~500k CCSD(T)/CBS points, reaching coupled-cluster quality at force-field cost.
- **Hamiltonian prediction** (SchNOrb, PhiSNet, DeepH, QHNet): predict the KS Hamiltonian in an atomic-orbital basis with equivariant networks. From it you get eigenvalues, band structures and wavefunctions, i.e. electronic properties and not only energies. DeepH targets large twisted 2D materials.
- **Charge-density prediction** (e.g. ChargE3Net): predict $n(\vr)$ to initialise SCF (saving iterations) or to compute properties directly.

## Generative materials design

Pipeline: **generate candidates → relax with an MLIP → screen stability (energy above hull) and properties → validate with DFT → synthesise.**

- **CDVAE** (2021), **DiffCSP** (2023): diffusion over lattice, fractional coordinates and atom types, with periodic and E(3) symmetries.
- **MatterGen** (Microsoft, *Nature* 2025): a diffusion model for stable, diverse inorganic crystals that can be conditioned on chemistry, symmetry and properties (e.g. magnetic density, bulk modulus), with experimental validation of a generated compound.
- **GNoME** combined structure substitution, random structure search, GNN filtering and DFT in an active-learning loop.

Critiques you should know (they make you sound credible): many "new" materials are ordered approximations of known disordered compounds or are trivially related to known ones, and DFT stability (at 0 K, PBE, no disorder or entropy) is not synthesisability. Novelty, stability and synthesisability metrics are active research topics.

## Neural-network wavefunctions

FermiNet (DeepMind 2020), PauliNet (2020) and Psiformer (2023) parametrise $\Psi$ with a neural network that is antisymmetric by construction (determinants of permutation-equivariant features) and optimise it by variational Monte Carlo. They reach near-exact energies for small molecules, beyond CCSD(T) in some multi-reference cases. They scale steeply (~$N^4$ or worse per step), but they are a route to generating reference data where coupled cluster fails.

## System design: "Design a pipeline to train a universal potential"

A strong answer covers:

1. **Scope:** chemistry (inorganic, molecular, both?), conditions (temperature, pressure), target tasks (relaxation, MD, phonons, stability screening).
2. **Level of theory:** choose and **fix** the functional, +U scheme, pseudopotentials, cutoffs, k-point density, smearing and spin treatment. Validate convergence once, then automate.
3. **Data generation:** diverse sampling (relaxation trajectories, AIMD, rattling, strain, surfaces and defects); active learning with uncertainty; deduplication; filters for unconverged SCF, broken spin states and large forces. Workflow managers: atomate2, AiiDA, FireWorks, jobflow. Track provenance of every calculation.
4. **Model:** equivariant GNN (MACE / Equiformer-type), cutoff ~6 Å, conservative forces, stress, per-element reference energies; optional long-range and D3 terms; multi-head if mixing levels of theory.
5. **Training at scale:** data-parallel multi-GPU; force-weighted loss; EMA of weights; learning-rate schedule; per-system batching by atom count.
6. **Evaluation:** held-out splits by *composition or structure prototype* (not random, to avoid leakage); MAE, plus Matbench Discovery-style stability classification, phonons, NVE energy conservation, MD stability at high temperature, and comparison of physical observables with DFT and experiment.
7. **Deployment:** fast inference kernels, LAMMPS/ASE interfaces, uncertainty flags in production, a fine-tuning recipe for users.

```quiz
? Why do most MLIPs write $E=\sum_i\varepsilon_i$ with a finite cutoff?
+ Nearsightedness of electronic matter justifies locality, giving linear scaling and size extensivity
- Because DFT energies are exactly sums of atomic energies
- To make the model rotationally equivariant
- Because long-range interactions are always negligible
= Locality is an approximation that works well for many systems. Long-range electrostatics and dispersion may need explicit terms.

? If $E$ is a rotation-invariant function and forces are $-\nabla E$, the forces are…
+ Automatically rotation-equivariant
- Rotation-invariant
- Not guaranteed to have any symmetry
- Equivariant only if a direct force head is used
= The gradient of an invariant scalar transforms as a vector. This is one reason conservative force prediction is attractive.

? A model with direct (non-conservative) force prediction may…
+ Fail to conserve energy in NVE MD and give inconsistent phonons, despite good force MAE
- Break translational invariance
- Be unable to predict energies
- Be slower than a conservative model
= Direct forces are not the gradient of any energy, so the dynamics are not Hamiltonian. They are usually faster, not slower.

? DM21's key training innovation was…
+ Including fractional-charge and fractional-spin systems so the functional learns exact constraints such as piecewise linearity
- Training on band gaps of semiconductors
- Using only the density as input
- Replacing the SCF loop with a neural network
= Training on fractional systems targets delocalisation and static-correlation errors.

? You want to pool OC20 and MPtrj data to train one model. What is the main problem?
+ They use different levels of theory (RPBE vs PBE/PBE+U), so their energies are on different scales
- They use different file formats
- One contains forces and the other doesn't
- OC20 contains only molecules
= Energies from different functionals and +U schemes are not directly comparable. Use multi-head or multi-fidelity training, or separate references.

? Which evaluation best reveals that a universal potential "softens" the PES?
+ Comparing phonon frequencies or surface energies against DFT
- Energy MAE on the training set
- Counting parameters
- Inference speed
= Softening means systematically underestimated curvature, which shows up in second-derivative properties such as phonons.

? What is Δ-learning?
+ Learning the difference between a cheap and an expensive level of theory
- Learning forces as finite differences of energies
- Learning the change in energy between MD steps
- A method for computing band gaps
= $E_{\text{high}} = E_{\text{low}} + \Delta_{\text{ML}}$. The correction is smoother and needs fewer expensive labels.

? Why should test sets for crystal property models be split by composition or prototype rather than randomly?
+ Random splits leak near-duplicate structures and overestimate generalisation
- Random splits are slower to compute
- Composition splits give more training data
- Models cannot predict properties for random splits
= Many datasets contain closely related structures (substitutions, relaxation frames). Random splits test interpolation, not discovery.

? Equivariant architectures such as NequIP and MACE represent features as…
+ Irreducible representations of O(3) (scalars, vectors, higher-order tensors) combined via tensor products of spherical harmonics
- Only interatomic distances
- Images of the crystal rendered from multiple angles
- SMILES strings
= Features carry angular momentum $\ell$ and transform predictably under rotation. Clebsch–Gordan products combine them equivariantly.
```

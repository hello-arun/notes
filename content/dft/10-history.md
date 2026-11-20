# History & progress

<p class="lede">DFT's history is a story of theory, numerics, computing power and, recently, machine learning feeding each other. Knowing the milestones helps you put any method in context, and interviewers like candidates who know <em>why</em> things are the way they are.</p>

## Timeline

```timeline
1927 | **Thomas–Fermi model.** The energy written as a functional of the density alone, using the uniform-gas kinetic energy $\propto n^{5/3}$. Crude, but the first density functional.
1928–30 | **Hartree** self-consistent field; **Fock** and **Slater** add antisymmetry (Hartree–Fock). Dirac adds local exchange to Thomas–Fermi (1930).
1951 | **Slater's Xα method**: replaces the non-local HF exchange with a local $\rho^{1/3}$ potential. Widely used in solid-state physics, and a precursor of the LDA.
1964 | **Hohenberg–Kohn theorems**: the ground-state density determines everything; variational principle for $F[n]$.
1965 | **Kohn–Sham equations**: non-interacting reference system plus $\Exc$. Also **Mermin**'s finite-temperature extension.
1972 | **von Barth–Hedin**: spin-density functional theory.
1979–83 | **Levy–Lieb constrained search** puts DFT on rigorous footing (N-representability instead of v-representability).
1980 | **Ceperley–Alder** QMC for the uniform electron gas; **VWN** (1980) and **Perdew–Zunger** (1981) parametrise LDA correlation. Perdew–Zunger also introduces self-interaction correction.
1982 | **Perdew–Parr–Levy–Balduz**: piecewise linearity of $E(N)$ and the derivative discontinuity.
1984 | **Runge–Gross theorem**: foundation of time-dependent DFT.
1985 | **Car–Parrinello** molecular dynamics: unified electronic structure and MD, and popularised plane waves + pseudopotentials. Same era: norm-conserving pseudopotentials (Hamann–Schlüter–Chiang 1979), Kerker mixing (1981).
1986 | **Hybertsen–Louie** GW for semiconductor band gaps.
1988 | **Becke 88** exchange and **Lee–Yang–Parr** correlation: GGAs make DFT useful for chemistry.
1990 | **Vanderbilt ultrasoft pseudopotentials**. VASP development (Kresse, Hafner, Furthmüller) during the early 1990s.
1993 | **Becke's hybrid functionals** (half-and-half, then B3PW91); **B3LYP** (1994) becomes the most-cited functional in chemistry.
1994 | **Blöchl's projector augmented-wave (PAW)** method.
1996 | **PBE** GGA, built only from exact constraints, becomes the materials-science default. PBE0 rationale (Perdew–Ernzerhof–Burke). Kohn's **nearsightedness** principle (linear scaling).
1998 | **Nobel Prize in Chemistry**: Walter Kohn (DFT) and John Pople (computational methods in quantum chemistry, Gaussian).
2001 | Perdew's **Jacob's ladder** metaphor for the hierarchy of functionals.
2003–06 | **HSE** screened hybrid (2003/2006); **Grimme's D** dispersion corrections (D2 2006, D3 2010); vdW-DF non-local functional (2004); **double hybrids** (B2PLYP 2006); M06 family (2008).
2007 | **Behler–Parrinello** neural-network potentials: the first scalable ML interatomic potential.
2008 | **Mori-Sánchez, Cohen, Yang**: delocalisation error explains band-gap and barrier failures.
2010 | **GAP** (Gaussian approximation potentials, Bartók et al.).
2011–13 | **Materials Project** launched (open database of DFT-computed materials), along with AFLOW and OQMD. High-throughput DFT becomes a field.
2014 | **QM9** dataset; Δ-learning (2015). ML property prediction takes off.
2015 | **SCAN** meta-GGA satisfies all 17 known exact constraints for its rung.
2016 | **Δ-test** shows modern codes and pseudopotentials agree to ~1 meV/atom.
2017–18 | **SchNet**, **DeePMD**, **ANI**: deep-learning potentials; message-passing neural networks for molecules.
2020 | **FermiNet / PauliNet**: neural-network wavefunctions. **r2SCAN**. OC20 dataset (Open Catalyst Project).
2021 | **DM21** (DeepMind): learned functional trained on fractional charge/spin. **NequIP**: equivariant potentials with high data efficiency. Kohn–Sham-regulariser (differentiable DFT).
2022 | **MACE**, **Allegro**, **M3GNet**: equivariant and universal potentials.
2023 | **GNoME** (DeepMind) reports ~2.2M new candidate crystals; **CHGNet**, **MACE-MP-0** universal potentials; Matbench Discovery benchmark.
2024 | **OMat24** (Meta, ~110M calculations), **MatterSim**, Orb, eqV2. Foundation models for atoms become routine.
2025 | **MatterGen** (Microsoft, *Nature*): generative materials design; **Skala** (Microsoft): deep-learned xc functional near chemical accuracy at semilocal cost; **OMol25** and **UMA** (Meta): very large molecular data and a universal model across domains.
```

## Themes to take away

1. **Exact constraints vs fitting.** Perdew's non-empirical school (PBE, SCAN) and the empirical school (B3LYP, Minnesota, ωB97) have pushed each other for 30 years. ML functionals are the extreme of fitting, and the best ones (DM21, Skala) build in constraints or physically motivated training data.
2. **Algorithms matter as much as theory.** Car–Parrinello, iterative diagonalisation, PAW and Pulay mixing turned DFT from a theory into a tool. GPU acceleration and ML are the current versions of that.
3. **From single calculations to databases.** High-throughput DFT (Materials Project and successors) created the datasets that made materials ML possible. The data's systematic errors (PBE gaps, +U mixing) are now inherited by models.
4. **The present frontier.** Universal potentials that make DFT-quality simulation nearly free, learned functionals that may finally beat hand-designed ones, and generative models whose outputs DFT has to validate. All three depend on DFT, so understanding it deeply is more valuable now than before.

> [!INTERVIEW] A good closing answer to "Where is the field going?"
> Cheap, accurate surrogates (universal MLIPs) for dynamics and screening; better reference data (learned functionals, coupled-cluster and QMC datasets, neural wavefunctions) to raise the ceiling above PBE; long-range physics and charges in ML models; uncertainty quantification and active learning in production; and closing the loop with automated synthesis and characterisation (self-driving labs). Throughout, the hard part is *data quality and consistency*, not model architecture.

```quiz
? Who received the 1998 Nobel Prize in Chemistry related to DFT?
+ Walter Kohn and John Pople
- Pierre Hohenberg and Walter Kohn
- Lu Jeu Sham and Walter Kohn
- John Perdew and Axel Becke
= Kohn for density functional theory, Pople for computational methods in quantum chemistry.

? Which development made ab initio molecular dynamics practical in 1985?
+ The Car–Parrinello method
- The PBE functional
- The PAW method
- Behler–Parrinello neural networks
= Car and Parrinello propagated orbitals alongside nuclei with a fictitious Lagrangian, avoiding full SCF at every step.

? What was distinctive about the PBE functional (1996)?
+ Its parameters come from exact constraints rather than fits to molecular data
- It was the first hybrid functional
- It includes dispersion
- It was fitted to the G2 thermochemistry set
= PBE's $\kappa$ and $\mu$ come from the Lieb–Oxford bound and uniform-gas linear response.

? Order these chronologically: (A) Behler–Parrinello NN potentials, (B) B3LYP, (C) Kohn–Sham equations, (D) MACE
+ C, B, A, D
- B, C, A, D
- C, A, B, D
- A, C, B, D
= Kohn–Sham 1965, B3LYP 1994, Behler–Parrinello 2007, MACE 2022.
```

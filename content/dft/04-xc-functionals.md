# Exchange–correlation functionals

<p class="lede">All of DFT's practical success and failure goes through one object, $\Exc[n]$. This chapter builds the physical picture (the exchange–correlation hole), shows how each rung of "Jacob's ladder" adds ingredients, and ends with practical advice on choosing a functional.</p>

## The exchange–correlation hole

Write the electron–electron energy using the **pair density** $n_2(\vr,\vr')$, the probability density of finding one electron at $\vr$ and another at $\vr'$:

$$
W = \frac12\iint\frac{n_2(\vr,\vr')}{|\vr-\vr'|}\,\dd\vr\,\dd\vr', \qquad n_2(\vr,\vr') = n(\vr)\big[n(\vr') + n_{\text{xc}}(\vr,\vr')\big]
$$

$n_{\text{xc}}(\vr,\vr')$ is the **xc hole**: how much the presence of an electron at $\vr$ *depletes* the density at $\vr'$. Using the coupling-constant-averaged hole $\bar n_{\text{xc}}$ (next section), which also absorbs the kinetic part,

$$
\Exc = \frac12\iint\frac{n(\vr)\,\bar n_{\text{xc}}(\vr,\vr')}{|\vr-\vr'|}\,\dd\vr\,\dd\vr'
$$

So $\Exc$ is the electrostatic interaction of each electron with its own hole. Key exact properties:

- **Sum rule:** $\int n_{\text{xc}}(\vr,\vr')\,\dd\vr' = -1$. The hole contains exactly one missing electron.
- It splits into exchange (same spin, $\int n_{\text x} = -1$, $n_{\text x}\le 0$) and correlation ($\int n_{\text c}=0$: correlation only reshapes the hole).
- $\Exc$ depends only on the **spherical average** of the hole around each electron, because the Coulomb kernel depends only on $|\vr-\vr'|$.

> [!KEY] Why LDA works better than it has any right to
> LDA replaces the true hole with the hole of a uniform gas at the local density. That model hole satisfies the sum rule exactly and is a physically realisable hole. The energy depends only on the spherically averaged hole, so errors in the hole's *shape* largely cancel. This is the Gunnarsson–Lundqvist (1976) explanation, and a classic interview answer.

## The adiabatic connection

Imagine scaling the electron–electron interaction by $\lambda\in[0,1]$ while adjusting the external potential $v_\lambda$ so that **the density stays the same** for every $\lambda$. At $\lambda=0$ we have the KS system; at $\lambda=1$, the real one. Then (Harris–Jones, Langreth–Perdew, Gunnarsson–Lundqvist):

$$
\Exc = \int_0^1 W_\lambda\,\dd\lambda, \qquad W_\lambda = \langle\Psi_\lambda|\hat W|\Psi_\lambda\rangle - \EH[n]
$$

The integral over $\lambda$ automatically turns $T-\Ts$ into potential-energy form. At $\lambda=0$, $\Psi_0$ is the KS determinant and $W_0 = E_{\text x}$, the **exact exchange** energy evaluated with KS orbitals. This one fact motivates hybrid functionals:

```anim
adiabatic-connection
```

- Becke's **half-and-half** (1993): approximate the integral by the trapezoid $\frac12(W_0+W_1)$, with $W_0$ exact exchange and $W_1$ from LDA.
- **Perdew–Ernzerhof–Burke (1996):** if $W_\lambda^{\text{hyb}} = W_\lambda^{\text{DFA}} + (E_{\text x} - E_{\text x}^{\text{DFA}})(1-\lambda)^{n-1}$, integrating gives the mixing fraction $a = 1/n$. Fourth-order perturbation theory suggests $n\approx4$, hence **PBE0's ¼ exact exchange**.

## Rung 1: the local density approximation (LDA)

$$
\Exc^{\text{LDA}}[n] = \int n(\vr)\,\epsilon_{\text{xc}}^{\text{unif}}\big(n(\vr)\big)\,\dd\vr
$$

$\epsilon_{\text{xc}}^{\text{unif}}(n)$ is the xc energy per electron of the **uniform electron gas** (jellium) at density $n$. It is usually written in terms of the Wigner–Seitz radius $r_s = (3/4\pi n)^{1/3}$ (the radius of a sphere holding one electron).

- **Exchange** is analytic (Dirac/Slater): $\epsilon_{\text x}^{\text{unif}} = -\frac34\left(\frac3\pi\right)^{1/3}n^{1/3} = -\frac{0.4582}{r_s}$ Ha.
- **Correlation** has no closed form. It is a fit (Vosko–Wilk–Nusair 1980, Perdew–Zunger 1981, Perdew–Wang 1992) to the **Ceperley–Alder (1980) quantum Monte Carlo** energies of the electron gas, with known high- and low-density limits built in.
- Spin-polarised version (LSDA): interpolate between $\zeta=0$ and $\zeta=1$.

**Performance:** structures of solids are decent (lattice constants ~1–2 % too *small*), vibrational frequencies are OK, but molecules are **overbound** (atomisation energies off by ~1 eV, around 30+ kcal/mol). LDA is still used for some solid-state work and as the base of everything else.

## Rung 2: generalised gradient approximations (GGA)

Add the density gradient through the dimensionless **reduced gradient**:

$$
s = \frac{|\nabla n|}{2k_F n} = \frac{|\nabla n|}{2(3\pi^2)^{1/3}n^{4/3}}, \qquad
E_{\text x}^{\text{GGA}} = \int n\,\epsilon_{\text x}^{\text{unif}}(n)\,F_{\text x}(s)\,\dd\vr
$$

$s$ measures how fast the density varies on the scale of the local Fermi wavelength. It is small ($\lesssim 1$) in bonds and valence regions, and large in density tails and near surfaces. $F_{\text x}(s)$ is the **exchange enhancement factor**: $F_{\text x}=1$ is LDA.

A naive gradient expansion (GEA) makes things *worse*. Its hole violates the sum rule and has a spurious positive part. GGAs are not Taylor series; they are designed functions that restore the exact hole constraints. **PBE** (Perdew–Burke–Ernzerhof 1996) has

$$
F_{\text x}^{\text{PBE}}(s) = 1 + \kappa - \frac{\kappa}{1+\mu s^2/\kappa}, \qquad \kappa = 0.804,\ \mu = 0.2195
$$

Here $\kappa$ is set by the **Lieb–Oxford bound** ($F_{\text x}\le1.804$) and $\mu$ by matching the linear response of the uniform gas, which is what PBE correlation's gradient term cancels. PBE has **no empirical parameters fitted to molecules**. That is part of why it became the default for materials.

```anim
xc-enhancement
```

The family differs mostly in $F_{\text x}$:

| Functional | Philosophy | Use |
|---|---|---|
| **PBE** | Non-empirical, exact constraints | Default for solids and high-throughput databases (Materials Project, OQMD, OC20) |
| **PBEsol** | Restores the second-order gradient expansion ($\mu=10/81$) | Better lattice constants and surface energies of solids; worse molecules |
| **RPBE / revPBE** | Larger $\kappa$ or a different form | Better chemisorption and adsorption energies (catalysis, OC20 uses RPBE) |
| **BLYP** | Becke88 exchange (one parameter fitted to atoms) + Lee–Yang–Parr correlation | Molecular chemistry, liquid water MD (with dispersion) |

## Rung 3: meta-GGAs

Add the **kinetic-energy density** of the occupied orbitals, $\tau(\vr) = \frac12\sum_i f_i|\nabla\phi_i|^2$. The useful dimensionless variable is

$$
\alpha = \frac{\tau - \tau_W}{\tau_{\text{unif}}}, \qquad \tau_W = \frac{|\nabla n|^2}{8n}, \quad \tau_{\text{unif}} = \tfrac{3}{10}(3\pi^2)^{2/3}n^{5/3}
$$

- $\alpha = 0$: **single-orbital** region (e.g. a covalent bond's core, H atom). Here the functional can avoid one-electron self-interaction.
- $\alpha\approx1$: slowly varying, uniform-gas-like (metallic) region.
- $\alpha\gg1$: overlap of closed shells (weak bonds).

So meta-GGAs can tell different bonding environments apart. **SCAN** (Sun, Ruzsinszky, Perdew 2015) satisfies all 17 known exact constraints appropriate to a meta-GGA and is accurate for diverse bonding, but its numerics are touchy (it needs dense integration grids). **r2SCAN** (2020) restores smoothness while keeping most constraints, and is now favoured for high-throughput work (Materials Project added r2SCAN calculations). **M06-L** is an empirical alternative.

## Rung 4: hybrid functionals

Mix in a fraction of exact (HF-like) exchange computed from the KS orbitals.

**Global hybrids:**

$$
E_{\text{xc}}^{\text{PBE0}} = \tfrac14E_{\text x}^{\text{HF}} + \tfrac34E_{\text x}^{\text{PBE}} + E_{\text c}^{\text{PBE}}
$$

$$
E_{\text{xc}}^{\text{B3LYP}} = E_{\text{xc}}^{\text{LDA}} + a_0(E_{\text x}^{\text{HF}} - E_{\text x}^{\text{LDA}}) + a_x\,\Delta E_{\text x}^{\text{B88}} + a_c(E_{\text c}^{\text{LYP}} - E_{\text c}^{\text{VWN}}), \quad a_0=0.20,\ a_x=0.72,\ a_c=0.81
$$

B3LYP's three parameters were fitted to thermochemistry. It is by far the most cited functional in chemistry, but it fails for metals and lacks dispersion.

**Range-separated hybrids:** split the Coulomb operator,

$$
\frac1r = \underbrace{\frac{\operatorname{erfc}(\omega r)}{r}}_{\text{short range}} + \underbrace{\frac{\operatorname{erf}(\omega r)}{r}}_{\text{long range}}
$$

and treat each part differently:

- **Screened (HSE06):** exact exchange only at *short* range ($\omega=0.11\,a_0^{-1}$, 25 %). In solids the long-range exchange is screened anyway. It is cheaper than PBE0 in plane-wave codes (the long-range part converges slowly in k), and gaps of semiconductors are much better (Si ≈ 1.2 eV vs PBE 0.6 eV).
- **Long-range corrected (LC-ωPBE, CAM-B3LYP, ωB97X-D/V):** 100 % exact exchange at *long* range restores the $-1/r$ asymptotic potential. That is important for charge-transfer excitations, Rydberg states and polarisabilities.

**Cost:** exact exchange formally scales as $O(N^4)$ and in plane-wave codes costs 10–100× more than GGA. Gaussian-basis codes handle it more naturally (integral screening, RIJCOSX).

## Rung 5: double hybrids and RPA

Use **unoccupied** orbitals as well, through perturbative correlation:

$$
E_{\text{xc}}^{\text{DH}} = a_xE_{\text x}^{\text{HF}} + (1-a_x)E_{\text x}^{\text{DFA}} + (1-a_c)E_{\text c}^{\text{DFA}} + a_c E_{\text c}^{\text{MP2}}
$$

B2PLYP (2006), DSD-PBEP86 and revDSD variants approach ~1–2 kcal/mol on main-group thermochemistry. The **random-phase approximation (RPA)** correlation energy, from the adiabatic-connection fluctuation–dissipation theorem, includes long-range dispersion naturally and works for metals and solids, at $O(N^4)$ cost with resolution of identity.

```anim
jacobs-ladder
```

## Dispersion (van der Waals)

Dispersion comes from correlated charge fluctuations between distant fragments, $E\sim -C_6/R^6$. Semilocal functionals depend only on the density *near* each point, so they **cannot** describe this non-local correlation; neither can global hybrids. Layered materials, molecular crystals, physisorption, protein–ligand binding and liquids all need a correction.

| Approach | Idea | Examples |
|---|---|---|
| Pairwise atom–atom | $E_{\text{disp}} = -\sum_{A<B}\sum_{n=6,8} s_n\frac{C_n^{AB}}{R_{AB}^n}f_{\text{damp}}(R_{AB})$ | Grimme **D2**, **D3(BJ)**, **D4** (charge-dependent $C_6$); Tkatchenko–Scheffler (TS) |
| Many-body | Coupled fluctuating dipoles | MBD (many-body dispersion) |
| Non-local functional | $E_{\text c}^{\text{nl}} = \frac12\iint n(\vr)\Phi(\vr,\vr')n(\vr')$ | vdW-DF, vdW-DF2, rVV10, SCAN+rVV10, ωB97X-V |

The damping function $f_{\text{damp}}$ switches the correction off at short range, where the functional already describes correlation. Pairing matters: D3 parameters are fitted per functional (PBE-D3, B3LYP-D3(BJ)). D3 corrections are cheap and analytic, which is also why ML potentials often add them separately as a physics-based long-range term.

## Exact constraints (and why non-empirical people care)

A non-empirical functional is built to satisfy known exact properties:

- Uniform-gas limit (recover LDA when $\nabla n=0$)
- Correct second-order gradient expansion for slowly varying densities (PBEsol, SCAN)
- Hole sum rules; negativity of the exchange hole
- Lieb–Oxford bound
- Uniform coordinate scaling: $E_{\text x}[n_\gamma] = \gamma E_{\text x}[n]$ for $n_\gamma(\vr) = \gamma^3n(\gamma\vr)$
- Spin scaling: $E_{\text x}[n_\uparrow,n_\downarrow] = \frac12(E_{\text x}[2n_\uparrow]+E_{\text x}[2n_\downarrow])$
- One-electron limit: $\Exc[n_{1e}] = -\EH[n_{1e}]$ (no self-interaction)
- Piecewise linearity in $N$ and the derivative discontinuity, which *no* semilocal functional satisfies

The other philosophy, **empirical fitting** (Minnesota M06 family, ωB97 family; Mardirossian & Head-Gordon used combinatorial searches over large databases), gives excellent accuracy within the training domain. ML functionals (DM21, Skala; Chapter 8) push this further while trying to keep constraints.

> [!INTERVIEW] "Which functional would you use for…?"
> - **High-throughput bulk materials:** PBE (database consistency) or r2SCAN; PBE+U for transition-metal oxides (Materials Project-style).
> - **Band gaps:** HSE06, or GW on top of PBE.
> - **Organic molecules, thermochemistry:** a modern hybrid with dispersion, e.g. ωB97X-D/V, B3LYP-D3(BJ) (with a decent basis, def2-TZVP), or a double hybrid for benchmarks.
> - **Surfaces/catalysis:** RPBE or BEEF-vdW (comes with error estimates), PBE+D3 for adsorption.
> - **Layered materials and molecular crystals:** always add dispersion (D3/D4, MBD, or rVV10).
> - **Charge-transfer excitations (TDDFT):** a range-separated hybrid.

## Summary

- $\Exc$ = interaction of each electron with its xc hole; the hole obeys exact sum rules.
- The adiabatic connection shows that $\lambda=0$ is exact exchange, which is the rationale for hybrids (¼ in PBE0).
- LDA → GGA ($s$) → meta-GGA ($\tau$/$\alpha$) → hybrid (exact exchange) → double hybrid/RPA (virtual orbitals): more accuracy, more cost.
- Dispersion is missing from semilocal functionals and needs D3/D4/MBD or non-local corrections.

```quiz
? What does the xc hole sum rule state?
+ The hole integrates to exactly −1 electron
- The hole integrates to zero
- The hole is everywhere negative
- The hole equals the Hartree potential
= $\int n_{\text{xc}}(\vr,\vr')\dd\vr' = -1$. The exchange hole alone integrates to −1; the correlation hole integrates to 0.

? Why can LDA be accurate even though real densities are far from uniform?
+ Its model hole obeys the sum rule, and only the spherically averaged hole matters for the energy
- Real densities are actually nearly uniform
- Its parameters are fitted to molecular data
- It includes exact exchange
= LDA's hole comes from a real physical system, so it satisfies exact constraints. Energy depends only on the spherical average, so errors in the hole's shape cancel.

? In the adiabatic connection, $W_{\lambda=0}$ equals
+ The exact exchange energy of the KS determinant
- The correlation energy
- The Hartree energy
- The LDA exchange–correlation energy
= At $\lambda=0$ the wavefunction is the KS Slater determinant, and its $\langle \hat W\rangle - \EH$ is exactly the exchange energy. This is the basis for hybrids.

? What is the role of $\kappa = 0.804$ in PBE?
+ It enforces the Lieb–Oxford bound, $F_{\text x}\le 1.804$
- It was fitted to atomisation energies of the G2 set
- It sets the fraction of exact exchange
- It is the range-separation parameter
= $F_{\text x}^{\text{PBE}} \to 1+\kappa$ as $s\to\infty$, and $\kappa$ is chosen so that this limit respects the (local) Lieb–Oxford bound.

? HSE06 is popular for solids mainly because…
+ It applies exact exchange only at short range, making it cheaper and better behaved in periodic systems while improving gaps
- It has no exact exchange
- It includes long-range dispersion
- It is a double hybrid
= Long-range exact exchange converges slowly with k-points and is screened in real solids anyway. HSE truncates it with erfc(ωr).

? The meta-GGA variable $\alpha$ is zero in…
+ Single-orbital (iso-orbital) regions
- Uniform-density regions
- Regions where two closed shells overlap weakly
- Any region with a node
= With one orbital, $\tau = \tau_W$, so $\alpha=0$. This lets meta-GGAs recognise one-electron regions and reduce self-interaction there.

? Why do semilocal functionals miss dispersion?
+ Dispersion is a non-local correlation effect between separated densities; semilocal functionals only see local density information
- Dispersion is an exchange effect
- They lack a Hartree term
- Dispersion only matters for metals
= $-C_6/R^6$ arises from correlated fluctuations of distant fragments. Nothing in $n(\vr)$, $\nabla n(\vr)$ or $\tau(\vr)$ at a single point knows about a distant fragment.

? Which statement about PBEsol is correct?
+ It restores the second-order gradient expansion and improves lattice constants of solids
- It improves atomisation energies of molecules over PBE
- It includes 25 % exact exchange
- It is fitted to molecular thermochemistry
= $\mu = 10/81$ (the gradient-expansion value) is better for slowly varying densities (solids, surfaces), at the cost of molecular binding energies.

? A double-hybrid functional requires (select all)
+ Occupied orbitals
+ Unoccupied (virtual) orbitals
- Wavefunction amplitudes from coupled cluster
- Only the density and its gradient
= The MP2-like correlation term needs virtual orbitals, making cost $O(N^5)$ (or $O(N^4)$ with RI).
```

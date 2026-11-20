# Hands-on: write a Kohn–Sham solver

<p class="lede">Nothing makes the Kohn–Sham equations concrete like writing them yourself. The 1D code below is about 50 lines of NumPy and contains every ingredient of a production code: a basis/grid, kinetic and potential operators, Hartree and xc potentials, diagonalisation, occupation, mixing and a convergence test. Then we run real calculations with PySCF, ASE + Quantum ESPRESSO, and a universal ML potential.</p>

## A complete 1D Kohn–Sham code

The model: $N$ electrons in 1D, an external potential $\vext(x)$, a **soft-Coulomb** interaction $1/\sqrt{(x-x')^2+1}$ (the bare $1/|x|$ diverges in 1D), and a toy exchange potential that applies the 3D LDA formula to the 1D density. Real 1D studies use a proper 1D-LDA fitted to 1D-gas QMC, but the structure of the code is identical.

```python
import numpy as np

# ---------- grid and operators ----------
L, M = 10.0, 201                       # box [-L, L] (bohr), number of grid points
x = np.linspace(-L, L, M)
h = x[1] - x[0]

# kinetic energy -1/2 d^2/dx^2 with second-order finite differences (psi = 0 at walls)
T = (np.diag(np.full(M, 1.0)) - 0.5 * np.diag(np.ones(M - 1), 1) - 0.5 * np.diag(np.ones(M - 1), -1)) / h**2

# ---------- system: N electrons in a harmonic trap ----------
N = 4
v_ext = 0.5 * 0.25 * x**2              # omega = 0.5

# soft-Coulomb interaction 1/sqrt(dx^2 + 1)
K = 1.0 / np.sqrt((x[:, None] - x[None, :])**2 + 1.0)

def hartree(n):
    v = K @ n * h
    return v, 0.5 * np.sum(n * v) * h

def lda_x(n):
    """Toy 'LDA' exchange: the 3D formula applied to the 1D density."""
    c = (3.0 / np.pi) ** (1 / 3)
    n13 = np.cbrt(np.maximum(n, 0.0))
    return -c * n13, -0.75 * c * np.sum(n * n13) * h

def solve(v_eff):
    eps, phi = np.linalg.eigh(T + np.diag(v_eff))
    phi = phi / np.sqrt(h)              # normalise: sum |phi|^2 h = 1
    occ = phi[:, : N // 2]              # doubly occupied orbitals
    return eps[: N // 2], occ, 2.0 * np.sum(occ**2, axis=1)

# ---------- SCF loop with linear mixing ----------
n = solve(v_ext)[2]                     # start from non-interacting density
alpha = 0.5
for it in range(200):
    vH, EH = hartree(n)
    vx, Ex = lda_x(n)
    v_eff = v_ext + vH + vx
    eps, occ, n_out = solve(v_eff)
    res = np.sqrt(np.sum((n_out - n)**2) * h)
    # total energy at the input density (double-counting form)
    E = 2 * eps.sum() - EH - np.sum(vx * n) * h + Ex
    print(f"iter {it:3d}   E = {E: .8f} Ha   |n_out - n_in| = {res:.2e}")
    if res < 1e-8:
        break
    n = n + alpha * (n_out - n)

print("eigenvalues (Ha):", np.round(eps, 5))
print("electrons:", np.sum(n) * h)
```

Output (abridged):

```text
iter   0   E =  4.04079500 Ha   |n_out - n_in| = 4.60e-01
iter   1   E =  4.05699457 Ha   |n_out - n_in| = 1.83e-01
...
iter  28   E =  4.06047459 Ha   |n_out - n_in| = 7.81e-09
eigenvalues (Ha): [1.76677 2.0844 ]
electrons: 4.0
```

### How each line maps onto the theory

| Code | Theory |
|---|---|
| `T` (tridiagonal matrix) | $-\frac12\nabla^2$ in a finite-difference basis. Plane-wave codes use $\frac12\lvert\vk+\vG\rvert^2$, which is diagonal. |
| `hartree` | $v_{\mathrm H} = \int n(x')\,w(x-x')\,\dd x'$, $\EH = \frac12\int n\,v_{\mathrm H}$. In 3D periodic codes: $4\pi n(\vG)/G^2$ via FFT. |
| `lda_x` | $\vxc = \delta \Exc/\delta n$ and $\Exc$ for a local functional |
| `np.linalg.eigh` | Diagonalisation. Big codes use iterative Davidson/RMM-DIIS for only the lowest bands. |
| `2.0 * sum(occ**2)` | Aufbau occupation, spin-degenerate: $n = 2\sum_{i\le N/2}\lvert\phi_i\rvert^2$ |
| `E = 2*eps.sum() - EH - ...` | Total energy with double-counting corrections |
| `n + alpha*(n_out - n)` | Linear mixing |

### Exercises

1. **Pulay mixing.** Replace linear mixing with Pulay/DIIS over the last 6 iterations. How many iterations now?
2. **Check the variational principle.** Perturb the converged density slightly (keeping $\int n = N$) and evaluate the KS energy functional $E[n]$. It should increase.
3. **Koopmans/Janak.** Give the HOMO a fractional occupation $f$ and plot $E(f)$. Is it linear? What does the slope equal?
4. **Self-interaction.** Set $N=1$ (you need odd-$N$ handling: one orbital with occupation 1). Compare $\EH + E_x$ with zero, which the exact functional gives for one electron.
5. **Hartree–Fock.** Replace `lda_x` with the non-local exchange operator $-\sum_j\phi_j(x)\phi_j(x')w(x-x')$ and compare densities.

<details>
<summary>Solution to exercise 1 (Pulay mixing, converges in 8 iterations instead of 28)</summary>

```python
def pulay_mix(hist_n, hist_r, alpha=0.5):
    m = len(hist_r)
    B = -np.ones((m + 1, m + 1)); B[m, m] = 0.0
    for i in range(m):
        for j in range(m):
            B[i, j] = np.sum(hist_r[i] * hist_r[j]) * h
    rhs = np.zeros(m + 1); rhs[m] = -1.0
    c = np.linalg.solve(B, rhs)[:m]          # minimise |sum c_i R_i| with sum c_i = 1
    return sum(ci * (ni + alpha * ri) for ci, ni, ri in zip(c, hist_n, hist_r))

n = solve(v_ext)[2]
hist_n, hist_r = [], []
for it in range(100):
    vH, EH = hartree(n); vx, Ex = lda_x(n)
    eps, occ, n_out = solve(v_ext + vH + vx)
    r = n_out - n
    res = np.sqrt(np.sum(r**2) * h)
    print(f"iter {it:3d}   |R| = {res:.2e}")
    if res < 1e-8:
        break
    hist_n.append(n); hist_r.append(r)
    hist_n, hist_r = hist_n[-6:], hist_r[-6:]
    n = pulay_mix(hist_n, hist_r)
```

</details>

## Molecules with PySCF

[PySCF](https://pyscf.org) is a Python quantum-chemistry package that is popular in ML research because everything is accessible from Python. Install with `pip install pyscf`.

```python
from pyscf import gto, dft

mol = gto.M(
    atom="""O  0.000  0.000  0.000
            H  0.000 -0.757  0.587
            H  0.000  0.757  0.587""",
    basis="def2-tzvp",
)

for xc in ["lda,vwn", "pbe", "b3lyp", "pbe0"]:
    mf = dft.RKS(mol)
    mf.xc = xc
    e = mf.kernel()
    homo = mf.mo_energy[mol.nelectron // 2 - 1]
    print(f"{xc:8s}  E = {e:.6f} Ha   -e_HOMO = {-homo * 27.2114:.2f} eV")

# Nuclear gradients (forces = -gradient) for the last functional
g = mf.nuc_grad_method().kernel()
```

Things to observe: $-\varepsilon_{\text{HOMO}}$ for LDA/PBE is several eV below water's experimental ionisation energy (~12.6 eV), while hybrids are closer, because exact exchange reduces self-interaction. Try `mol.basis = 'sto-3g'` to see basis-set incompleteness, and compute an atomisation energy (remember open-shell atoms need `dft.UKS` and `mol.spin`).

## Solids with ASE + Quantum ESPRESSO

[ASE](https://wiki.fysik.dtu.dk/ase/) builds structures and drives codes. This is the typical equation-of-state workflow for the lattice constant of silicon (requires `pw.x` and a pseudopotential, e.g. from SSSP):

```python
import numpy as np
from ase.build import bulk
from ase.calculators.espresso import Espresso, EspressoProfile
from ase.eos import EquationOfState

profile = EspressoProfile(command="pw.x", pseudo_dir="./pseudo")
calc = Espresso(
    profile=profile,
    pseudopotentials={"Si": "Si.pbe-n-rrkjus_psl.1.0.0.UPF"},
    input_data={"system": {"ecutwfc": 40, "ecutrho": 320}},   # Rydberg
    kpts=(8, 8, 8),
)

volumes, energies = [], []
for a in np.linspace(5.30, 5.60, 7):
    si = bulk("Si", "diamond", a=a)
    si.calc = calc
    volumes.append(si.get_volume())
    energies.append(si.get_potential_energy())

eos = EquationOfState(volumes, energies)
v0, e0, B = eos.fit()
a0 = (4 * v0) ** (1 / 3)              # FCC primitive cell holds a^3/4
print(f"a0 = {a0:.3f} Å   (PBE ~5.47, experiment 5.431)   B = {B * 160.2:.0f} GPa")
```

Expected: PBE overestimates the lattice constant by ~0.7 %. Repeat with an LDA pseudopotential to see it underestimate. Then converge `ecutwfc` and `kpts` as in [Chapter 6](06-practice.md).

## The same thing with a universal ML potential

```python
from ase.build import bulk
from ase.filters import FrechetCellFilter
from ase.optimize import BFGS
from mace.calculators import mace_mp     # pip install mace-torch

si = bulk("Si", "diamond", a=5.3)
si.calc = mace_mp(model="medium")         # trained on PBE/PBE+U MPtrj data
BFGS(FrechetCellFilter(si)).run(fmax=1e-3)
print("a0 =", round(si.cell.cellpar()[0] * 2**0.5, 3), "Å")
```

It takes seconds instead of minutes, and the answer should be near the **PBE** value, not experiment, because the model learned PBE. That is the single most important thing to understand about ML potentials: they inherit the errors of their training functional.

## Where to go next

- *Electronic Structure: Basic Theory and Practical Methods*, R. M. Martin, the standard reference.
- *A Chemist's Guide to Density Functional Theory*, Koch & Holthausen, a gentle chemical perspective.
- *The ABC of DFT*, K. Burke (free online), conceptual and rigorous.
- *Density Functional Theory: A Practical Introduction*, Sholl & Steckel, practical and short.
- Documentation and tutorials for Quantum ESPRESSO, VASP wiki, PySCF examples, MACE and the Open Catalyst Project.

```quiz
? In the 1D code, why is the eigenvector array divided by `np.sqrt(h)`?
+ `eigh` returns vectors normalised as $\sum_i|c_i|^2=1$, but we need $\sum_i|\phi(x_i)|^2h=1$
- To convert from Rydberg to Hartree
- To impose periodic boundary conditions
- To make the density positive
= Discrete normalisation must include the grid spacing to approximate $\int|\phi|^2\dd x = 1$.

? Why is a soft-Coulomb interaction used in 1D?
+ The bare $1/|x|$ interaction gives divergent integrals in 1D
- It is cheaper to compute
- It reproduces 3D Coulomb exactly
- It removes self-interaction
= $\int \dd x/|x|$ diverges logarithmically at the origin, so the $+1$ softening regularises it.

? A universal MLIP trained on PBE data relaxes silicon. Its lattice constant should be closest to…
+ The PBE value (~5.47 Å)
- The experimental value (5.431 Å)
- The LDA value (~5.40 Å)
- The HSE value
= ML potentials learn their training functional, including its systematic errors.

? In the double-counting energy expression used in the code, which terms are subtracted from the band energy?
+ The Hartree energy and $\int \vxc n$
- The kinetic energy
- The external potential energy
- Nothing is subtracted
= $E = \sum f_i\varepsilon_i - \EH - \int\vxc n + \Exc$.
```

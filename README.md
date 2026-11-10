# RF curriculum (Pozar & Balanis)

A self-study repo for an RF / microwave engineer who already has an ASU MS and
THz-imaging thesis work, including hands-on \(S_{11}\) with a WR3.4 VNA
extender (220–330 GHz). It is organized around the chapter structure of

- David M. Pozar, *Microwave Engineering*, 4th ed.
- Constantine A. Balanis, *Antenna Theory: Analysis and Design*, 4th ed.

The notes are **original study sheets**, written from first principles and
tied, where it is natural, to waveguide VNAs and THz bench practice. They
cite the chapter (and the usual section grouping) each topic corresponds to.
They are **not** a transcription of either book: no book prose, figures, or
end-of-chapter problems are reproduced. Keep the textbooks next to the repo
and use the notes as a map, a formula sheet, and a worked-example companion.

## What is in here

```
README.md                 this file
requirements.txt          numpy, matplotlib
modules/                  one Markdown study sheet per unit
quiz/questions.json       original review items (150+)
quiz/quiz.py              offline spaced-repetition CLI (Leitner)
quiz/progress.json        your review state (starts empty)
quiz/verify_calcs.py      independent numerical check of every calc item
tools/smith_gamma.py      Γ, VSWR, return loss, Zin(ℓ)
tools/microstrip_width.py W/h synthesis and analysis
tools/array_factor.py     uniform linear array factor and HPBW
```

## How to use the repo

1. Skim the week's modules (list below) with the corresponding book chapters
   open. Attempt each worked example before reading the solution line.
2. Run the helpers when a number comes up:
   `python tools/smith_gamma.py --z 100+50j --z0 50 --length-deg 60`
   `python tools/microstrip_width.py --z0 50 --er 3.66 --h-mm 0.203 --freq-ghz 10`
   `python tools/array_factor.py --n 8 --d 0.5`
3. Quiz yourself offline, every day you study:
   `python quiz/quiz.py --daily 5`
   In a real terminal the CLI shows a card, waits for you to judge yes/no,
   then reveals the official answer and updates `quiz/progress.json`.
4. Check how you are doing: `python quiz/quiz.py stats`
   Drill a particular unit: `python quiz/quiz.py grade --n 8 --module 04-network-analysis-sparams`
5. After you change any calc item, run `python quiz/verify_calcs.py`.

Python 3.9+ with `numpy` and `matplotlib` is enough (`pip install -r requirements.txt`).
All quiz and tool paths are resolved relative to the files themselves, so you
can launch them from the repo root or from another working directory.

## Rough 12-week plan

The pace assumes a working engineer reviewing, not a first course: about four
to six focused hours a week, plus a short daily quiz. Microwave (Pozar) and
antennas (Balanis) are interleaved so that \(S\)-parameters, apertures, and
link budgets meet each other before the final measurement week. Week 9 of
Pozar (ferrites) is optional and parked in week 12.

| Week | Microwave unit(s) | Antenna unit(s) | Emphasis |
|------|-------------------|-----------------|----------|
| 1 | [01](modules/01-em-review.md), [02](modules/02-transmission-lines.md) | Skim [a1](modules/a1-antenna-fundamentals.md) definitions | Maxwell, plane waves, skin depth; \(\Gamma\), VSWR, Smith chart |
| 2 | [03](modules/03-lines-and-waveguides.md) | [a1](modules/a1-antenna-fundamentals.md) in full | WR-90 / WR3.4 TE\(_{10}\); directivity, gain, \(A_e\), far-field criterion |
| 3 | [04](modules/04-network-analysis-sparams.md) | [a2](modules/a2-radiation-integrals.md) | \(S_{ij}\), unitarity, \(\Gamma_\text{in}\); radiation integral, equivalence |
| 4 | [05](modules/05-matching-tuning.md) | [a3](modules/a3-dipoles-monopoles.md) | \(\lambda/4\) and L-section / stubs; Hertzian and half-wave dipole |
| 5 | [06](modules/06-resonators.md) | [a4](modules/a4-loops.md) | \(Q_0,Q_L,\kappa\); small-loop \(R_r\) |
| 6 | [07](modules/07-power-dividers-couplers.md) | [a5](modules/a5-arrays.md) (start) | Wilkinson, branch-line; uniform array factor |
| 7 | [08](modules/08-filters.md) | [a5](modules/a5-arrays.md) (finish), [a6](modules/a6-aperture-horns.md) | Prototypes, distributed filters; horns, aperture efficiency |
| 8 | [10](modules/10-noise-nonlinear.md) | [a7](modules/a7-reflectors.md) | Friis NF, IP3; paraboloid gain, Ruze, \(2D^2/\lambda\) |
| 9 | [11](modules/11-active-devices-amplifiers.md) | [a8](modules/a8-microstrip-patch.md) | \(G_T\), \(K\)-\(\Delta\), MAG vs noise match; patch cavity model |
| 10 | [12](modules/12-oscillators-mixers.md) | [a9](modules/a9-broadband-frequency-independent.md) | Negative resistance, conversion loss; spirals, LPDA, helix |
| 11 | [13](modules/13-systems-link-budgets.md) | [a10](modules/a10-measurements.md) | Link, radar, radiometer NEDT; gain by Friis, near-field notes |
| 12 | [09](modules/09-ferrites-optional.md) (optional) + review | Mixed review | Isolators/circulators; a full WR3.4 measurement equation |

Daily, even on a light day, do five quiz cards. On review days (week 12, or
any Friday) run `python quiz/quiz.py grade --n 15` and then `stats`.

## How the daily quiz works

`quiz/quiz.py` implements **Leitner boxes** on the local question bank, with
state in `quiz/progress.json`. Nothing is sent to a network.

- New cards start in box 1 and are due immediately.
- A card you mark correct moves up one box (maximum box 5) and is scheduled
  out by 1, 3, 7, 14, or 30 days according to the box it *lands in*.
- A miss returns the card to box 1, due tomorrow.
- `--daily N` draws up to \(N\) due cards first (lowest box, then oldest
  due date), then unseen cards, and only then (if you still need more) the
  soonest future reviews, so a daily session always has work to do.
- A study streak increments when you complete a session on consecutive
  calendar days and resets if you skip a day.

Useful commands:

```
python quiz/quiz.py --daily 5
python quiz/quiz.py --daily 5 --module 03-lines-and-waveguides
python quiz/quiz.py stats
python quiz/quiz.py due
python quiz/quiz.py grade --n 10
python quiz/quiz.py reset --yes          # wipe progress
python quiz/verify_calcs.py
```

`grade` is a scored drill (default 10 cards) that still updates the Leitner
state unless you pass `--dry-run`. In a non-interactive environment (piped
stdin, CI) `--daily` and `grade` print the selected prompts and exit without
blocking, so the CLI is safe to smoke-test.

The same `questions.json` is the source for any later daily prompt from a
chat bot or a cron job: keep the answers in the repo, and let the bot only
ask, not replace, this offline trainer.

## Conventions

- Worked examples use \(c=3.00\times10^8\) m/s unless a line explicitly uses
  the SI exact value \(2.99792458\times10^8\) m/s. Free-space impedance is
  \(\eta_0=376.73~\Omega\), sometimes rounded to \(120\pi\approx377~\Omega\).
- WR-3.4 is taken as \(a=0.034\) in \(=0.8636\) mm, \(b=0.017\) in, so
  TE\(_{10}\) cutoff is \(173.69\) GHz and the recommended band is
  220–330 GHz.
- \(S\)-parameters are in the usual power-wave, real-\(Z_0\) normalization.
  Waveguide measurements are referred to the TE\(_{10}\) calibration at the
  flange unless noted.

## License of *this* repo

The notes, questions, and tools in this repository are original material for
private study. They are not a substitute for, and should not be redistributed
as, either textbook.

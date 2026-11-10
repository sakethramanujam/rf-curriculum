#!/usr/bin/env python3
"""Local spaced-repetition quiz for the RF curriculum (Leitner boxes).

Usage (from the repo root or anywhere):
    python quiz/quiz.py --daily 5
    python quiz/quiz.py stats
    python quiz/quiz.py grade [--n 10] [--module MODULE]
    python quiz/quiz.py due
    python quiz/quiz.py reset [--yes]

Progress is stored in quiz/progress.json so you can study offline, with no
network and no bot. New cards start in box 1. A correct answer promotes the
card one box (max 5) and schedules it further out. A miss returns the card
to box 1, due tomorrow.

In a non-interactive terminal (piped or CI), --daily prints the selected
cards and exits without waiting for answers.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
QUESTIONS_PATH = ROOT / "questions.json"
PROGRESS_PATH = ROOT / "progress.json"

# Leitner intervals in days, keyed by the box a card *lands in* after grading.
INTERVALS = {1: 1, 2: 3, 3: 7, 4: 14, 5: 30}
MAX_BOX = 5
SCHEMA_VERSION = 1


def today() -> date:
    return date.today()


def parse_day(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def iso(d: date | None) -> str | None:
    return d.isoformat() if d else None


def load_questions() -> list[dict[str, Any]]:
    with QUESTIONS_PATH.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise SystemExit(f"Expected a list in {QUESTIONS_PATH}")
    return data


def load_progress() -> dict[str, Any]:
    if not PROGRESS_PATH.exists():
        return empty_progress()
    with PROGRESS_PATH.open(encoding="utf-8") as fh:
        data = json.load(fh)
    data.setdefault("cards", {})
    data.setdefault("streak", 0)
    data.setdefault("last_study_date", None)
    data.setdefault("version", SCHEMA_VERSION)
    return data


def empty_progress() -> dict[str, Any]:
    return {
        "cards": {},
        "streak": 0,
        "last_study_date": None,
        "version": SCHEMA_VERSION,
    }


def save_progress(progress: dict[str, Any]) -> None:
    tmp = PROGRESS_PATH.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(progress, fh, indent=2, sort_keys=False)
        fh.write("\n")
    tmp.replace(PROGRESS_PATH)


def ensure_card(progress: dict[str, Any], qid: str, now: date) -> dict[str, Any]:
    cards = progress["cards"]
    if qid not in cards:
        cards[qid] = {
            "box": 1,
            "due": iso(now),
            "last_seen": None,
            "history": [],
        }
    return cards[qid]


def is_due(card: dict[str, Any], now: date) -> bool:
    due = parse_day(card.get("due"))
    return due is None or due <= now


def select_daily(
    questions: list[dict[str, Any]],
    progress: dict[str, Any],
    n: int,
    now: date,
    module: str | None = None,
    rng: random.Random | None = None,
) -> list[dict[str, Any]]:
    rng = rng or random.Random()
    pool = questions
    if module:
        pool = [q for q in questions if q.get("module") == module]
        if not pool:
            raise SystemExit(f"No questions found for module {module!r}")

    due: list[dict[str, Any]] = []
    new: list[dict[str, Any]] = []
    later: list[dict[str, Any]] = []
    for q in pool:
        qid = q["id"]
        card = progress["cards"].get(qid)
        if card is None:
            new.append(q)
        elif is_due(card, now):
            due.append(q)
        else:
            later.append(q)

    # Due cards first (lowest box first, then oldest due date), then unseen.
    def due_key(q: dict[str, Any]) -> tuple:
        card = progress["cards"][q["id"]]
        return (int(card.get("box", 1)), card.get("due") or "")

    due.sort(key=due_key)
    rng.shuffle(new)

    chosen = (due + new)[:n]
    # If everything is scheduled out and the user still asked for N cards,
    # fill from the soonest upcoming reviews so a daily session always runs.
    if len(chosen) < n and later:
        later.sort(key=lambda q: progress["cards"][q["id"]].get("due") or "")
        chosen.extend(later[: n - len(chosen)])
    return chosen


def update_streak(progress: dict[str, Any], now: date) -> None:
    last = parse_day(progress.get("last_study_date"))
    if last == now:
        return
    if last == now - timedelta(days=1):
        progress["streak"] = int(progress.get("streak", 0)) + 1
    else:
        progress["streak"] = 1
    progress["last_study_date"] = iso(now)


def grade_card(card: dict[str, Any], correct: bool, now: date) -> None:
    box = int(card.get("box", 1))
    if correct:
        box = min(box + 1, MAX_BOX)
    else:
        box = 1
    card["box"] = box
    card["due"] = iso(now + timedelta(days=INTERVALS[box]))
    card["last_seen"] = iso(now)
    history = list(card.get("history") or [])
    history.append({"date": iso(now), "correct": bool(correct)})
    card["history"] = history[-50:]


def interactive() -> bool:
    return sys.stdin.isatty() and sys.stdout.isatty()


def print_card(i: int, total: int, q: dict[str, Any], show_answer: bool = False) -> None:
    print()
    print("=" * 64)
    print(f"[{i}/{total}]  {q['id']}   module={q['module']}   "
          f"topic={q['topic']}   difficulty={q['difficulty']}   type={q['type']}")
    print("-" * 64)
    print(q["question"].rstrip())
    if show_answer:
        print()
        print("ANSWER:")
        print(q["answer"].rstrip())
        print(f"Ref: {q.get('ref', '')}")


def prompt_self_grade() -> bool | None:
    """Return True (correct), False (miss), or None (skip/quit)."""
    while True:
        try:
            raw = input("Your answer (then Enter). Or s=skip, q=quit: ").strip()
        except EOFError:
            return None
        if raw.lower() in {"q", "quit"}:
            return None
        if raw.lower() in {"s", "skip"}:
            print("  Skipped (no schedule change).")
            return "skip"  # type: ignore[return-value]
        input("Press Enter to show the official answer...")
        return raw  # type: ignore[return-value]


def prompt_correctness() -> bool | None:
    while True:
        try:
            raw = input("Did you get it? [y]es / [n]o / [s]kip / [q]uit: ").strip().lower()
        except EOFError:
            return None
        if raw in {"y", "yes"}:
            return True
        if raw in {"n", "no"}:
            return False
        if raw in {"s", "skip"}:
            return "skip"  # type: ignore[return-value]
        if raw in {"q", "quit"}:
            return None
        print("  Please type y, n, s, or q.")


def run_session(
    cards: list[dict[str, Any]],
    progress: dict[str, Any],
    now: date,
    update: bool,
    dry_run: bool,
) -> dict[str, int]:
    tallies = {"correct": 0, "wrong": 0, "skipped": 0}
    if not cards:
        print("No cards to quiz.")
        return tallies

    if dry_run or not interactive():
        print(f"Selected {len(cards)} card(s) for {iso(now)}"
              + (" (dry run)" if dry_run else " (non-interactive; answers hidden)"))
        for i, q in enumerate(cards, 1):
            print_card(i, len(cards), q, show_answer=False)
        print()
        print("Re-run in an interactive terminal to grade yourself.")
        return tallies

    update_streak(progress, now)
    for i, q in enumerate(cards, 1):
        print_card(i, len(cards), q, show_answer=False)
        card = ensure_card(progress, q["id"], now)
        result = prompt_correctness()
        if result is None:
            print("Session ended early.")
            break
        if result == "skip":
            tallies["skipped"] += 1
            continue
        print()
        print("ANSWER:")
        print(q["answer"].rstrip())
        print(f"Ref: {q.get('ref', '')}")
        if update:
            grade_card(card, bool(result), now)
        if result:
            tallies["correct"] += 1
            print(f"  Marked correct. Now box {card['box']}, due {card['due']}.")
        else:
            tallies["wrong"] += 1
            print(f"  Marked missed. Now box {card['box']}, due {card['due']}.")

    if update:
        save_progress(progress)
    total_graded = tallies["correct"] + tallies["wrong"]
    print()
    print("-" * 64)
    if total_graded:
        pct = 100.0 * tallies["correct"] / total_graded
        print(f"Score: {tallies['correct']}/{total_graded} ({pct:.0f}%)  "
              f"skipped={tallies['skipped']}  streak={progress.get('streak', 0)}")
    else:
        print("No cards graded.")
    return tallies


def cmd_daily(args: argparse.Namespace) -> int:
    questions = load_questions()
    progress = load_progress()
    now = today()
    rng = random.Random(args.seed) if args.seed is not None else random.Random()
    cards = select_daily(questions, progress, args.daily, now, args.module, rng)
    run_session(cards, progress, now, update=not args.dry_run, dry_run=args.dry_run)
    return 0


def cmd_grade(args: argparse.Namespace) -> int:
    """Graded drill: N cards, preferably due, scored at the end."""
    questions = load_questions()
    progress = load_progress()
    now = today()
    rng = random.Random(args.seed) if args.seed is not None else random.Random()
    n = args.n if args.n is not None else 10
    cards = select_daily(questions, progress, n, now, args.module, rng)
    print(f"Grade session: {len(cards)} card(s).")
    run_session(cards, progress, now, update=not args.dry_run, dry_run=args.dry_run)
    return 0


def history_stats(card: dict[str, Any]) -> tuple[int, int]:
    hist = card.get("history") or []
    correct = sum(1 for h in hist if h.get("correct"))
    return correct, len(hist)


def cmd_stats(_args: argparse.Namespace) -> int:
    questions = load_questions()
    progress = load_progress()
    now = today()
    by_id = {q["id"]: q for q in questions}
    cards = progress["cards"]

    box_counts = {i: 0 for i in range(1, MAX_BOX + 1)}
    due_now = 0
    unseen = 0
    correct = 0
    reviewed = 0
    per_module: dict[str, list[int]] = {}

    for q in questions:
        mid = q["module"]
        per_module.setdefault(mid, [0, 0, 0])  # seen, correct, due
        card = cards.get(q["id"])
        if card is None:
            unseen += 1
            per_module[mid][2] += 1  # treat unseen as due
            continue
        box = int(card.get("box", 1))
        box_counts[box] = box_counts.get(box, 0) + 1
        c, n = history_stats(card)
        correct += c
        reviewed += n
        per_module[mid][0] += 1
        per_module[mid][1] += c
        if is_due(card, now):
            due_now += 1
            per_module[mid][2] += 1

    print("RF curriculum — quiz stats")
    print(f"  Date:            {iso(now)}")
    print(f"  Question bank:   {len(questions)}")
    print(f"  Cards started:   {len(cards)}")
    print(f"  Still unseen:    {unseen}")
    print(f"  Due today:       {due_now + unseen}  (includes unseen)")
    print(f"  Streak:          {progress.get('streak', 0)} day(s)")
    print(f"  Last study:      {progress.get('last_study_date') or 'never'}")
    if reviewed:
        print(f"  Historical acc.: {correct}/{reviewed} ({100.0 * correct / reviewed:.0f}%)")
    else:
        print("  Historical acc.: no reviews yet")
    print("  Leitner boxes:   " + "  ".join(f"B{b}={box_counts[b]}" for b in range(1, MAX_BOX + 1)))
    print()
    print("  Per module (started / due-or-new):")
    for mid in sorted(per_module):
        started, _c, due = per_module[mid]
        total = sum(1 for q in questions if q["module"] == mid)
        print(f"    {mid:32s}  {started:3d}/{total:<3d} started   {due:3d} due")
    return 0


def cmd_due(args: argparse.Namespace) -> int:
    questions = load_questions()
    progress = load_progress()
    now = today()
    rows = []
    for q in questions:
        if args.module and q["module"] != args.module:
            continue
        card = progress["cards"].get(q["id"])
        if card is None or is_due(card, now):
            box = 1 if card is None else card["box"]
            due = iso(now) if card is None else card.get("due")
            rows.append((due or "", box, q))
    rows.sort(key=lambda r: (r[0], r[1], r[2]["id"]))
    print(f"{len(rows)} card(s) due on {iso(now)}")
    for due, box, q in rows:
        print(f"  {q['id']:12s}  box={box}  due={due}  {q['module']}  {q['topic']}")
    return 0


def cmd_reset(args: argparse.Namespace) -> int:
    if not args.yes:
        if interactive():
            ans = input("Reset all quiz progress? Type 'yes' to confirm: ").strip()
            if ans.lower() != "yes":
                print("Aborted.")
                return 1
        else:
            print("Refusing to reset without --yes in a non-interactive session.")
            return 1
    save_progress(empty_progress())
    print(f"Reset {PROGRESS_PATH}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Offline spaced-repetition quiz for the RF curriculum.",
    )
    p.add_argument("--daily", type=int, metavar="N",
                   help="run a daily session of N due (or new) cards")
    p.add_argument("--module", help="restrict to one module id, e.g. 04-network-analysis-sparams")
    p.add_argument("--seed", type=int, help="RNG seed for reproducible card order")
    p.add_argument("--dry-run", action="store_true",
                   help="select and print cards without writing progress")

    sub = p.add_subparsers(dest="cmd")

    sub.add_parser("stats", help="show streak, due counts, and box histogram")

    g = sub.add_parser("grade", help="graded drill of N cards")
    g.add_argument("--n", type=int, default=10, help="number of cards (default 10)")
    g.add_argument("--module", help="restrict to one module")
    g.add_argument("--seed", type=int)
    g.add_argument("--dry-run", action="store_true")

    d = sub.add_parser("due", help="list cards that are due today")
    d.add_argument("--module", help="restrict to one module")

    r = sub.add_parser("reset", help="wipe progress.json back to an empty schema")
    r.add_argument("--yes", action="store_true", help="confirm reset")
    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.daily is not None:
        if args.daily < 1:
            parser.error("--daily must be a positive integer")
        return cmd_daily(args)
    if args.cmd == "stats":
        return cmd_stats(args)
    if args.cmd == "grade":
        return cmd_grade(args)
    if args.cmd == "due":
        return cmd_due(args)
    if args.cmd == "reset":
        return cmd_reset(args)

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
Pytest test suite for times_tables.py (fixed)

Key fixes:
- Monkeypatch times_tables.generate_problems to return the same problems list
  used to build answers, so the questions and mocked answers match.
- Use monkeypatch to redirect RESULTS_FILE to tmp_path for isolation.
- Stable fake clock that returns a start time on first call and end time after.
"""

import json
import pytest
import times_tables as tt
from times_tables import generate_problems, save_results, practice_table


def test_generate_problems_length_and_content():
    problems = generate_problems(3)
    # Should always be 20 problems
    assert len(problems) == 20
    # All should be multiples of the chosen table
    assert all(a == 3 for a, _ in problems)
    # Ensure 0–12 appear at least once
    multipliers = [b for _, b in problems]
    for i in range(13):
        assert i in multipliers


def test_save_and_load_results(tmp_path, monkeypatch):
    # Redirect RESULTS_FILE to a temp file
    test_file = tmp_path / "results.json"
    monkeypatch.setattr(tt, "RESULTS_FILE", str(test_file))

    test_data = {"3": {"attempts": 1, "successes": 1, "failures": 0, "best_time": 45.6}}

    # Save results (writes to the temp RESULTS_FILE)
    save_results(test_data)

    # Load directly from the temp file and assert
    with open(test_file, "r") as f:
        loaded = json.load(f)

    assert loaded == test_data


@pytest.mark.parametrize("table", [2, 5, 12])
def test_generate_problems_different_tables(table):
    problems = generate_problems(table)
    assert all(a == table for a, _ in problems)
    assert len(problems) == 20


def test_practice_table_success(monkeypatch, tmp_path):
    """
    Simulates a perfect run on the 2× table:
    - All 20 answers correct
    - Elapsed time under 60 seconds
    Should record a success in results.json
    """

    # Redirect RESULTS_FILE to tmp_path
    test_file = tmp_path / "results.json"
    monkeypatch.setattr(tt, "RESULTS_FILE", str(test_file))

    # Generate problems once for reproducible order
    problems = generate_problems(2)

    # Ensure practice_table uses the same problems (monkeypatch generate_problems)
    monkeypatch.setattr(tt, "generate_problems", lambda _: problems)

    # Build a list of correct answers matching those problems
    answers = [str(a * b) for a, b in problems]
    answers_iter = iter(answers)

    # Mock input() to return answers in sequence
    monkeypatch.setattr("builtins.input", lambda _: next(answers_iter))

    # Fake clock: first call -> start, subsequent calls -> end
    state = {"called": 0}

    def fake_time():
        if state["called"] == 0:
            state["called"] += 1
            return 1000.0  # start
        return 1030.0  # end (elapsed = 30s)

    monkeypatch.setattr("time.time", fake_time)

    # Run practice session
    practice_table(2)

    # Verify results.json was updated
    with open(test_file, "r") as f:
        results = json.load(f)

    assert "2" in results
    stats = results["2"]
    assert stats["attempts"] == 1
    assert stats["successes"] == 1
    assert stats["failures"] == 0
    assert stats["best_time"] is not None
    assert float(stats["best_time"]) <= 60.0


def test_practice_table_failure(monkeypatch, tmp_path):
    """
    Simulates a failed run on the 3× table:
    - Wrong answers provided (always "0")
    - Should record a failure in results.json
    """

    # Redirect RESULTS_FILE to tmp_path
    test_file = tmp_path / "results.json"
    monkeypatch.setattr(tt, "RESULTS_FILE", str(test_file))

    # Generate problems once for reproducible order
    problems = generate_problems(3)

    # Ensure practice_table uses the same problems
    monkeypatch.setattr(tt, "generate_problems", lambda _: problems)

    # Provide wrong answers (always "0")
    answers_iter = iter(["0"] * 20)
    monkeypatch.setattr("builtins.input", lambda _: next(answers_iter))

    # Fake clock: start then end (45 seconds)
    state = {"called": 0}

    def fake_time():
        if state["called"] == 0:
            state["called"] += 1
            return 2000.0
        return 2045.0

    monkeypatch.setattr("time.time", fake_time)

    # Run practice session
    practice_table(3)

    # Verify results.json was updated with a failure
    with open(test_file, "r") as f:
        results = json.load(f)

    assert "3" in results
    stats = results["3"]
    assert stats["attempts"] == 1
    assert stats["successes"] == 0
    assert stats["failures"] == 1
    assert stats["best_time"] is None

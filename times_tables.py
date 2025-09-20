"""
Times Tables Practice Application
---------------------------------

This application helps children practice multiplication tables.
Features:
- Choose which multiplication table (2–12) to practice.
- Each session consists of 20 questions:
  * All products from 0 through 12 are included once.
  * 7 additional random multipliers (0–12) are added for variety.
- The session is timed, with a goal of finishing 20 correct answers within 60 seconds.
- Results are tracked per times table (attempts, successes, failures, best time).
- Statistics are persisted across runs in a JSON file (results.json).

Usage:
    python times_tables.py

Menu options:
    1. Practice
    2. Show Stats
    3. Quit
"""

import random
import time
import json
import os
from typing import Dict, List, Tuple, Optional

RESULTS_FILE = "results.json"


def load_results() -> Dict[str, dict]:
    """Load results from the JSON file, or return an empty dictionary if not found."""
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, "r") as f:
            return json.load(f)
    return {}


def save_results(results: Dict[str, dict]) -> None:
    """Save results to the JSON file."""
    with open(RESULTS_FILE, "w") as f:
        json.dump(results, f, indent=2)


def generate_problems(times_table: int) -> List[Tuple[int, int]]:
    """
    Generate 20 multiplication problems for the given times table.

    Includes:
    - One of each multiplier from 0–12 (13 problems).
    - 7 random extra multipliers (0–12).
    - Shuffled order.

    Args:
        times_table (int): The multiplication table to practice (e.g., 3 for 3× table).

    Returns:
        List[Tuple[int, int]]: List of (times_table, multiplier) problems.
    """
    problems = [(times_table, i) for i in range(13)]
    problems += [(times_table, random.randint(0, 12)) for _ in range(7)]
    random.shuffle(problems)
    return problems


def practice_table(times_table: int) -> None:
    """
    Run a practice session for the chosen times table.

    - Presents 20 multiplication problems.
    - Times the attempt.
    - Records success if all answers are correct and finished under 60 seconds.
    - Updates stats in results.json.

    Args:
        times_table (int): The multiplication table to practice.
    """
    print(f"\nPracticing {times_table} times table...")

    problems = generate_problems(times_table)
    start_time = time.time()
    correct_answers = 0

    for a, b in problems:
        answer = input(f"{a} x {b} = ")
        try:
            if int(answer) == a * b:
                correct_answers += 1
            else:
                print("❌ Wrong!")
        except ValueError:
            print("❌ Not a number!")

    elapsed = round(time.time() - start_time, 2)

    results = load_results()
    key = str(times_table)

    if key not in results:
        results[key] = {"attempts": 0, "successes": 0, "failures": 0, "best_time": None}

    results[key]["attempts"] += 1

    if correct_answers == 20 and elapsed <= 60:
        print(f"🎉 Success! You finished in {elapsed} seconds.")
        results[key]["successes"] += 1

        if results[key]["best_time"] is None or elapsed < results[key]["best_time"]:
            results[key]["best_time"] = elapsed
            print("🏆 New record time!")
        else:
            print(f"⭐ Your best time is still {results[key]['best_time']} seconds.")
    else:
        print(f"⏱ Finished in {elapsed} seconds with {correct_answers}/20 correct.")
        print("⚠️ Goal not reached (20 correct within 60 seconds).")
        results[key]["failures"] += 1

    save_results(results)


def show_stats() -> None:
    """Display statistics for all practiced times tables."""
    results = load_results()
    if not results:
        print("No stats yet. Go practice!")
        return
    print("\n📊 Stats by Times Table:")
    for k, v in results.items():
        print(
            f"Table {k}: Attempts {v['attempts']}, "
            f"Successes {v['successes']}, Failures {v['failures']}, "
            f"Best Time: {v['best_time'] if v['best_time'] else 'N/A'}"
        )


def main() -> None:
    """Main application loop with menu options."""
    while True:
        print("\n--- Times Tables Practice ---")
        print("1. Practice")
        print("2. Show Stats")
        print("3. Quit")
        choice = input("Choose an option: ")

        if choice == "1":
            try:
                table = int(input("Which times table would you like to practice? (2-12): "))
                if 2 <= table <= 12:
                    practice_table(table)
                else:
                    print("Please choose between 2 and 12.")
            except ValueError:
                print("Please enter a valid number.")
        elif choice == "2":
            show_stats()
        elif choice == "3":
            print("Goodbye!")
            break
        else:
            print("Invalid choice, try again.")


if __name__ == "__main__":
    main()

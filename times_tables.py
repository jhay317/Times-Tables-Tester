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
TIMER_LIMIT = 120


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


def practice_table(times_table: int, timer_limit: Optional[int] = 120) -> None:
    """
    Run a practice session for the chosen times table.

    - Presents 20 multiplication problems.
    - Times the attempt.
    - Records success if all answers are correct and finished under the timer limit.
    - Updates stats in results.json.

    Args:
        times_table (int): The multiplication table to practice.
        timer_limit (Optional[int]): Time limit in seconds (None if disabled).
    """
    print(f"\nPracticing {times_table} times table...")
    if timer_limit:
        print(f"Goal: Get at least 18 correct answers within {timer_limit} seconds.")
    else:
        print("Goal: Get at least 18 correct answers (No time limit).")

    problems = generate_problems(times_table)
    start_time = time.time()
    correct_answers = 0

    for a, b in problems:
        answer = input(f"{a} x {b} = ")
        try:
            if int(answer) == a * b:
                correct_answers += 1
            else:
                print(f"❌ Wrong! The correct answer is {a * b}")
        except ValueError:
            print("❌ Not a number!")

    elapsed = round(time.time() - start_time, 2)

    results = load_results()
    key = str(times_table)

    if key not in results:
        results[key] = {"attempts": 0, "successes": 0, "failures": 0, "best_time": None}

    results[key]["attempts"] += 1

    is_success = correct_answers >= 18 and (timer_limit is None or elapsed <= timer_limit)

    if is_success:
        print(f"🎉 Success! You finished in {elapsed} seconds.")
        results[key]["successes"] += 1

        if results[key]["best_time"] is None or elapsed < results[key]["best_time"]:
            results[key]["best_time"] = elapsed
            print("🏆 New record time!")
        else:
            print(f"⭐ Your best time is still {results[key]['best_time']} seconds.")
    else:
        print(f"⏱ Finished in {elapsed} seconds with {correct_answers}/20 correct.")
        if timer_limit:
            print(f"⚠️ Goal not reached (18 correct within {timer_limit} seconds).")
        else:
            print("⚠️ Goal not reached (at least 18 correct required).")
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
    global TIMER_LIMIT
    while True:
        print("\n--- Times Tables Practice ---")
        print("1. Practice")
        print("2. Show Stats")
        timer_status = f"{TIMER_LIMIT}s" if TIMER_LIMIT is not None else "Disabled"
        print(f"3. Timer Settings (Current: {timer_status})")
        print("4. Quit")
        choice = input("Choose an option: ")

        if choice == "1":
            try:
                table = int(input("Which times table would you like to practice? (2-12): "))
                if 2 <= table <= 12:
                    # Check if table is completed
                    results = load_results()
                    if str(table) in results and results[str(table)].get("successes", 0) > 0:
                        print(f"❌ Table {table} is already completed and locked! Please choose another table.")
                    else:
                        practice_table(table, TIMER_LIMIT)
                else:
                    print("Please choose between 2 and 12.")
            except ValueError:
                print("Please enter a valid number.")
        elif choice == "2":
            show_stats()
        elif choice == "3":
            print("\n--- Timer Settings ---")
            print("Enter timer limit in seconds (default 120, min 60), or 0 to disable the timer.")
            t_choice = input("Timer limit: ").strip()
            if not t_choice:
                TIMER_LIMIT = 120
                print("Timer set to default (120 seconds).")
            elif t_choice == "0":
                TIMER_LIMIT = None
                print("Timer disabled.")
            else:
                try:
                    limit = int(t_choice)
                    if limit >= 60:
                        TIMER_LIMIT = limit
                        print(f"Timer set to {limit} seconds.")
                    else:
                        print("Invalid limit! Timer limit must be at least 60 seconds (or 0 to disable). Timer remains unchanged.")
                except ValueError:
                    print("Invalid input. Timer remains unchanged.")
        elif choice == "4":
            print("Goodbye!")
            break
        else:
            print("Invalid choice, try again.")


if __name__ == "__main__":
    main()

import tkinter as tk
from tkinter import messagebox
import random
import time
import json
import os

RESULTS_FILE = "results.json"

class TimesTableApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Times Tables Practice")

        # UI elements
        self.label = tk.Label(root, text="Choose a times table to practice (2-12):", font=("Arial", 14))
        self.label.pack(pady=10)

        self.entry = tk.Entry(root, font=("Arial", 14), justify="center")
        self.entry.pack(pady=5)

        self.start_button = tk.Button(root, text="Start Practice", command=self.start_practice, font=("Arial", 14))
        self.start_button.pack(pady=10)

        self.stats_label = tk.Label(root, text="", font=("Arial", 12))

        self.question_label = tk.Label(root, text="", font=("Arial", 18))
        self.answer_entry = tk.Entry(root, font=("Arial", 14), justify="center")
        self.submit_button = tk.Button(root, text="Submit", command=self.check_answer, font=("Arial", 14))

        # Bind Enter key to submit answers
        self.root.bind("<Return>", self.handle_enter)

        # State
        self.table = None
        self.problems = []
        self.current_index = 0
        self.start_time = None
        self.correct_answers = 0

    def handle_enter(self, event):
        """Handle Enter key press depending on app state."""
        if self.answer_entry.winfo_ismapped():
            self.check_answer()
        elif self.entry.winfo_ismapped():
            self.start_practice()

    def start_practice(self):
        try:
            self.table = int(self.entry.get())
            if not (2 <= self.table <= 12):
                raise ValueError
        except ValueError:
            messagebox.showerror("Invalid Input", "Please enter a number between 2 and 12.")
            return

        # Show stats for this table
        stats = self.load_stats_for_table(self.table)
        if stats:
            best_time = stats.get("best_time", None)
            best_text = f"{best_time:.1f}s" if best_time else "N/A"
            self.stats_label.config(
                text=(
                    f"Attempts: {stats['attempts']} | "
                    f"Successes: {stats['successes']} | "
                    f"Failures: {stats['failures']} | "
                    f"Best Time: {best_text}"
                )
            )
        else:
            self.stats_label.config(text="No stats yet for this table.")
        self.stats_label.pack(pady=5)

        # Prepare problems
        self.problems = [(self.table, i) for i in range(13)]
        extra = random.sample(self.problems, 7)  # add extras to make 20
        self.problems = self.problems + extra
        random.shuffle(self.problems)

        self.current_index = 0
        self.correct_answers = 0
        self.start_time = time.time()

        # Update UI for questions
        self.label.pack_forget()
        self.entry.pack_forget()
        self.start_button.pack_forget()
        self.stats_label.pack_forget()

        self.show_question()

    def show_question(self):
        if self.current_index < len(self.problems):
            a, b = self.problems[self.current_index]
            self.question_label.config(text=f"{a} × {b} = ?")
            self.question_label.pack(pady=10)
            self.answer_entry.delete(0, tk.END)
            self.answer_entry.pack(pady=5)
            self.submit_button.pack(pady=10)
            self.answer_entry.focus()
        else:
            self.finish_practice()

    def check_answer(self):
        user_answer = self.answer_entry.get()
        try:
            user_answer = int(user_answer)
        except ValueError:
            messagebox.showwarning("Invalid", "Please enter a number.")
            return

        a, b = self.problems[self.current_index]
        if user_answer == a * b:
            self.correct_answers += 1

        self.current_index += 1
        self.show_question()

    def finish_practice(self):
        elapsed = time.time() - self.start_time
        success = self.correct_answers == 20 and elapsed <= 60

        self.save_results(success, elapsed)

        if success:
            messagebox.showinfo("Success!", f"🎉 Great job! You finished in {elapsed:.1f} seconds.")
        else:
            messagebox.showinfo(
                "Try Again",
                f"You got {self.correct_answers}/20 correct in {elapsed:.1f} seconds.\n"
                "Try to get all correct within 60 seconds!"
            )

        # Reset UI
        self.question_label.pack_forget()
        self.answer_entry.pack_forget()
        self.submit_button.pack_forget()

        self.label.pack(pady=10)
        self.entry.pack(pady=5)
        self.start_button.pack(pady=10)

    def save_results(self, success, elapsed):
        if os.path.exists(RESULTS_FILE):
            with open(RESULTS_FILE, "r") as f:
                results = json.load(f)
        else:
            results = {}

        stats = results.get(str(self.table), {
            "attempts": 0,
            "successes": 0,
            "failures": 0,
            "best_time": None
        })

        stats["attempts"] += 1
        if success:
            stats["successes"] += 1
            if stats["best_time"] is None or elapsed < stats["best_time"]:
                stats["best_time"] = elapsed
        else:
            stats["failures"] += 1

        results[str(self.table)] = stats

        with open(RESULTS_FILE, "w") as f:
            json.dump(results, f, indent=2)

    def load_stats_for_table(self, table):
        """Load saved stats for a given times table."""
        if not os.path.exists(RESULTS_FILE):
            return None
        with open(RESULTS_FILE, "r") as f:
            results = json.load(f)
        return results.get(str(table))


if __name__ == "__main__":
    root = tk.Tk()
    app = TimesTableApp(root)
    root.mainloop()

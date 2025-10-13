# Times Tables Tester

A simple Python script to help students practice multiplication (times tables), either via a GUI or via the command line. The goal is to answer **20 questions** in under **60 seconds** and score at least **18 correct** to “pass.”

---

## Features

- Two modes: **command line** and **graphical user interface (GUI)**  
- Randomly generated multiplication questions  
- Time limit: 60 seconds  
- “Passing” requirement: ≥ 18 correct answers out of 20  
- Lightweight, easy to use, no external dependencies (beyond standard Python libs)  

---

## Contents / Files

| Filename | Purpose |
|---|---|
| `times_tables.py` | Core logic for generating and scoring times table quizzes |
| `times_tables_gui.py` | GUI frontend (Tkinter-based) wrapping the core logic |
| `test_time_tables.py` | Unit tests for the core logic functions |
| `.gitignore` | Files and directories to ignore in Git |
| `README.md` | This documentation |

---

## Requirements

- Python 3.x  
- Standard library only (no external packages required)  

---

## Installation / Setup

1. Clone the repository:  
   ```bash
   git clone https://github.com/jhay317/Times-Tables-Tester.git
   cd Times-Tables-Tester

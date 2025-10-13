# 🧮 Times Tables Tester

**Times Tables Tester** is a fun and educational Python app that helps students practice their multiplication skills.  
It features both a **command-line** and a **graphical user interface (GUI)** version, making it suitable for all ages and learning styles.

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/jhay317/Times-Tables-Tester.git
cd Times-Tables-Tester

# 2. (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate     # macOS/Linux
venv\Scripts\activate        # Windows

# 3. Run the GUI version (recommended)
python times_tables_gui.py

# or, run the command-line version
python times_tables.py
```

---

## 🚀 Features

- Practice times tables from 0–12  
- Randomized question order every time  
- 20 timed questions per session (60 seconds)  
- Pass if you score **18 or more correct**  
- Two modes:
  - 🖥️ GUI mode (Tkinter)
  - 💻 Command-line mode  
- Lightweight and beginner-friendly — no complex setup required

---

## 🧩 Requirements

- **Python 3.9 or later**  
  (Recommended: Python **3.11+** for best compatibility)  
- **Tkinter** (included with most Python installations)  

Check your Python version:
```bash
python --version
```

If you don’t have Python installed, download it here:  
👉 https://www.python.org/downloads/

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jhay317/Times-Tables-Tester.git
   cd Times-Tables-Tester
   ```

2. **(Optional) Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate     # macOS/Linux
   venv\Scripts\activate        # Windows
   ```

3. **Install dependencies (if needed)**
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: Most systems won’t need this step — the project uses only standard Python libraries.)*

---

## ▶️ Running the App

### Option 1 — Command-Line Version
Run this version if you prefer typing answers in the terminal:
```bash
python times_tables.py
```

**Gameplay:**
- You’ll be asked 20 random multiplication questions.
- You have 60 seconds to complete them all.
- At the end, your score and pass/fail result are displayed.

---

### Option 2 — GUI Version (Recommended for Kids)
Launch the graphical version with:
```bash
python times_tables_gui.py
```

**Gameplay:**
- Click **Start** to begin the quiz.  
- Type answers directly into the input box.  
- A timer counts down from 60 seconds.  
- When finished, your score and results will appear.

---

## 🧪 Running Tests

Run the included unit tests to verify functionality:

```bash
python -m unittest test_time_tables.py
```

---

## 🧠 How It Works

- The quiz randomly generates 20 multiplication problems (0–12).  
- Timer starts when the first question appears.  
- Answers are validated for correctness.  
- The quiz ends when all questions are answered or when 60 seconds elapse.  
- You “pass” by answering 18 or more correctly.  

---

## 🌱 Future Enhancements

- Add difficulty levels (e.g., 1–5, 1–10, or 1–12 tables)
- Store high scores or history
- Add sound effects or animations
- Multiple-choice mode
- Web version (Flask or Django)

---

## 🤝 Contributing

Contributions are welcome!  
1. Fork the repo  
2. Create a new branch: `git checkout -b feature-name`  
3. Commit changes: `git commit -m "Add new feature"`  
4. Push the branch: `git push origin feature-name`  
5. Open a Pull Request  

---

## 🪪 License

This project is open source.  
Add your preferred license (e.g., MIT) in a `LICENSE` file.

---

## 👨‍💻 Author

**Justin Hay** ([@jhay317](https://github.com/jhay317))  
If you have feedback, suggestions, or bug reports, please open an issue on GitHub.

---

🎯 *“Practice makes perfect — one times table at a time!”*

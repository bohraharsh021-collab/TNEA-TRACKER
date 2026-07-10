# TNEA Tracker 🎓📊

A modern, production-ready data intelligence and career counseling platform for **Tamil Nadu Engineering Admissions (TNEA)**.

TNEA Tracker replaces traditional PDF cutoffs and spreadsheets with a clean, responsive interface loaded with interactive visualizations, multi-year trend analytics, an admissions predictor, and a digital choice list builder.

---

## 🚀 Key Features

*   **⚡ "What Are My Chances" Predictor:** Enter your TNEA Cutoff mark or general rank to instantly classify admissions chances across three tiers:
    *   🟢 **Safe:** High probability of admission (Closing rank is safely above the threshold)
    *   🟡 **Moderate:** Competitive range (Closing rank is near the threshold)
    *   🔴 **Reach:** Stretch option (Closing rank is highly competitive)
    *   *Includes full 3-year history breakdown (2025, 2024, 2023) for each predicted branch/college.*
*   **📊 Interactive Analytics Dashboard:** 100+ visual data modules (bar charts, line graphs, pie charts, and tables) categorizing:
    *   College comparisons and district-wise rankings.
    *   Branch popularity & growth trends.
    *   Seat distributions & historical intakes.
*   **🔍 College Explorer:** Browse and search 460+ engineering colleges in Tamil Nadu. Apply dynamic filters for:
    *   **Institution Type:** Government Colleges, Autonomous Colleges, and Non-Autonomous Colleges.
    *   **Districts & Branches**
*   **📚 Course & Branch Explorer:** Deep dive into 100+ engineering branches with year-based enrollment records, colleges list, and general rank requirements.
*   **📋 Choice List Builder:** Compile, organize, reorder, and save preferred college-branch choices for counseling submissions.

---

## 🛠️ Technology Stack

*   **Frontend:** Vanilla HTML5, CSS3, Javascript (ES6), Chart.js
*   **Backend:** Pure Python 3 Standard Library (Zero external dependencies)
*   **Database:** SQLite 3 (optimized indexes for high performance)

---

## 📦 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/tnea-tracker.git
cd tnea-tracker
```

### 2. Run the server
Since the backend uses only Python standard libraries, you don't need to run `pip install`! Just run the script:
```bash
python server.py
```

### 3. Open in Browser
Visit **[http://localhost:8000/](http://localhost:8000/)** in your browser.

---

## 🗃️ Database Administration

The SQLite database (`tnea.db`) contains structured data populated from raw CSV admissions. If you ever need to clean or rebuild it:
```bash
python rebuild_database.py
```

---

## 📄 License

Copyright © 2026 Harsh. All rights reserved. Licensed under a proprietary All-Rights-Reserved license. See the `LICENSE` file for details.

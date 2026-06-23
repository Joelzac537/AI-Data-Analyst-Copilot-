# Iowa Liquor Sales Intelligence Dashboard

This repository holds the feasibility study, GPT-4o performance evaluations, and machine learning time-series forecasting models for the **2025 Iowa Liquor Sales** dataset (part of the EAI 6010 curriculum). 

It features two distinct interactive frontend web dashboards to explore the data and interact with the forecasting model:
1. **Streamlit App (`streamlit_app.py`)**: A Python-based interactive dashboard that reads and caches the 538 MB dataset locally for real-time analysis.
2. **HTML/JS/CSS SPA Dashboard (`index.html`)**: A client-side Single Page Application displaying pre-calculated aggregates, interactive parameter adjusters, and a CSV file upload tool.

---

## 📂 Project Structure

- **[eai6010_final_project.py](file:///d:/Projects/Applications%20of%20Ai/eai6010_final_project.py)**: Python script carrying out the initial dataset load, Exploratory Data Analysis (EDA), prompt evaluations against GPT-4o, and the baseline Linear Regression forecasting.
- **[streamlit_app.py](file:///d:/Projects/Applications%20of%20Ai/streamlit_app.py)**: Python application displaying interactive layouts, time-series line charts, dynamic top listings, parameters sliders, and a chat interface using Streamlit.
- **[index.html](file:///d:/Projects/Applications%20of%20Ai/index.html)**, **[app.js](file:///d:/Projects/Applications%20of%20Ai/app.js)**, **[styles.css](file:///d:/Projects/Applications%20of%20Ai/styles.css)**, **[data.js](file:///d:/Projects/Applications%20of%20Ai/data.js)**: Frontend components forming the client-side SPA web application.
- **`iowa_liquor_sales_2025_1262_rows.csv`**: The local source dataset (~538 MB, 2,490,620 rows).

---

## ⚡ Prerequisites & Setup

Ensure you have Python installed. Clone/navigate to this directory and install the necessary dependencies:

```bash
pip install pandas numpy scikit-learn matplotlib openai streamlit papaparse
```

To enable GPT-4o query evaluation, verify that your API key is defined in your environment:

```bash
# Windows Command Prompt
set OPENAI_API_KEY=your-api-key-here

# Windows PowerShell
$env:OPENAI_API_KEY="your-api-key-here"
```

---

## 🚀 Running the Project

### Option A: Streamlit Dashboard (Recommended)
This loads the local 538 MB dataset and caches it in memory, letting you filter metrics and interact with the forecasting sliders in real-time.

```bash
streamlit run streamlit_app.py
```
Open **[http://localhost:8501](http://localhost:8501)** in your browser.

### Option B: HTML/CSS/JS SPA Dashboard
A lightweight client-side application. It loads instantly because it reads pre-calculated summary metrics from the script execution, meaning you do not have to wait for the 538 MB file to load.

Simply double-click the HTML file or open it directly:
**[index.html](file:///d:/Projects/Applications%20of%20Ai/index.html)**

### Option C: Python Analytics Script
To execute the raw data pipeline, prompt evaluations, and model fitting:

```bash
python eai6010_final_project.py
```
This saves static visualization plots (`monthly_revenue_2025.png`, `lr_forecast_june2026.png`) and prompt evaluation statistics (`gpt4o_evaluation_results.csv`) directly in the directory.

---

## 📊 Core Application Features

1. **Overview & EDA**: High-level tracking cards showing statewide sales revenue ($424.8M), bottle counts (30.4M), and stores (2,300), alongside interactive sorting of top distributors.
2. **GPT-4o Evaluation**: An evaluation testing GPT-4o's ability to query data accurately, reporting a baseline accuracy of 80% and highlighting limits on context window coverage (<0.1%).
3. **Sales Forecasting**: A time-series chart showing 2025 actuals vs. 2026 predictions. Users can drag sliders to adjust intercept baselines and growth slopes to dynamically redraw predictions.
4. **RAG Chat Assistant**: A chat widget simulating RAG operations, fetching records and displaying retrieved knowledge citation tags.
5. **Custom CSV Upload**: A file-upload area allowing users to drop custom CSV sales lists to compute aggregates dynamically on the fly.

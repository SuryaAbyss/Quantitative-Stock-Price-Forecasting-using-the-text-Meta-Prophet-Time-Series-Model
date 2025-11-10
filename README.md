# 📈 Stock Price Prediction Dashboard

An interactive **React + Flask** dashboard that visualizes historical equity prices, forecasts future prices with **Prophet**, and benchmarks model performance across **100+ stock datasets**.

---

## 🚀 Key Features

- **Automatic Dataset Discovery (50+ Stocks Ready)**  
  The sidebar dynamically lists every CSV in the `dataset/` folder (e.g., `AAPL_data.csv`).  
  No hardcoding—just drop your files in and go.

- **Blended Forecast Chart**  
  Combines the **last 30 days** of historical closes with a **7-day Prophet forecast** using Recharts.

- **Glassmorphism Metrics Overlay**  
  Stylish overlay widget displaying:
  - Regression: **MAE**, **RMSE**, **MAPE**, **R²**
  - Directional: **Accuracy**, **Precision**, **Recall**, **F1**
  - **Confusion matrix** for directional movement

- **Clean REST API**  
  Power both the dashboard and external clients with:
  - `/symbols`
  - `/stock/<symbol>`
  - `/predict/<symbol>`
  - `/metrics/<symbol>`

- **CORS-Enabled**  
  Works perfectly with React’s dev server or any frontend client.

- **Data Fallback**  
  If a dataset CSV is missing, the app automatically fetches data from **yfinance**.

> 🧠 **Modeling Algorithm:** Facebook/Meta **Prophet** with daily seasonality.  
> Benchmarked across 100+ datasets for regression and directional performance.

---

## 🧱 Tech Stack

**Frontend**
- React 18 + React Router  
- Recharts (data visualization)  
- `lucide-react` + custom CSS (glassmorphism overlay)

**Backend**
- Flask + Flask-CORS  
- pandas + Prophet (forecasting)  
- yfinance (fallback source)

---

## 📂 Project Structure

├── backend/ # Flask API (app.py)
├── dataset/ # Stock CSVs named <SYMBOL>_data.csv
├── frontend/ # React application
│ └── src/
│ ├── Dashboards/StockDashboard.jsx
│ └── Dashboards/StockDashboard.css
├── requirements.txt # Backend dependencies
└── README.md


---

## ✅ Prerequisites
- Python **3.10+**
- Node.js **18+** and npm

---

## ⚡ Quickstart

From the project root:

### 1️⃣ Backend Setup

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python backend/app.py
Backend runs on: http://127.0.0.1:5000

2️⃣ Frontend Setup
bash
Copy code
cd frontend
npm install
npm start
Frontend runs on: http://localhost:3000

If ports are busy, set:

FLASK_RUN_PORT (backend)

PORT (frontend)

and adjust the frontend’s fetch URLs accordingly.

🗂️ Dataset Format
Place CSVs in the dataset/ directory with the following schema:

lua
Copy code
date,open,high,low,close,volume,Name
2013-02-08,67.7142,68.4014,66.8928,67.8542,158168416,AAPL
...
Symbol inferred from filename (AAPL_data.csv → AAPL)

/symbols → lists all available symbols

/stock/<symbol> → serves the last 30 days (CSV first, yfinance fallback)

/predict/<symbol> → trains Prophet on full history, forecasts 7 days

/metrics/<symbol> → computes regression + classification metrics on a 30-day holdout

🔌 REST API Endpoints
Route	Method	Description
/symbols	GET	List all dataset symbols
/stock/<symbol>	GET	Last 30 days of historical price/volume
/predict/<symbol>	GET	7-day Prophet forecast (ds, yhat)
/metrics/<symbol>	GET	Regression + classification metrics

📉 Regression Metrics
MAE, RMSE, MAPE, R²

📈 Directional Metrics
Accuracy, Precision, Recall, F1

Confusion Matrix → {tn, fp, fn, tp}
(Direction = whether close[t] > close[t-1])

🧪 Benchmarking Prophet Across 50+ Datasets
The app supports bulk benchmarking across all available datasets automatically.
You can benchmark Prophet’s performance across every symbol using this helper script.

📜 benchmark_all_symbols.py
python
Copy code
import requests, pandas as pd

BASE = "http://127.0.0.1:5000"

symbols = [s["symbol"] for s in requests.get(f"{BASE}/symbols").json()]
rows = []

for sym in symbols:
    try:
        print(f"Evaluating {sym}...")
        m = requests.get(f"{BASE}/metrics/{sym}", timeout=60).json()
        if "error" in m:
            print(f"{sym}: {m['error']}")
            continue
        reg = m["regression"]; cls = m["classification"]
        rows.append({
            "symbol": m["meta"]["symbol"],
            "test_days": m["meta"]["test_days"],
            "MAE": reg["mae"], "RMSE": reg["rmse"],
            "MAPE": reg["mape"], "R2": reg["r2"],
            "ACC": cls["accuracy"], "Precision": cls["precision"],
            "Recall": cls["recall"], "F1": cls["f1"],
            "TN": cls["confusion_matrix"]["tn"],
            "FP": cls["confusion_matrix"]["fp"],
            "FN": cls["confusion_matrix"]["fn"],
            "TP": cls["confusion_matrix"]["tp"]
        })
    except Exception as e:
        print(sym, "->", e)

df = pd.DataFrame(rows).sort_values(["F1", "R2"], ascending=False)
df.to_csv("prophet_benchmark_50plus.csv", index=False)
print(f"✅ Saved prophet_benchmark_50plus.csv with {len(df)} symbols")
💡 This produces a CSV ranking Prophet’s regression and classification performance across 50+ symbols.

Optional Future Work
Add additional algorithms for multi-model comparison:

Naïve (last value)

SMA / EMA

ARIMA / SARIMA

XGBoost on engineered features

🎨 Frontend Notes
The glassmorphism metrics overlay is defined in StockDashboard.css under .metricsOverlay.
You can tweak the blur, opacity, and saturation to your liking.

Prophet models are fit on demand (first call per symbol may take a few seconds).

To improve speed, cache or persist:

Forecasts

Metrics results (e.g., daily refresh)

🧩 Backend Summary
Your Flask backend provides:

Dataset auto-discovery

30-day recent history retrieval

Prophet-based 7-day forecasts

Metrics computation (regression + directional)

yfinance fallback

You can easily extend it with /metrics_all or /predict_all for bulk operations.

🔐 Production Tips
Deploy Flask behind gunicorn or uWSGI

Use HTTPS

Cache Prophet outputs to avoid recomputation

Add rate limiting if deploying public-facing APIs

📝 License
Choose a license that fits your use case (e.g., MIT or Apache 2.0).

🖼 Screenshots


💡 Summary
This dashboard provides:

Automated discovery of 50+ stock datasets

Prophet-based forecasting and performance metrics

RESTful API ready for expansion

Elegant, interactive frontend for finance analytics

Perfect foundation for extending into a multi-algorithm financial prediction platform.

yaml
Copy code

---

Would you like me to **add a short section showing a sample Recharts + glassmorphism metrics overlay JSX component**

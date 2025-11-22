from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
import yfinance as yf
from prophet import Prophet
import datetime
import math

app = Flask(__name__)
CORS(app)  # Allow requests from your React frontend

DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")

def list_symbols_from_dataset():
    symbols = []
    if os.path.isdir(DATASET_DIR):
        for fname in os.listdir(DATASET_DIR):
            if fname.endswith("_data.csv"):
                symbol = fname.replace("_data.csv", "")
                symbols.append(symbol)
    return sorted(symbols)

def load_symbol_dataframe(symbol: str) -> pd.DataFrame:
    """
    Load a symbol's CSV from dataset directory. Expects columns:
    date,open,high,low,close,volume,Name
    """
    path = os.path.join(DATASET_DIR, f"{symbol}_data.csv")
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Dataset for symbol {symbol} not found")
    df = pd.read_csv(path)
    # Normalize column names expected by the app
    # Ensure datetime and sorting
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    return df

@app.route("/symbols", methods=["GET"])
def get_symbols():
    """
    Returns a list of symbols derived from dataset filenames.
    """
    try:
        symbols = list_symbols_from_dataset()
        # Provide minimal metadata to the frontend
        items = [{"symbol": s, "name": s, "sector": "Dataset"} for s in symbols]
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/stock/<symbol>", methods=["GET"])
def get_stock_data(symbol):
    try:
        # Prefer dataset CSV if available; otherwise fallback to yfinance
        data = []
        try:
            df = load_symbol_dataframe(symbol)
            end_date = df["date"].max()
            start_date = end_date - datetime.timedelta(days=30)
            recent = df[(df["date"] >= start_date) & (df["date"] <= end_date)]
            for _, row in recent.iterrows():
                data.append({
                    "date": row["date"].strftime("%Y-%m-%d"),
                    "price": round(float(row["close"]), 2),
                    "volume": int(row["volume"])
                })
        except Exception:
            end_date = datetime.datetime.today()
            start_date = end_date - datetime.timedelta(days=30)
            ticker = yf.Ticker(symbol)
            hist = ticker.history(start=start_date, end=end_date)
            for date, row in hist.iterrows():
                data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "price": round(row["Close"], 2),
                    "volume": int(row["Volume"])
                })
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/predict/<symbol>", methods=["GET"])
def predict_stock(symbol):
    # Train prophet on dataset CSV if available; otherwise fall back to yfinance
    try:
        try:
            df_raw = load_symbol_dataframe(symbol)
            df = df_raw[["date", "close"]].rename(columns={"date": "ds", "close": "y"})
        except Exception:
            end = datetime.datetime.today()
            start = end - datetime.timedelta(days=365)
            yf_df = yf.download(symbol, start=start, end=end)
            df = yf_df.reset_index()[['Date', 'Close']].rename(columns={'Date': 'ds', 'Close': 'y'})
        model = Prophet(daily_seasonality=True)
        model.fit(df)
        future = model.make_future_dataframe(periods=7)
        forecast = model.predict(future)
        forecast_data = forecast.tail(7)[['ds', 'yhat']].to_dict(orient="records")
        for f in forecast_data:
            f['ds'] = f['ds'].strftime('%Y-%m-%d')
            f['yhat'] = round(float(f['yhat']), 2)
        return jsonify(forecast_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def _safe_div(a: float, b: float) -> float:
    return float(a) / float(b) if b not in (0, 0.0) else 0.0

@app.route("/metrics/<symbol>", methods=["GET"])
def compute_metrics(symbol):
    """
    Compute metrics using a simple train/test split on the dataset:
    - Regression: MAE, RMSE, MAPE, R2
    - Directional classification (up/down): accuracy, precision, recall, f1, confusion matrix
    """
    try:
        # Load dataset
        df_source = load_symbol_dataframe(symbol)
        df = df_source[["date", "close"]].rename(columns={"date": "ds", "close": "y"}).copy()
        # Ensure sorted by date
        df = df.sort_values("ds")
        if len(df) < 60:
            return jsonify({"error": "Not enough data to compute metrics"}), 400
        # Split: last 30 days as test
        test_len = 30
        train_df = df.iloc[:-test_len]
        test_df = df.iloc[-test_len:]
        # Fit Prophet on train
        model = Prophet(daily_seasonality=True)
        model.fit(train_df)
        # Predict through end of test period
        last_test_date = test_df["ds"].max()
        future = model.make_future_dataframe(periods=(last_test_date - train_df["ds"].max()).days)
        forecast = model.predict(future)
        # Align predictions with test dates
        forecast_test = forecast[forecast["ds"].isin(test_df["ds"])]
        # If for any reason alignment is short, inner-join
        merged = pd.merge(
            test_df[["ds","y"]],
            forecast_test[["ds","yhat"]],
            on="ds",
            how="inner"
        )
        if merged.empty:
            return jsonify({"error": "Could not align predictions with test data"}), 500
        y_true = merged["y"].astype(float).tolist()
        y_pred = merged["yhat"].astype(float).tolist()
        n = len(y_true)
        # Regression metrics
        abs_errors = [abs(y_true[i] - y_pred[i]) for i in range(n)]
        mae = sum(abs_errors) / n
        rmse = math.sqrt(sum((y_true[i] - y_pred[i])**2 for i in range(n)) / n)
        mape = 100.0 * sum(_safe_div(abs_errors[i], y_true[i]) for i in range(n)) / n
        mean_true = sum(y_true) / n
        ss_tot = sum((y_true[i] - mean_true)**2 for i in range(n))
        ss_res = sum((y_true[i] - y_pred[i])**2 for i in range(n))
        r2 = 1.0 - _safe_div(ss_res, ss_tot)
        # Directional classification: up (1) if next close > current close, else down (0)
        # Build direction on y_true using previous actual; for prediction use difference of predicted vs previous actual
        directions_true = []
        directions_pred = []
        prev_actual = None
        for i in range(n):
            if prev_actual is None:
                prev_actual = y_true[i]
                # skip first as we need prior; align lengths by skipping first
                continue
            actual_up = 1 if y_true[i] > prev_actual else 0
            pred_up = 1 if y_pred[i] > prev_actual else 0
            directions_true.append(actual_up)
            directions_pred.append(pred_up)
            prev_actual = y_true[i]
        m = len(directions_true)
        if m == 0:
            acc = prec = rec = f1 = 0.0
            tn = fp = fn = tp = 0
        else:
            tp = sum(1 for i in range(m) if directions_true[i] == 1 and directions_pred[i] == 1)
            tn = sum(1 for i in range(m) if directions_true[i] == 0 and directions_pred[i] == 0)
            fp = sum(1 for i in range(m) if directions_true[i] == 0 and directions_pred[i] == 1)
            fn = sum(1 for i in range(m) if directions_true[i] == 1 and directions_pred[i] == 0)
            acc = _safe_div(tp + tn, m)
            prec = _safe_div(tp, tp + fp)
            rec = _safe_div(tp, tp + fn)
            f1 = _safe_div(2 * prec * rec, (prec + rec)) if (prec + rec) > 0 else 0.0
        return jsonify({
            "regression": {
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "mape": round(mape, 4),
                "r2": round(r2, 4)
            },
            "classification": {
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1": round(f1, 4),
                "confusion_matrix": {"tn": tn, "fp": fp, "fn": fn, "tp": tp}
            },
            "meta": {
                "symbol": symbol,
                "test_days": n
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return "Backend is running! Try /symbols"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # get port from Railway
    app.run(host="0.0.0.0", port=port)        # listen on all addresses



# 📈 Stock Price Prediction Dashboard

[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://python.org)
[![React Version](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/username/repo)
[![Deployed](https://img.shields.io/badge/deployed-successful-brightgreen.svg)](https://your-frontend.vercel.app)

> An interactive React + Flask dashboard that visualizes historical equity prices, forecasts future prices with Prophet, and benchmarks model performance across large collections of stock datasets.

## 🌟 Demo

![Dashboard Screenshot](https://via.placeholder.com/800x400/1a1a2e/16213e?text=Stock+Price+Prediction+Dashboard)

**Live Demo:** [https://your-frontend.vercel.app](https://your-frontend.vercel.app)

## 🚀 Key Features

- **Automatic Dataset Discovery** — drop CSVs inside the dataset/ folder and they instantly appear in the UI
- **Prophet-based 7-day forecasting** with confidence intervals
- **Blended chart** (historical + forecast) with interactive tooltips
- **Comprehensive metrics overlay** (MAE, RMSE, MAPE, R², accuracy, precision, recall, F1, confusion matrix)
- **REST API with CORS enabled** for seamless frontend-backend communication
- **Automatic fallback to yfinance** if a dataset is missing
- **React Frontend + Flask Backend** fully separated for clean deployment
- **Responsive design** with glassmorphism UI elements
- **Real-time data processing** with loading states and error handling

## 🧱 Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **Recharts** - Declarative charting library
- **Lucide Icons** - Beautiful icon set
- **Custom CSS** - Glassmorphism design system

### Backend
- **Flask** - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Prophet** - Time series forecasting by Facebook
- **pandas** - Data manipulation and analysis
- **yfinance** - Market data from Yahoo! Finance

## 📂 Project Structure

```
stock-prediction-dashboard/
├── api/                    # Flask backend (app.py)
├── frontend/               # React UI
│   ├── src/
│   │   ├── components/
│   │   ├── Dashboards/
│   │   └── ...
│   └── package.json
├── dataset/               # Stock CSVs (<SYMBOL>_data.csv)
├── requirements.txt       # Backend dependencies
├── LICENSE                # MIT License
└── README.md
```

## 💻 Local Development (Full Stack)

### 1️⃣ Backend (Flask)

```bash
# Clone the repository
git clone https://github.com/username/stock-prediction-dashboard.git
cd stock-prediction-dashboard

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python api/app.py
```

The backend will be available at: `http://127.0.0.1:5000`

### 2️⃣ Frontend (React)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at: `http://localhost:3000`

> **Note:** React automatically calls the backend using this base URL (change in StockDashboard.js if needed):
> ```javascript
> const API_BASE = "http://127.0.0.1:5000";
> ```

## 🌐 Production Deployment

This project is designed for two-service deployment:

### ✅ Backend Deployment (Railway)

Railway handles heavy Python apps better than Vercel. Use it for:
- Flask
- Prophet
- pandas
- yfinance
- Multiple requests per second

**Steps:**

1. Create a new Railway project
2. Connect your GitHub repo
3. Set Root Directory = `api`
4. Set Start Command: `python app.py`
5. Make sure bottom of app.py has:
   ```python
   if __name__ == "__main__":
       port = int(os.environ.get("PORT", 8000))
       app.run(host="0.0.0.0", port=port)
   ```
6. Deploy

Railway generates a URL like: `https://your-backend.up.railway.app`

This becomes your production backend URL.

### ✅ Frontend Deployment (Vercel)

Vercel should only host the React frontend, NOT Flask.

**Steps:**

1. Import your GitHub repo into Vercel
2. Click Edit next to Root Directory
3. Set:
   - Root Directory: `frontend`
   - Framework Preset: React
4. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
5. No environment variables needed
6. Deploy

Vercel gives a URL like: `https://your-frontend.vercel.app`

### 🔗 Connecting Frontend → Backend in Production

Inside `frontend/src/Dashboards/StockDashboard.js`, set:

```javascript
const API_BASE = "https://your-backend.up.railway.app";
```

React now queries the live backend:
- `/symbols`
- `/stock/<symbol>`
- `/predict/<symbol>`
- `/metrics/<symbol>`

## 🗂️ Dataset Format

CSV files in dataset/ folder:

```csv
date,open,high,low,close,volume,Name
2013-02-08,67.7142,68.4014,66.8928,67.8542,158168416,AAPL
```

File naming convention:
- `AAPL_data.csv`
- `MSFT_data.csv`
- `TSLA_data.csv`

The backend auto-detects symbols from the dataset directory.

## 🔌 REST API Endpoints

| Route               | Method | Description                           |
|---------------------|--------|---------------------------------------|
| `/symbols`          | GET    | List dataset symbols                  |
| `/stock/<symbol>`   | GET    | Last 30 days of data                  |
| `/predict/<symbol>` | GET    | 7-day Prophet forecast                |
| `/metrics/<symbol>` | GET    | Regression + classification metrics   |

## 📊 Metrics

### Regression
- **MAE** (Mean Absolute Error)
- **RMSE** (Root Mean Square Error)
- **MAPE** (Mean Absolute Percentage Error)
- **R²** (Coefficient of Determination)

### Directional Classification
- **Accuracy**
- **Precision**
- **Recall**
- **F1** Score
- **Confusion Matrix** (TN, FP, FN, TP)

## 🧪 Benchmarking Script

Included helper script benchmarks Prophet across all datasets.

```bash
python benchmark.py
```

## 🔐 Production Tips

- Use Gunicorn or uWSGI for high traffic
- Cache heavy Prophet operations
- Add retries for yfinance API calls
- Use CDN for static frontend assets
- Implement rate limiting for API endpoints

## 🎨 Frontend Notes

- Metrics overlay uses glass effect for modern aesthetics
- Charts built with Recharts for smooth interactions
- Clean modularized dashboard design with component separation
- Responsive layout that works on all device sizes

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Facebook Prophet](https://facebook.github.io/prophet/) for the forecasting library
- [Recharts](https://recharts.org/) for the beautiful charting components
- [Lucide](https://lucide.dev/) for the icon set
- [Flask](https://flask.palletsprojects.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework

## 📞 Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - your.email@example.com

Project Link: [https://github.com/username/stock-prediction-dashboard](https://github.com/username/stock-prediction-dashboard)

---

⭐️ **Star this repo if it helped you!** ⭐️

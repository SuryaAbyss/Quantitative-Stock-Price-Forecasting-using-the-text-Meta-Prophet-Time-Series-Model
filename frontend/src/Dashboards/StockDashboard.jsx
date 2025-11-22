import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, BarChart3 } from 'lucide-react';
import './StockDashboard.css';

const API_BASE = "https://quantitative-stock-price-forecasting-using-the-t-production.up.railway.app";
const USD_TO_INR = 83; // approximate conversion; adjust as needed
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const convertToInr = (value) =>
  Number.parseFloat(((value ?? 0) * USD_TO_INR).toFixed(2));

const formatPrice = (value) => currencyFormatter.format(value ?? 0);

const formatDecimal = (value, digits = 2) =>
  Number(value ?? 0).toFixed(digits);

const transformMetrics = (metricsData) => {
  if (!metricsData || metricsData.error) return null;
  const regression = metricsData.regression || {};
  const classification = metricsData.classification || {};

  return {
    ...metricsData,
    regression: {
      ...regression,
      mae: convertToInr(regression.mae ?? 0),
      rmse: convertToInr(regression.rmse ?? 0),
      mape: Number(regression.mape ?? 0),
      r2: Number(regression.r2 ?? 0)
    },
    classification: {
      ...classification,
      accuracy: Number(classification.accuracy ?? 0),
      precision: Number(classification.precision ?? 0),
      recall: Number(classification.recall ?? 0),
      f1: Number(classification.f1 ?? 0),
      confusion_matrix: classification.confusion_matrix || {
        tn: 0, fp: 0, fn: 0, tp: 0
      }
    }
  };
};

const StockDashboard = () => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [mergedData, setMergedData] = useState([]); // merged chart data
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch symbols from backend dataset
    fetch(`${API_BASE}/symbols`)
      .then(res => res.json())
      .then(items => {
        setCompanies(items);
        if (items && items.length > 0) {
          handleStockSelect(items[0]);
        }
      })
      .catch(() => {
        setCompanies([]);
      });
    // eslint-disable-next-line
  }, []);

  const handleStockSelect = (company) => {
    setLoading(true);
    setSelectedStock(company);

    Promise.all([
      fetch(`${API_BASE}/stock/${company.symbol}`).then(res => res.json()),
      fetch(`${API_BASE}/predict/${company.symbol}`).then(res => res.json()),
      fetch(`${API_BASE}/metrics/${company.symbol}`).then(res => res.json())
    ])
      .then(([historicalData, predictionData, metricsData]) => {
        const convertedHistorical = (historicalData || []).map(d => ({
          ...d,
          price: convertToInr(d.price),
        }));
        setStockData(convertedHistorical);

        // merge historical and predicted into one dataset
        const merged = [
          ...convertedHistorical.map(d => ({ date: d.date, price: d.price })),
          ...(predictionData || []).map(d => ({
            date: d.ds,
            prediction: convertToInr(d.yhat)
          }))
        ];
        setMergedData(merged);
        setMetrics(transformMetrics(metricsData));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stock/prediction data:', err);
        setStockData([]);
        setMergedData([]);
        setMetrics(null);
        setLoading(false);
      });
  };

  const getCurrentPrice = () =>
    stockData.length ? stockData[stockData.length - 1].price : 0;

  const getPriceChange = () => {
    if (stockData.length < 2) return { change: 0, percentage: 0 };
    const current = stockData[stockData.length - 1].price;
    const previous = stockData[stockData.length - 2].price;
    const change = current - previous;
    return { change, percentage: (change / previous) * 100 };
  };

  const formatVolume = (volume) =>
    new Intl.NumberFormat('en-US', {
      notation: 'compact', maximumFractionDigits: 1
    }).format(volume);

  // remove initial hardcoded default; now handled after fetch

  const priceChange = getPriceChange();
  const isPositive = priceChange.change >= 0;

  return (
    <div className="container">
      <div className="dashboard">

        {/* Left Panel */}
        <div className="leftPanel">
          <div className="header">
            <h1 className="headerTitle">
              <BarChart3 size={24} />
              Stock Market Dashboard
            </h1>
          </div>
          <div className="companiesSection">
            <h2 className="companiesTitle">Dataset Symbols</h2>
            <div>
              {companies.map((company) => (
                <div
                  key={company.symbol}
                  onClick={() => handleStockSelect(company)}
                  className={selectedStock?.symbol === company.symbol ? "companyItemSelected" : "companyItem"}
                >
                  <div className="companySymbol">{company.symbol}</div>
                  <div className="companyName">{company.name}</div>
                  <div className="companySector">{company.sector}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="mainPanel">
          {selectedStock ? (
            <>
              <div className="stockHeader">
                <div className="stockInfo">
                  <div>
                    <h2 className="stockTitle">{selectedStock.name}</h2>
                    <p className="stockSubtitle">{selectedStock.symbol} • {selectedStock.sector}</p>
                  </div>
                  <div className="priceInfo">
                    <div className="currentPrice">{formatPrice(getCurrentPrice())}</div>
                    <div className={`priceChange ${isPositive ? 'priceChangePositive' : 'priceChangeNegative'}`}>
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {isPositive ? '+' : ''}{formatPrice(priceChange.change)} ({priceChange.percentage.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>

              <div className="chartArea">
                {loading ? (
                  <div className="loading"><div className="spinner"></div></div>
                ) : (
                  <div className="chartContainer">
                    <div className="chartHeader">
                      <h3 className="chartTitle">Price Chart (30 Days + 7-Day Forecast)</h3>
                      <div className="volumeInfo">
                        <IndianRupee size={16} /> Latest Close: {formatPrice(getCurrentPrice())}
                      </div>
                    </div>
                    <div className="chartWrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mergedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                          <YAxis domain={[dataMin => dataMin - 2, dataMax => dataMax + 2]} />

                          <Tooltip />
                          
                          {/* Historical */}
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={false}
                            name="Historical Price"
                          />
                          
                          {/* Predictions */}
                          <Line
                            type="monotone"
                            dataKey="prediction"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#f59e0b' }}
                            name="Predicted Price"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="statsGrid">
                      <div className="statItem">
                        <div className="statLabel">High</div>
                        <div className="statValue">{formatPrice(Math.max(...stockData.map(d => d.price)))}</div>
                      </div>
                      <div className="statItem">
                        <div className="statLabel">Low</div>
                        <div className="statValue">{formatPrice(Math.min(...stockData.map(d => d.price)))}</div>
                      </div>
                      <div className="statItem">
                        <div className="statLabel">Avg Volume</div>
                        <div className="statValue">{formatVolume(stockData.reduce((sum, d) => sum + d.volume, 0) / stockData.length)}</div>
                      </div>
                      <div className="statItem">
                        <div className="statLabel">Days Tracked</div>
                        <div className="statValue">{stockData.length}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Metrics Overlay */}
              {metrics && (
                <div className="metricsOverlay">
                  <div className="metricsTitle">Model Metrics (Last 30d)</div>
                  <div className="metricsSection">
                    <div className="metricsRow">
                      <span>MAE</span><span>{formatPrice(metrics.regression.mae)}</span>
                    </div>
                    <div className="metricsRow">
                      <span>RMSE</span><span>{formatPrice(metrics.regression.rmse)}</span>
                    </div>
                    <div className="metricsRow">
                      <span>MAPE</span><span>{formatDecimal(metrics.regression.mape, 2)}%</span>
                    </div>
                    <div className="metricsRow">
                      <span>R²</span><span>{formatDecimal(metrics.regression.r2, 3)}</span>
                    </div>
                  </div>
                  <div className="metricsSection">
                    <div className="metricsRow">
                      <span>Accuracy</span><span>{formatDecimal(metrics.classification.accuracy, 3)}</span>
                    </div>
                    <div className="metricsRow">
                      <span>Precision</span><span>{formatDecimal(metrics.classification.precision, 3)}</span>
                    </div>
                    <div className="metricsRow">
                      <span>Recall</span><span>{formatDecimal(metrics.classification.recall, 3)}</span>
                    </div>
                    <div className="metricsRow">
                      <span>F1</span><span>{formatDecimal(metrics.classification.f1, 3)}</span>
                    </div>
                  </div>
                  <div className="metricsSection">
                    <div className="metricsRow">
                      <span>TN</span><span>{metrics.classification.confusion_matrix.tn}</span>
                    </div>
                    <div className="metricsRow">
                      <span>FP</span><span>{metrics.classification.confusion_matrix.fp}</span>
                    </div>
                    <div className="metricsRow">
                      <span>FN</span><span>{metrics.classification.confusion_matrix.fn}</span>
                    </div>
                    <div className="metricsRow">
                      <span>TP</span><span>{metrics.classification.confusion_matrix.tp}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="emptyState">
              <BarChart3 size={64} color="#9ca3af" />
              <h3 className="emptyTitle">Select a Company</h3>
              <p className="emptyText">Choose a company from the left panel to view its stock data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;

import logo from './logo.svg';
import './App.css';
import StockDashboard from './Dashboards/StockDashboard';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StockDashboard/>} />
      </Routes>
    </Router>
  );
}

export default App;

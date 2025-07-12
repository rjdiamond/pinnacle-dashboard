import React, { useEffect, useState } from 'react';
import { fetchSheetData } from './utils/fetchSheetData';
import SalesVolumeChart from './components/SalesVolumeChart';
import PinsSoldChart from './components/PinsSoldChart';
// import EditionSetBarChart from './components/EditionSetBarChart';
import TopPinsChart from './components/TopPinsChart';
import TopSetsChart from './components/TopSetsChart';
import EditionVariantPieChart from './components/EditionVariantPieChart';
import EditionShapePieChart from './components/EditionShapePieChart';
import EditionSeriesPieChart from './components/EditionSeriesPieChart';
import TopReceiversChart from './components/TopReceiversChart';
import TopSellersChart from './components/TopSellersChart';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSheetData()
      .then(setData)
      .catch((err) => setError(err.message || 'Error loading data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard-loading">Loading data...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  // Calculate summary statistics
  const totalTransactions = data.length;
  const totalSales = data.reduce((sum, row) => sum + (parseFloat(row.price) || 0), 0);
  const totalCommission = data.reduce((sum, row) => sum + (parseFloat(row.commission_amount) || 0), 0);

  return (
    <div className="dashboard-container">
      <h1>Disney Pinnacle Marketplace Event V (July 11th - 13th)</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '0.5rem', fontSize: '1rem' }}>
        Data Updates Every 15 Minutes
      </p>
      
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-number">{totalTransactions.toLocaleString()}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">${totalSales.toLocaleString()}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">${totalCommission.toLocaleString()}</div>
          <div className="stat-label">Total Commission</div>
        </div>
      </div>
      
      <div className="charts-row">
        <div className="chart-container">
          <SalesVolumeChart data={data} />
        </div>
        
        <div className="chart-container">
          <PinsSoldChart data={data} />
        </div>
      </div>
      
      <div className="charts-row">
        <div className="chart-container">
          <TopPinsChart data={data} />
        </div>
        
        <div className="chart-container">
          <TopSetsChart data={data} />
        </div>
      </div>
      
      {/* <div className="chart-container">
        <EditionSetBarChart data={data} />
      </div> */}
      
      <div className="charts-row">
        <div className="chart-container">
          <EditionShapePieChart data={data} />
        </div>
        
        <div className="chart-container">
          <EditionVariantPieChart data={data} />
        </div>
        
        <div className="chart-container">
          <EditionSeriesPieChart data={data} />
        </div>
      </div>
      
      <div className="charts-row">
        <div className="chart-container">
          <TopReceiversChart data={data} />
        </div>
        
        <div className="chart-container">
          <TopSellersChart data={data} />
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
        Data loaded: {data.length} transactions
      </div>
    </div>
  );
}

export default App;

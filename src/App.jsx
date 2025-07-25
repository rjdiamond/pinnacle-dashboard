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
import RecentSalesTable from './components/RecentSalesTable';
import TopSalesTable from './components/TopSalesTable';
import TopBuyersByCount from './components/TopBuyersByCount';
import TopSellersByCount from './components/TopSellersByCount';
import './App.css';

// Event date ranges (in PST)
const EVENTS = {
  'All': {
    startDate: null,
    endDate: null,
    title: 'All Events (Complete History)'
  },
  'Event I': {
    startDate: new Date('2024-12-19T17:00:00.000Z'), // Dec 19, 2024 9:00 AM PST
    endDate: new Date('2024-12-23T17:15:00.000Z'),   // Dec 23, 2024 9:00 AM PST
    title: 'Event I (December 19th - 23rd, 2024)'
  },
  'Event II': {
    startDate: new Date('2025-03-21T16:00:00.000Z'), // Mar 20, 2025 9:00 AM PST
    endDate: new Date('2025-03-24T17:15:00.000Z'),   // Mar 23, 2025 11:59 PM PST
    title: 'Event II (March 20th - 23rd, 2025)'
  },
  'Event III': {
    startDate: new Date('2025-05-16T16:00:00.000Z'), // May 16, 2025 9:00 AM PST
    endDate: new Date('2025-05-20T17:15:00.000Z'),   // May 19, 2025 11:59 PM PST
    title: 'Event III (May 16th - 19th, 2025)'
  },
  'Event IV': {
    startDate: new Date('2025-06-26T16:00:00.000Z'), // Jun 26, 2025 9:00 AM PST
    endDate: new Date('2025-07-01T17:15:00.000Z'),   // Jun 30, 2025 11:59 PM PST
    title: 'Event IV (June 26th - 30th, 2025)'
  },
  'Event V': {
    startDate: new Date('2025-07-11T16:00:00.000Z'), // Jul 11, 2025 9:00 AM PDT
    endDate: new Date('2025-07-14T17:15:00.000Z'),   // Jul 14, 2025 9:05 AM PDT
    title: 'Event V (July 11th – July 14th, 2025)'
  },
  'Event VI - Live': {
    startDate: new Date('2025-07-25T16:00:00.000Z'), // Jul 11, 2025 9:00 AM PDT
    endDate: new Date('2025-07-28T17:15:00.000Z'),   // Jul 14, 2025 9:05 AM PDT
    title: 'Event VI (July 25th – July 28th, 2025)'
  }
};

function App() {
  const [data, setData] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('Event VI - Live');

  // Filter data based on selected event
  const filterDataByEvent = (fullData, eventKey) => {
    const event = EVENTS[eventKey];
    if (!event.startDate || !event.endDate) {
      return fullData;
    }
    // Robust UTC filtering
    const filtered = fullData.filter(row => {
      const utcDate = new Date(row.updated_at_block_time);
      return utcDate >= event.startDate && utcDate <= event.endDate;
    });
    // Debug: log min/max timestamps for Event V
    if (eventKey === 'Event V') {
      const timestamps = filtered.map(row => row.updated_at_block_time).sort();
      if (timestamps.length > 0) {
        console.log('Event V UTC range:', timestamps[0], 'to', timestamps[timestamps.length - 1]);
      } else {
        console.log('Event V: No transactions found in UTC window');
      }
    }
    return filtered;
  };

  useEffect(() => {
    loadData(); // Initial load
  
    const interval = setInterval(() => {
      console.log('Refreshing data...');
      loadData();
    }, 30000); // every 30 seconds
  
    return () => clearInterval(interval); // Clean up on unmount
  }, [selectedEvent]);

  const loadData = () => {
    fetchSheetData()
      .then(({ filteredData, fullData }) => {
        setFullData(fullData);
        const eventFilteredData = filterDataByEvent(fullData, selectedEvent);
        setData(eventFilteredData);
      })
      .catch((err) => setError(err.message || 'Error loading data'))
      .finally(() => setLoading(false));
  };
  

  // Handle event selection with smooth transitions
  const handleEventChange = (eventKey) => {
    if (eventKey === selectedEvent) return; // Prevent unnecessary re-renders
    
    // Add loading state for smooth transition
    setLoading(true);
    
    // Small delay to show transition
    setTimeout(() => {
      setSelectedEvent(eventKey);
      const eventFilteredData = filterDataByEvent(fullData, eventKey);
      setData(eventFilteredData);
      setLoading(false);
    }, 150);
  };

  if (loading) return <div className="dashboard-loading">Loading data...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  // Calculate summary statistics
  const totalTransactions = data.length;
  const totalSales = data.reduce((sum, row) => sum + (parseFloat(row.price) || 0), 0);
  const totalCommission = data.reduce((sum, row) => sum + (parseFloat(row.commission_amount) || 0), 0);
  
  // Calculate unique buyers and sellers
  const uniqueBuyers = new Set(data.map(row => row.receiver_username).filter(Boolean));
  const uniqueSellers = new Set(data.map(row => row.seller_username).filter(Boolean));

  return (
    <div className="dashboard-container">
      <h1>Disney Pinnacle Marketplace Events</h1>
      <h2 className="event-subtitle">{EVENTS[selectedEvent].title}</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '0.5rem', fontSize: '1rem' }}>
        Data Updates Every 5 Minutes
      </p>
      
      {/* Event Filter Buttons */}
      <div className="event-filter-container">
      <button 
          className={`event-button ${selectedEvent === 'All' ? 'active' : ''}`}
          onClick={() => handleEventChange('All')}
        >
          All
        </button>
        <button 
          className={`event-button ${selectedEvent === 'Event I' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event I')}
        >
          Event I
        </button>
        <button 
          className={`event-button ${selectedEvent === 'Event II' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event II')}
        >
          Event II
        </button>
        <button 
          className={`event-button ${selectedEvent === 'Event III' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event III')}
        >
          Event III
        </button>
        <button 
          className={`event-button ${selectedEvent === 'Event IV' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event IV')}
        >
          Event IV
        </button>
        <button 
          className={`event-button ${selectedEvent === 'Event V' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event V')}
        >
          Event V
        </button>
        <button 
          className={`live-button ${selectedEvent === 'Event VI - Live' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event VI - Live')}
        >
          Event VI - Live
        </button>
      </div>
      
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#2196F3' }}>{totalTransactions.toLocaleString()}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#2196F3' }}>${totalSales.toLocaleString()}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#2196F3' }}>${totalCommission.toLocaleString()}</div>
          <div className="stat-label">Total Commission</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#4CAF50' }}>{uniqueBuyers.size.toLocaleString()}</div>
          <div className="stat-label">Unique Buyers</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#4CAF50' }}>{uniqueSellers.size.toLocaleString()}</div>
          <div className="stat-label">Unique Sellers</div>
        </div>
      </div>
      
      <div className="charts-row">
        <div className="chart-container">
          <SalesVolumeChart data={data} selectedEvent={selectedEvent} fullData={fullData} />
        </div>
        
        <div className="chart-container">
          <PinsSoldChart data={data} selectedEvent={selectedEvent} fullData={fullData} />
        </div>
      </div>
      
      <div className="charts-row">
        <div className="chart-container">
          <TopSalesTable data={data} fullData={fullData} />
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

      <div className="charts-row">
        <div className="chart-container">
          <TopBuyersByCount data={data} />
        </div>
        <div className="chart-container">
          <TopSellersByCount data={data} />
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <RecentSalesTable data={data} fullData={fullData} />
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
        Data loaded: {data.length} transactions
      </div>
    </div>
  );
}

export default App; 

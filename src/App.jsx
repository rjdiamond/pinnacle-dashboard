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
import './App.css';

// Event date ranges
const EVENTS = {
  'All': {
    startDate: null,
    endDate: null,
    title: 'All Events (Complete History)'
  },
  'Event I': {
    startDate: new Date('2024-12-19T00:00:00.000Z'),
    endDate: new Date('2024-12-23T23:59:59.999Z'),
    title: 'Event I (December 19th - 23rd, 2024)'
  },
  'Event II': {
    startDate: new Date('2025-03-20T00:00:00.000Z'),
    endDate: new Date('2025-03-23T23:59:59.999Z'),
    title: 'Event II (March 20th - 23rd, 2025)'
  },
  'Event III': {
    startDate: new Date('2025-05-16T00:00:00.000Z'),
    endDate: new Date('2025-05-19T23:59:59.999Z'),
    title: 'Event III (May 16th - 19th, 2025)'
  },
  'Event IV': {
    startDate: new Date('2025-06-26T00:00:00.000Z'),
    endDate: new Date('2025-06-30T23:59:59.999Z'),
    title: 'Event IV (June 26th - 30th, 2025)'
  },
  'Event V': {
    startDate: new Date('2025-07-11T00:00:00.000Z'),
    endDate: new Date('2025-07-14T23:59:59.999Z'),
    title: 'Event V (July 11th - 14th, 2025)'
  }
};

function App() {
  const [data, setData] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('Event V');

  // Filter data based on selected event
  const filterDataByEvent = (fullData, eventKey) => {
    const event = EVENTS[eventKey];
    if (!event.startDate || !event.endDate) {
      return fullData; // Return all data if no date range is selected
    }
    return fullData.filter(row => {
      const rowDate = new Date(row.updated_at_block_time);
      return rowDate >= event.startDate && rowDate <= event.endDate;
    });
  };

  useEffect(() => {
    fetchSheetData()
      .then(({ filteredData, fullData }) => {
        setFullData(fullData);
        // Initially filter for Event V (default)
        const eventFilteredData = filterDataByEvent(fullData, selectedEvent);
        setData(eventFilteredData);
      })
      .catch((err) => setError(err.message || 'Error loading data'))
      .finally(() => setLoading(false));
  }, []);

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
          className={`event-button ${selectedEvent === 'All' ? 'active' : ''}`}
          onClick={() => handleEventChange('All')}
        >
          All
        </button>
      </div>
      
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

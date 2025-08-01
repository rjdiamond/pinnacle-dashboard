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
  'Event VI': {
    startDate: new Date('2025-07-25T16:00:00.000Z'), // Jul 25, 2025 9:00 AM PDT
    endDate: new Date('2025-07-28T17:15:00.000Z'),   // Jul 28, 2025 9:15 AM PDT
    title: 'Event VI (July 25th – July 28th, 2025)'
  },
  'Event VII': {
    startDate: new Date('2025-08-01T16:00:00.000Z'), // Aug 1, 2025 9:00 AM PDT
    endDate: new Date('2025-08-04T17:15:00.000Z'),   // Aug 4, 2025 9:05 AM PDT
    title: 'Event VII (August 1st – August 4th, 2025)'
  }
};

function App() {
  const [data, setData] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('Event VII');
  const [lastDataLoad, setLastDataLoad] = useState(null);
  const [dataLoadCount, setDataLoadCount] = useState(0);
//  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter data based on selected event
  const filterDataByEvent = (fullData, eventKey) => {
    const event = EVENTS[eventKey];
    if (!event.startDate || !event.endDate) {
      return fullData;
    }
    
    // Robust UTC filtering with error handling
    const filtered = fullData.filter(row => {
      if (!row.updated_at_block_time) return false;
      
      try {
        const utcDate = new Date(row.updated_at_block_time);
        // Check if the date is valid
        if (isNaN(utcDate.getTime())) {
          console.warn('Invalid date found:', row.updated_at_block_time);
          return false;
        }
        return utcDate >= event.startDate && utcDate <= event.endDate;
      } catch (error) {
        console.warn('Error parsing date:', row.updated_at_block_time, error);
        return false;
      }
    });
    
    // Debug: log min/max timestamps for all events to help troubleshoot
    if (eventKey !== 'All') {
      const validTimestamps = filtered
        .map(row => row.updated_at_block_time)
        .filter(timestamp => {
          try {
            const date = new Date(timestamp);
            return !isNaN(date.getTime());
          } catch {
            return false;
          }
        })
        .sort();
        
      const sampleDates = fullData.slice(0, 5)
        .map(row => row.updated_at_block_time)
        .filter(timestamp => timestamp); // Filter out undefined/null
      
      console.log(`${eventKey} filtering:`, {
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        totalRecords: fullData.length,
        filteredRecords: filtered.length,
        firstTransaction: validTimestamps[0] || 'None',
        lastTransaction: validTimestamps[validTimestamps.length - 1] || 'None',
        sampleDataDates: sampleDates
      });
      
      // Special debugging for Event VI
      if (eventKey === 'Event VI' && filtered.length === 0) {
        console.log('🔍 Event VI Debug - No transactions found. Checking data around that time period...');
        const julyTransactions = fullData.filter(row => {
          if (!row.updated_at_block_time) return false;
          try {
            const date = new Date(row.updated_at_block_time);
            if (isNaN(date.getTime())) return false;
            return date.getMonth() === 6 && date.getFullYear() === 2025; // July 2025
          } catch {
            return false;
          }
        });
        console.log(`Found ${julyTransactions.length} transactions in July 2025:`, 
          julyTransactions.slice(0, 3).map(row => ({
            date: row.updated_at_block_time,
            price: row.price
          }))
        );
      }
    }
    
    return filtered;
  };

  useEffect(() => {
    loadData(); // Initial load only
  }, []); // Remove selectedEvent dependency

  useEffect(() => {
    // Auto-refresh only for live events, but don't reload when switching events
    let interval;
  
    if (selectedEvent === 'Event VII') {  // For auto-refresh && autoRefresh)
      interval = setInterval(() => {
        console.log('[Live] Auto-refreshing...');
        loadData();
      }, 60000); // every 60 seconds
    }
  
    return () => clearInterval(interval);
  }, [selectedEvent]); // Only for auto-refresh setup

  const loadData = () => {
    const now = new Date();
    setLastDataLoad(now);
    setDataLoadCount(prev => prev + 1);
    
    console.log(`[Data Load #${dataLoadCount + 1}] Fetching fresh data at ${now.toLocaleTimeString()}`);
    
    fetchSheetData()
      .then(({ filteredData, fullData }) => {
        setFullData(fullData);
        
        // Analyze the date range of your data with error handling
        if (fullData.length > 0) {
          try {
            const validDates = fullData
              .map(row => {
                if (!row.updated_at_block_time) return null;
                try {
                  const date = new Date(row.updated_at_block_time);
                  return isNaN(date.getTime()) ? null : date;
                } catch {
                  return null;
                }
              })
              .filter(date => date !== null)
              .sort((a, b) => a - b);
              
            const invalidDates = fullData.filter(row => {
              if (!row.updated_at_block_time) return true;
              try {
                const date = new Date(row.updated_at_block_time);
                return isNaN(date.getTime());
              } catch {
                return true;
              }
            });
            
            console.log('📊 Data Range Analysis:', {
              totalRecords: fullData.length,
              validDates: validDates.length,
              invalidDates: invalidDates.length,
              earliestTransaction: validDates[0]?.toISOString() || 'None',
              latestTransaction: validDates[validDates.length - 1]?.toISOString() || 'None',
              eventVIRange: `${EVENTS['Event VI'].startDate.toISOString()} to ${EVENTS['Event VI'].endDate.toISOString()}`,
              sampleInvalidDates: invalidDates.slice(0, 3).map(row => row.updated_at_block_time)
            });
          } catch (error) {
            console.error('Error analyzing data range:', error);
          }
        }
        
        const eventFilteredData = filterDataByEvent(fullData, selectedEvent);
        setData(eventFilteredData);
        console.log(`[Data Load Complete] ${fullData.length} total records, ${eventFilteredData.length} for ${selectedEvent}`);
      })
      .catch((err) => setError(err.message || 'Error loading data'))
      .finally(() => setLoading(false));
  };
  

  // Handle event selection with smooth transitions (no data reload needed)
  const handleEventChange = (eventKey) => {
    if (eventKey === selectedEvent) return; // Prevent unnecessary re-renders
    
    console.log(`Switching to ${eventKey} (filtering existing data)`);
    
    // Small delay to show transition
    setTimeout(() => {
      setSelectedEvent(eventKey);
      // Filter existing fullData instead of reloading
      const eventFilteredData = filterDataByEvent(fullData, eventKey);
      setData(eventFilteredData);
    }, 150);
  };

  if (loading) return <div className="dashboard-loading">Loading data...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  // Calculate summary statistics with error handling
  const totalTransactions = data ? data.length : 0;
  const totalSales = data ? data.reduce((sum, row) => {
    const price = parseFloat(row.price);
    return sum + (isNaN(price) ? 0 : price);
  }, 0) : 0;
  const totalCommission = data ? data.reduce((sum, row) => {
    const commission = parseFloat(row.commission_amount);
    return sum + (isNaN(commission) ? 0 : commission);
  }, 0) : 0;
  
  // Calculate unique buyers and sellers with error handling
  const uniqueBuyers = data ? new Set(data.map(row => row.receiver_username).filter(Boolean)) : new Set();
  const uniqueSellers = data ? new Set(data.map(row => row.seller_username).filter(Boolean)) : new Set();

  return (
    <div className="dashboard-container">
      <h1>Disney Pinnacle Marketplace Events</h1>
      <h2 className="event-subtitle">{EVENTS[selectedEvent].title}</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '0.5rem', fontSize: '1rem' }}>
        Data Auto-Refreshes During Live Events
        {lastDataLoad && (
          <span style={{ display: 'block', fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>
            Last updated locally: {lastDataLoad.toLocaleTimeString()} | Local refresh: #{dataLoadCount}
          </span>
        )}
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
          className={`event-button ${selectedEvent === 'Event VI' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event VI')}
        >
          Event VI
        </button>
        <button 
          className={`live-button ${selectedEvent === 'Event VII' ? 'active' : ''}`}
          onClick={() => handleEventChange('Event VII')}
        >
          Event VII
        </button>
        <button 
          className="giveaway-button"
          onClick={() => window.open('https://x.com/DiamondNFL/status/1951364965518254269', '_blank')}
        >
          Giveaway (Active!)
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
          <RecentSalesTable data={data} fullData={fullData} />
        </div>
      </div>

      <div className="charts-row">
      <div className="chart-container">
          <TopSalesTable data={data} fullData={fullData} />
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
      
      <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
        Data loaded: {data.length} transactions
      </div>
    </div>
  );
}

export default App; 

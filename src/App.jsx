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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'usersearch'
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [lastSearchInput, setLastSearchInput] = useState('');

  // Pin Data tab state
  const [pinTabInput, setPinTabInput] = useState('');
  const [pinTabResults, setPinTabResults] = useState([]);
  const [pinTabSubmitted, setPinTabSubmitted] = useState(false);
  const [pinTabSuggestions, setPinTabSuggestions] = useState([]);
  const [lastPinTabInput, setLastPinTabInput] = useState('');

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

  // --- User Search Logic ---
  const handleUserSearch = (e) => {
    e.preventDefault();
    setSearchSubmitted(true);
    setLastSearchInput(searchInput);
    let results = [];
    const input = searchInput.trim();
    if (!input) {
      setSearchResults([]);
      return;
    }
    // Detect if input is a wallet address (hex, 12+ chars, with or without 0x)
    const isWallet = /^0x?[a-fA-F0-9]{12,}$/.test(input);
    if (isWallet) {
      // Normalize input: remove 0x if present, lowercase
      let normalized = input.toLowerCase().replace(/^0x/, '');
      results = fullData.filter(row => {
        // Normalize both addresses: remove 0x if present, lowercase
        const buyer = (row.receiver_flowAddress || '').toLowerCase().replace(/^0x/, '');
        const seller = (row.seller_flowAddress || '').toLowerCase().replace(/^0x/, '');
        return buyer === normalized || seller === normalized;
      });
    } else {
      // Treat as username (case-insensitive)
      const lowerInput = input.toLowerCase();
      results = fullData.filter(row =>
        (row.receiver_username && row.receiver_username.toLowerCase() === lowerInput) ||
        (row.seller_username && row.seller_username.toLowerCase() === lowerInput)
      );
    }
    setSearchResults(results);
  };

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
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          style={{ padding: '0.5rem 1.5rem', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #2196F3', background: activeTab === 'dashboard' ? '#2196F3' : '#fff', color: activeTab === 'dashboard' ? '#fff' : '#2196F3', cursor: 'pointer' }}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'usersearch' ? 'active' : ''}
          style={{ padding: '0.5rem 1.5rem', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #4CAF50', background: activeTab === 'usersearch' ? '#4CAF50' : '#fff', color: activeTab === 'usersearch' ? '#fff' : '#4CAF50', cursor: 'pointer' }}
          onClick={() => setActiveTab('usersearch')}
        >
          User Search
        </button>
        <button
          className={activeTab === 'pindata' ? 'active' : ''}
          style={{ padding: '0.5rem 1.5rem', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #ff9800', background: activeTab === 'pindata' ? '#ff9800' : '#fff', color: activeTab === 'pindata' ? '#fff' : '#ff9800', cursor: 'pointer' }}
          onClick={() => setActiveTab('pindata')}
        >
          Pin Data
        </button>
      </div>
      {activeTab === 'pindata' && (
        <React.Fragment>
          <h1>Disney Pinnacle Marketplace Pin Data</h1>
          <div className="charts-row">
            <div className="chart-container">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, marginTop: 24, position: 'relative' }}>
                <form onSubmit={e => {
                  e.preventDefault();
                  setPinTabSubmitted(true);
                  setLastPinTabInput(pinTabInput);
                  // Search for pin name containing the input anywhere (case-insensitive)
                  const input = pinTabInput.trim().toLowerCase();
                  const results = fullData.filter(row => {
                    const set = row.nft_edition_set_truncatedName || '';
                    const shape = row.nft_edition_shape_name || '';
                    const variant = row.nft_edition_variant || '';
                    const pinName = `${set} - ${shape}${variant ? ' - ' + variant : ''}`.toLowerCase();
                    return pinName.includes(input);
                  });
                  setPinTabResults(results);
                }} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: '45%', minWidth: 320 }}>
                  <input
                    type="text"
                    placeholder="Search a pin by Set, Shape, or Variant..."
                    value={pinTabInput}
                    onChange={e => {
                      setPinTabInput(e.target.value);
                      setPinTabSubmitted(false);
                      // Dynamic suggestions
                      const val = e.target.value.trim().toLowerCase();
                      if (!val) {
                        setPinTabSuggestions([]);
                        return;
                      }
                      // Build unique pin names
                      const pinNames = Array.from(new Set(fullData.map(row => {
                        const set = row.nft_edition_set_truncatedName || '';
                        const shape = row.nft_edition_shape_name || '';
                        const variant = row.nft_edition_variant || '';
                        return `${set} - ${shape}${variant ? ' - ' + variant : ''}`;
                      })));
                      setPinTabSuggestions(
                        pinNames.filter(name => name.toLowerCase().includes(val)).slice(0, 10)
                      );
                    }}
                    style={{ flex: 1, minWidth: 200, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
                  />
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: 4, background: '#ff9800', color: '#fff', fontWeight: 'bold', border: 'none', fontSize: 16, cursor: 'pointer' }}>Search</button>
                  {/* Suggestions dropdown */}
                  {pinTabSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      zIndex: 10,
                      maxHeight: 220,
                      overflowY: 'auto',
                      boxShadow: '0 2px 8px #0002',
                    }}>
                      {pinTabSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          style={{ padding: 10, cursor: 'pointer', borderBottom: idx !== pinTabSuggestions.length - 1 ? '1px solid #eee' : 'none' }}
                          onClick={() => {
                            setPinTabInput(suggestion);
                            setPinTabSuggestions([]);
                            setPinTabSubmitted(true);
                            setLastPinTabInput(suggestion);
                            // Search for pin name containing the suggestion anywhere (case-insensitive)
                            const input = suggestion.trim().toLowerCase();
                            const results = fullData.filter(row => {
                              const set = row.nft_edition_set_truncatedName || '';
                              const shape = row.nft_edition_shape_name || '';
                              const variant = row.nft_edition_variant || '';
                              const pinName = `${set} - ${shape}${variant ? ' - ' + variant : ''}`.toLowerCase();
                              return pinName.includes(input);
                            });
                            setPinTabResults(results);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
              {pinTabResults.length === 0 && pinTabSubmitted && pinTabInput && (
                <div style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>No results found.</div>
              )}
              {pinTabResults.length > 0 && pinTabSubmitted && (
                <React.Fragment>
                  {/* Pin Data Summary Row */}
                  {(() => {
                    // Pin name from input
                    const pinName = lastPinTabInput;
                    const totalSales = pinTabResults.length;
                    const totalVolume = pinTabResults.reduce((sum, row) => sum + (parseFloat(row.price) || 0), 0);
                    const avgPrice = totalSales > 0 ? totalVolume / totalSales : 0;
                    const fmt = n => `$${n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                    return (
                      <table className="usersearch-results-table" style={{ minWidth: 320, borderCollapse: 'collapse', marginBottom: 12, background: '#f7faff', borderRadius: 8, boxShadow: '0 1px 6px #0001', width: '80%' }}>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 600, padding: 8, color: '#ff9800' }}>Pin Information</td>
                            <td style={{ padding: 8 }}>Total Sales Volume {fmt(totalVolume)}</td>
                            <td style={{ padding: 8 }}>Total Sales: {totalSales}</td>
                            <td style={{ padding: 8 }}>Average Price: {fmt(avgPrice)}</td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}
                  <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 16 }}>
                    <table className="usersearch-results-table" style={{ minWidth: 320, borderCollapse: 'collapse', fontSize: 15, width: 'auto' }}>
                      <thead>
                        <tr style={{ background: '#e3e3e3' }}>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Date</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Buyer</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Seller</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Price</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Commission</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Serial #</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Pin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pinTabResults.map((row, idx) => {
                          // Serial number logic from TopSalesTable
                          const serial = row.nft_serial_number || row.serial_number;
                          let serialDisplay = '-';
                          if (
                            serial !== undefined &&
                            serial !== null &&
                            serial !== '' &&
                            serial !== 'null' &&
                            serial !== 'undefined'
                          ) {
                            serialDisplay = `#${serial}`;
                          }
                          return (
                            <tr key={idx}>
                              <td style={{ padding: 8, border: '1px solid #eee' }}>{row.updated_at_block_time ? new Date(row.updated_at_block_time).toLocaleString() : ''}</td>
                              <td style={{ padding: 8, border: '1px solid #eee' }}>{row.receiver_username || row.receiver_flowAddress || row.receiver_address}</td>
                              <td style={{ padding: 8, border: '1px solid #eee' }}>{row.seller_username || row.seller_flowAddress || row.seller_address}</td>
                              <td style={{ padding: 8, border: '1px solid #eee' }}>${parseFloat(row.price).toLocaleString()}</td>
                              <td style={{ padding: 8, border: '1px solid #eee' }}>${parseFloat(row.commission_amount).toLocaleString()}</td>
                              <td style={{ padding: 8, border: '1px solid #eee' }}>{serialDisplay}</td>
                              <td style={{ padding: 8, border: '1px solid #eee' }}>{(() => {
                                const set = row.nft_edition_set_truncatedName || 'Unknown';
                                const shape = row.nft_edition_shape_name || 'Unknown';
                                const variant = row.nft_edition_variant || '';
                                let pin = `${set} - ${shape}`;
                                if (variant) pin += ` - ${variant}`;
                                if ((set === 'Unknown' && shape === 'Unknown' && !variant)) {
                                  return row.pin_name || row.pin_id || '';
                                }
                                return pin;
                              })()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ color: '#888', textAlign: 'right', marginTop: 8 }}>
                      Showing {pinTabResults.length} result{pinTabResults.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        </React.Fragment>
      )}

      {activeTab === 'dashboard' && (
        <React.Fragment>
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
              onClick={() => window.open('https://twitter.com', '_blank')}
            >
              Giveaway
            </button>
          </div>
          {/* End User Search chart-container */}
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
            <div className="chart-container usersearch-chart-container">
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
        </React.Fragment>
      )}

      {activeTab === 'usersearch' && (
        <React.Fragment>
          <h1>Disney Pinnacle Marketplace User Search</h1>
          <div className="charts-row">
            <div className="chart-container">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, marginTop: 24 }}>
                <form onSubmit={handleUserSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: '45%', minWidth: 320 }}>
                  <input
                    type="text"
                    placeholder="Search a collectors username or wallet address here..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    style={{ flex: 1, minWidth: 200, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
                  />
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: 4, background: '#4CAF50', color: '#fff', fontWeight: 'bold', border: 'none', fontSize: 16, cursor: 'pointer' }}>Search</button>
                </form>
              </div>
              {searchResults.length === 0 && searchSubmitted && searchInput && (
                <div style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>No results found.</div>
              )}
              {searchResults.length > 0 && searchSubmitted && (
                <React.Fragment>
                  {/* User Search Calculations */}
                {lastSearchInput && (() => {
                  const input = lastSearchInput.trim();
                  const isWallet = /^0x?[a-fA-F0-9]{12,}$/.test(input);
                  let lowerInput = input.toLowerCase();
                  let purchases = [], sales = [];
                  let normalized = lowerInput.startsWith('0x') ? lowerInput.slice(2) : lowerInput;
                  // Use flowAddress for wallet search, like TopSalesTable
                  if (isWallet) {
                    purchases = searchResults.filter(row => {
                      const buyer = (row.receiver_flowAddress || row.receiver_address || '').toLowerCase().replace(/^0x/, '');
                      return buyer === normalized;
                    });
                    sales = searchResults.filter(row => {
                      const seller = (row.seller_flowAddress || row.seller_address || '').toLowerCase().replace(/^0x/, '');
                      return seller === normalized;
                    });
                  } else {
                    purchases = searchResults.filter(row => (row.receiver_username && row.receiver_username.toLowerCase() === lowerInput));
                    sales = searchResults.filter(row => (row.seller_username && row.seller_username.toLowerCase() === lowerInput));
                  }

                  // Find associated username and wallet address (match by role)
                  let accountUsername = '';
                  let accountWallet = '';
                  if (isWallet) {
                    // Prefer receiver_username if wallet is a buyer, else seller_username
                    const matchBuyer = fullData.find(row => {
                      const buyer = (row.receiver_flowAddress || '').toLowerCase().replace(/^0x/, '');
                      return buyer === normalized && row.receiver_username;
                    });
                    const matchSeller = fullData.find(row => {
                      const seller = (row.seller_flowAddress || '').toLowerCase().replace(/^0x/, '');
                      return seller === normalized && row.seller_username;
                    });
                    accountWallet = input.startsWith('0x') ? input : '0x' + input;
                    accountUsername = matchBuyer ? matchBuyer.receiver_username : (matchSeller ? matchSeller.seller_username : '');
                  } else {
                    // Prefer receiver_flowAddress if username is a buyer, else seller_flowAddress
                    const matchBuyer = fullData.find(row =>
                      row.receiver_username && row.receiver_username.toLowerCase() === lowerInput && row.receiver_flowAddress
                    );
                    const matchSeller = fullData.find(row =>
                      row.seller_username && row.seller_username.toLowerCase() === lowerInput && row.seller_flowAddress
                    );
                    accountUsername = input;
                    accountWallet = matchBuyer ? matchBuyer.receiver_flowAddress : (matchSeller ? matchSeller.seller_flowAddress : '');
                    if (accountWallet && !accountWallet.startsWith('0x')) accountWallet = '0x' + accountWallet;
                  }

                  const totalSpent = purchases.reduce((sum, row) => sum + (parseFloat(row.price) || 0), 0);
                  const purchaseCount = purchases.length;
                  const avgSpent = purchaseCount > 0 ? totalSpent / purchaseCount : 0;
                  const totalEarned = sales.reduce((sum, row) => sum + (parseFloat(row.price) || 0), 0);
                  const salesCount = sales.length;
                  const avgEarned = salesCount > 0 ? totalEarned / salesCount : 0;
                  const netVolume = totalEarned - totalSpent;
                  const totalTransactions = purchaseCount + salesCount;
                  const fmt = n => `$${n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                  // CSV download handler
                  const handleDownloadCSV = () => {
                    const headers = ['Date','Buyer','Seller','Price','Commission','Pin'];
                    const rows = searchResults.map(row => {
                      const date = row.updated_at_block_time ? new Date(row.updated_at_block_time).toLocaleString() : '';
                      const buyer = row.receiver_username || row.receiver_flowAddress || row.receiver_address || '';
                      const seller = row.seller_username || row.seller_flowAddress || row.seller_address || '';
                      const price = row.price !== undefined ? `$${parseFloat(row.price).toLocaleString()}` : '';
                      const commission = row.commission_amount !== undefined ? `$${parseFloat(row.commission_amount).toLocaleString()}` : '';
                      // Pin logic matches table
                      const set = row.nft_edition_set_truncatedName || 'Unknown';
                      const shape = row.nft_edition_shape_name || 'Unknown';
                      const variant = row.nft_edition_variant || '';
                      let pin = `${set} - ${shape}`;
                      if (variant) pin += ` - ${variant}`;
                      if ((set === 'Unknown' && shape === 'Unknown' && !variant)) {
                        pin = row.pin_name || row.pin_id || '';
                      }
                      return [date, buyer, seller, price, commission, pin];
                    });
                    let csv = headers.join('\t') + '\n';
                    csv += rows.map(r => r.map(field => String(field).replace(/\t/g, ' ')).join('\t')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'user_search_results.csv';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 100);
                  };
                  return (
                    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ marginBottom: 10, fontWeight: 500, fontSize: 17, color: '#333', textAlign: 'center' }}>
                        Account Username: <span style={{ color: '#2196F3', fontWeight: 600 }}>{accountUsername || 'N/A'}</span> &nbsp; | &nbsp; Wallet Address: <span style={{ color: '#4CAF50', fontWeight: 600 }}>{accountWallet || 'N/A'}</span>
                        &nbsp; | &nbsp;
                        <span style={{ color: '#2196F3', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={handleDownloadCSV} title="Download visible results as CSV">Download Results</span>
                      </div>
                      <table className="usersearch-results-table" style={{ minWidth: 320, borderCollapse: 'collapse', marginBottom: 12, background: '#f7faff', borderRadius: 8, boxShadow: '0 1px 6px #0001', width: '80%' }}>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 600, padding: 8, color: '#2196F3' }}>Buying Activity</td>
                            <td style={{ padding: 8 }}>Total Spent {fmt(totalSpent)}</td>
                            <td style={{ padding: 8 }}>Purchases: {purchaseCount}</td>
                            <td style={{ padding: 8 }}>Average: {fmt(avgSpent)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, padding: 8, color: '#4CAF50' }}>Selling Activity</td>
                            <td style={{ padding: 8 }}>Total Earned {fmt(totalEarned)}</td>
                            <td style={{ padding: 8 }}>Sales: {salesCount}</td>
                            <td style={{ padding: 8 }}>Average: {fmt(avgEarned)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, padding: 8, color: '#333' }}>Summary</td>
                            <td style={{ padding: 8 }}>Net Volume {fmt(netVolume)}</td>
                            <td style={{ padding: 8 }}>Total Transactions: {totalTransactions}</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                <div style={{ maxHeight: 400, overflowY: 'auto', marginTop: 16 }}>
                  <table className="usersearch-results-table" style={{ minWidth: 320, borderCollapse: 'collapse', fontSize: 15, width: 'auto' }}>
                    <thead>
                      <tr style={{ background: '#e3e3e3' }}>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Buyer</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Seller</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Price</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Commission</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Pin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((row, idx) => {
                        // Determine highlight: green if searched user/wallet is buyer, red if seller
                        let highlight = '';
                        const input = searchInput.trim();
                        const isWallet = /^0x?[a-fA-F0-9]{12,}$/.test(input);
                        let normalized = input.toLowerCase();
                        if (isWallet) {
                          normalized = normalized.startsWith('0x') ? normalized.slice(2) : normalized;
                          const buyer = (row.receiver_flowAddress || row.receiver_address || '').toLowerCase().replace(/^0x/, '');
                          const seller = (row.seller_flowAddress || row.seller_address || '').toLowerCase().replace(/^0x/, '');
                          if (buyer === normalized) highlight = 'green';
                          else if (seller === normalized) highlight = 'red';
                        } else {
                          if (row.receiver_username && row.receiver_username.toLowerCase() === normalized) highlight = 'green';
                          else if (row.seller_username && row.seller_username.toLowerCase() === normalized) highlight = 'red';
                        }
                        let rowStyle = { background: highlight === 'green' ? '#eafbe7' : highlight === 'red' ? '#fdeaea' : undefined, transition: 'background 0.2s' };
                        return (
                          <tr key={idx} style={rowStyle} onMouseOver={e => e.currentTarget.style.background='#f0f7ff'} onMouseOut={e => e.currentTarget.style.background=rowStyle.background || ''}>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{row.updated_at_block_time ? new Date(row.updated_at_block_time).toLocaleString() : ''}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{row.receiver_username || row.receiver_flowAddress || row.receiver_address}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>{row.seller_username || row.seller_flowAddress || row.seller_address}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>${parseFloat(row.price).toLocaleString()}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>${parseFloat(row.commission_amount).toLocaleString()}</td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                              {(() => {
                                // Match TopSalesTable: use nft_edition_set_truncatedName, nft_edition_shape_name, nft_edition_variant
                                const set = row.nft_edition_set_truncatedName || 'Unknown';
                                const shape = row.nft_edition_shape_name || 'Unknown';
                                const variant = row.nft_edition_variant || '';
                                let pin = `${set} - ${shape}`;
                                if (variant) pin += ` - ${variant}`;
                                // If all are Unknown or empty, fallback
                                if ((set === 'Unknown' && shape === 'Unknown' && !variant)) {
                                  return row.pin_name || row.pin_id || '';
                                }
                                return pin;
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ color: '#888', textAlign: 'right', marginTop: 8 }}>
                    Showing {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                </div>
                </React.Fragment>
              )}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

export default App;
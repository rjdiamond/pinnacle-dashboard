import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Event date ranges for color coding (in PST)
const EVENTS = {
  'Event I': {
    startDate: new Date('2024-12-19T17:00:00.000Z'), // Dec 19, 2024 9:00 AM PST
    endDate: new Date('2024-12-24T07:59:59.999Z'),   // Dec 23, 2024 11:59 PM PST
    color: '#FF6B6B' // Red
  },
  'Event II': {
    startDate: new Date('2025-03-20T17:00:00.000Z'), // Mar 20, 2025 9:00 AM PST
    endDate: new Date('2025-03-24T07:59:59.999Z'),   // Mar 23, 2025 11:59 PM PST
    color: '#4ECDC4' // Teal
  },
  'Event III': {
    startDate: new Date('2025-05-16T17:00:00.000Z'), // May 16, 2025 9:00 AM PST
    endDate: new Date('2025-05-20T07:59:59.999Z'),   // May 19, 2025 11:59 PM PST
    color: '#45B7D1' // Blue
  },
  'Event IV': {
    startDate: new Date('2025-06-26T17:00:00.000Z'), // Jun 26, 2025 9:00 AM PST
    endDate: new Date('2025-07-01T07:59:59.999Z'),   // Jun 30, 2025 11:59 PM PST
    color: '#96CEB4' // Green
  },
  'Event V': {
    startDate: new Date('2025-07-11T16:00:00.000Z'), // Jul 11, 2025 9:00 AM PST
    endDate: new Date('2025-07-15T06:59:59.999Z'),   // Jul 14, 2025 11:59 PM PST
    color: '#FFEAA7' // Yellow
  }
};

function groupByHourSum(data, dateKey, valueKey) {
  const result = {};
  data.forEach(row => {
    const dateTime = row[dateKey];
    if (!dateTime) return;
    
    // Convert to PST and extract hour
    const utcDate = new Date(dateTime);
    const pstDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dateHour = pstDate.toISOString().slice(0, 13); // YYYY-MM-DD HH
    const value = parseFloat(row[valueKey]) || 0;
    if (!result[dateHour]) result[dateHour] = 0;
    result[dateHour] += value;
  });
  return result;
}

function groupByDaySum(data, dateKey, valueKey) {
  const result = {};
  data.forEach(row => {
    const dateTime = row[dateKey];
    if (!dateTime) return;
    
    // Convert to PST and extract day
    const utcDate = new Date(dateTime);
    const pstDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dateDay = pstDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const value = parseFloat(row[valueKey]) || 0;
    if (!result[dateDay]) result[dateDay] = 0;
    result[dateDay] += value;
  });
  return result;
}

function groupByDaySumByEvent(data, dateKey, valueKey) {
  const result = {};
  
  // Initialize result structure for each event
  Object.keys(EVENTS).forEach(eventKey => {
    result[eventKey] = {};
  });
  
  // Add "Other Sales" category for data outside events
  result['Other Sales'] = {};
  
  data.forEach(row => {
    const dateTime = row[dateKey];
    if (!dateTime) return;
    
    const rowDate = new Date(dateTime);
    let eventKey = null;
    
    // Determine which event this row belongs to (with 1-day buffer)
    for (const [key, event] of Object.entries(EVENTS)) {
      const bufferStart = new Date(event.startDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
      const bufferEnd = new Date(event.endDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after
      
      if (rowDate >= bufferStart && rowDate <= bufferEnd) {
        eventKey = key;
        break;
      }
    }
    
    // If not in any event (including buffers), categorize as "Other Sales"
    if (!eventKey) {
      eventKey = 'Other Sales';
    }
    
    // Use original timestamp without PST conversion for "All" view
    const dateDay = rowDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const value = parseFloat(row[valueKey]) || 0;
    
    if (!result[eventKey][dateDay]) result[eventKey][dateDay] = 0;
    result[eventKey][dateDay] += value;
  });
  
  return result;
}

function formatTimeLabel(dateHourString) {
  const date = new Date(dateHourString + ':00:00.000Z');
  const pstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const hour = pstDate.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${ampm}`;
}

function formatDayLabel(dateDayString) {
  const date = new Date(dateDayString + 'T00:00:00.000Z');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

export default function SalesVolumeChart({ data, selectedEvent, fullData }) {
  let chartData;
  
  if (selectedEvent === 'All') {
    // Group data by event for color coding
    const groupedByEvent = groupByDaySumByEvent(fullData, 'updated_at_block_time', 'price');
    
    // Get all unique time labels
    const allLabels = new Set();
    Object.values(groupedByEvent).forEach(eventData => {
      Object.keys(eventData).forEach(label => allLabels.add(label));
    });
    const labels = Array.from(allLabels).sort();
    const formattedLabels = labels.map(label => formatDayLabel(label));
    
    // Create datasets for each event
    const datasets = Object.entries(groupedByEvent).map(([eventKey, eventData]) => {
      const values = labels.map(day => eventData[day] || 0);
      return {
        label: eventKey,
        data: values,
        backgroundColor: eventKey === 'Other Sales' ? '#E0E0E0' : EVENTS[eventKey].color,
        borderColor: eventKey === 'Other Sales' ? '#B0B0B0' : EVENTS[eventKey].color,
        borderWidth: 1,
      };
    });
    
    chartData = {
      labels: formattedLabels,
      datasets: datasets,
    };
  } else {
    // Single event - use original logic
    const grouped = groupByHourSum(data, 'updated_at_block_time', 'price');
    const labels = Object.keys(grouped).sort();
    const values = labels.map(hour => grouped[hour]);
    const formattedLabels = labels.map(label => formatTimeLabel(label));

    chartData = {
      labels: formattedLabels,
      datasets: [
        {
          label: 'Total Sales Volume',
          data: values,
          backgroundColor: '#4f8cff',
        },
      ],
    };
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Sales Volume by {selectedEvent === 'All' ? 'Day' : 'Hour'} {selectedEvent === 'All' ? '' : '(PST)'}</h2>
      <Bar data={chartData} options={{
        responsive: true,
        plugins: { 
          legend: { 
            display: selectedEvent === 'All',
            position: 'top'
          } 
        },
        scales: { 
          x: { 
            title: { 
              display: true, 
              text: selectedEvent === 'All' ? 'Date' : 'Time (PST)' 
            } 
          }, 
          y: { 
            title: { 
              display: true, 
              text: 'Total Price' 
            } 
          } 
        }
      }} />
    </div>
  );
} 
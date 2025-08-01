import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Event date ranges for color coding (in PST)
const EVENTS = {
  'Event I': {
    startDate: new Date('2024-12-19T17:00:00.000Z'), // Dec 19, 2024 9:00 AM PST
    endDate: new Date('2024-12-23T17:15:00.000Z'),   // Dec 23, 2024 9:00 AM PST
    color: '#FF6B6B' // Red
  },
  'Event II': {
    startDate: new Date('2025-03-21T16:00:00.000Z'), // Mar 20, 2025 9:00 AM PST
    endDate: new Date('2025-03-24T17:15:00.000Z'),   // Mar 23, 2025 11:59 PM PST
    color: '#4ECDC4' // Teal
  },
  'Event III': {
    startDate: new Date('2025-05-16T16:00:00.000Z'), // May 16, 2025 9:00 AM PST
    endDate: new Date('2025-05-20T17:15:00.000Z'),   // May 19, 2025 11:59 PM PST
    color: '#45B7D1' // Blue
  },
  'Event IV': {
    startDate: new Date('2025-06-26T16:00:00.000Z'), // Jun 26, 2025 9:00 AM PST
    endDate: new Date('2025-07-01T17:15:00.000Z'),   // Jun 30, 2025 11:59 PM PST
    color: '#96CEB4' // Green
  },
  'Event V': {
    startDate: new Date('2025-07-11T16:00:00.000Z'), // Jul 11, 2025 9:00 AM PDT
    endDate: new Date('2025-07-14T17:15:00.000Z'),   // Jul 14, 2025 9:05 AM PDT
    color: '#FFEAA7' // Yellow
  },
  'Event VI': {
    startDate: new Date('2025-07-25T16:00:00.000Z'), // Jul 25, 2025 9:00 AM PDT
    endDate: new Date('2025-07-28T17:15:00.000Z'),   // Jul 28, 2025 9:15 AM PDT
    color: '#DDA0DD' // Plum
  },
  'Event VII': {
    startDate: new Date('2025-08-01T16:00:00.000Z'), // Aug 1, 2025 9:00 AM PDT
    endDate: new Date('2025-08-04T17:15:00.000Z'),   // Aug 4, 2025 9:05 AM PDT
    color: '#FF4757' // Red (live event)
  }
};

function groupByHourCount(data, dateKey) {
  const result = {};
  data.forEach(row => {
    const dateTime = row[dateKey];
    if (!dateTime) return;
    
    // Convert to PST and extract hour
    const utcDate = new Date(dateTime);
    const pstDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dateHour = pstDate.toISOString().slice(0, 13); // YYYY-MM-DD HH
    if (!result[dateHour]) result[dateHour] = 0;
    result[dateHour] += 1;
  });
  return result;
}

function groupByDayCount(data, dateKey) {
  const result = {};
  data.forEach(row => {
    const dateTime = row[dateKey];
    if (!dateTime) return;
    
    // Convert to PST and extract day
    const utcDate = new Date(dateTime);
    const pstDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dateDay = pstDate.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!result[dateDay]) result[dateDay] = 0;
    result[dateDay] += 1;
  });
  return result;
}

function groupByDayCountByEvent(data, dateKey) {
  const result = {};
  
  // Initialize result structure for each event only
  Object.keys(EVENTS).forEach(eventKey => {
    result[eventKey] = {};
  });
  
  data.forEach(row => {
    const dateTime = row[dateKey];
    if (!dateTime) return;
    
    const rowDate = new Date(dateTime); // UTC date from data
    let eventKey = null;
    
    // Determine which event this row belongs to (exact date range, no buffer)
    for (const [key, event] of Object.entries(EVENTS)) {
      if (rowDate >= event.startDate && rowDate <= event.endDate) {
        eventKey = key;
        break;
      }
    }
    
    // Only include data that falls within event periods
    if (eventKey) {
      // Convert UTC to PST for display grouping
      const pstDate = new Date(rowDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
      const dateDay = pstDate.toISOString().slice(0, 10); // YYYY-MM-DD in PST
      
      if (!result[eventKey][dateDay]) result[eventKey][dateDay] = 0;
      result[eventKey][dateDay] += 1;
    }
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

export default function PinsSoldChart({ data, selectedEvent, fullData }) {
  let chartData;
  
  if (selectedEvent === 'All') {
    // Group data by event for color coding
    const groupedByEvent = groupByDayCountByEvent(fullData, 'updated_at_block_time');
    
    // Get all unique time labels
    const allLabels = new Set();
    Object.values(groupedByEvent).forEach(eventData => {
      Object.keys(eventData).forEach(label => allLabels.add(label));
    });
    const labels = Array.from(allLabels).sort();
    const formattedLabels = labels.map(label => formatDayLabel(label));
    
    // Create datasets for each event (only show events with data)
    const datasets = Object.entries(groupedByEvent)
      .filter(([eventKey, eventData]) => Object.keys(eventData).length > 0) // Only events with data
      .map(([eventKey, eventData]) => {
        const values = labels.map(day => eventData[day] || 0);
        return {
          label: eventKey,
          data: values,
          backgroundColor: EVENTS[eventKey].color,
          borderColor: EVENTS[eventKey].color,
          borderWidth: 1,
        };
      });
    
    chartData = {
      labels: formattedLabels,
      datasets: datasets,
    };
  } else {
    // Single event - use original logic
    const grouped = groupByHourCount(data, 'updated_at_block_time');
  const labels = Object.keys(grouped).sort();
    const values = labels.map(hour => grouped[hour]);
    const formattedLabels = labels.map(label => formatTimeLabel(label));

    chartData = {
      labels: formattedLabels,
    datasets: [
      {
        label: 'Pins Sold',
        data: values,
        backgroundColor: '#ffb347',
      },
    ],
  };
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Pins Sold by {selectedEvent === 'All' ? 'Day (PST)' : 'Hour (PST)'}</h2>
      <Bar data={chartData} options={{
        responsive: true,
        plugins: { 
          legend: { 
            display: selectedEvent === 'All',
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                // Only for single event (hourly)
                if (selectedEvent !== 'All') {
                  // Get the original label (dateHour string)
                  const idx = context[0].dataIndex;
                  const labels = Object.keys(groupByHourCount(data, 'updated_at_block_time')).sort();
                  const dateHourString = labels[idx]; // YYYY-MM-DDTHH
                  const date = new Date(dateHourString + ':00:00.000Z');
                  const pstDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
                  const hour = pstDate.getHours();
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const month = pstDate.toLocaleDateString('en-US', { month: 'short' });
                  const day = pstDate.getDate();
                  return `${month} ${day}, ${displayHour}${ampm} PST`;
                }
                // Default for daily view
                return context[0].label + ' (PST)';
              },
              label: function(context) {
                // Show the value for pins sold
                return `Pins Sold: ${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: { 
          x: { 
            title: { 
              display: true, 
              text: selectedEvent === 'All' ? 'Date (PST)' : 'Time (PST)' 
            } 
          }, 
          y: { 
            title: { 
              display: true, 
              text: 'Pins Sold (Count)' 
            } 
          } 
        }
      }} />
    </div>
  );
} 
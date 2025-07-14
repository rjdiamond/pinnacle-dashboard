import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Event date ranges for color coding
const EVENTS = {
  'Event I': {
    startDate: new Date('2024-12-19T00:00:00.000Z'),
    endDate: new Date('2024-12-23T23:59:59.999Z'),
    color: '#FF6B6B' // Red
  },
  'Event II': {
    startDate: new Date('2025-03-20T00:00:00.000Z'),
    endDate: new Date('2025-03-23T23:59:59.999Z'),
    color: '#4ECDC4' // Teal
  },
  'Event III': {
    startDate: new Date('2025-05-16T00:00:00.000Z'),
    endDate: new Date('2025-05-19T23:59:59.999Z'),
    color: '#45B7D1' // Blue
  },
  'Event IV': {
    startDate: new Date('2025-06-26T00:00:00.000Z'),
    endDate: new Date('2025-06-30T23:59:59.999Z'),
    color: '#96CEB4' // Green
  },
  'Event V': {
    startDate: new Date('2025-07-11T00:00:00.000Z'),
    endDate: new Date('2025-07-14T23:59:59.999Z'),
    color: '#FFEAA7' // Yellow
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
  
  // Initialize result structure for each event
  Object.keys(EVENTS).forEach(eventKey => {
    result[eventKey] = {};
  });
  
  data.forEach(row => {
    const dateTime = row[dateKey];
    if (!dateTime) return;
    
    const rowDate = new Date(dateTime);
    let eventKey = null;
    
    // Determine which event this row belongs to
    for (const [key, event] of Object.entries(EVENTS)) {
      if (rowDate >= event.startDate && rowDate <= event.endDate) {
        eventKey = key;
        break;
      }
    }
    
    if (!eventKey) return; // Skip if not in any event
    
    // Convert to PST and extract day
    const utcDate = new Date(dateTime);
    const pstDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dateDay = pstDate.toISOString().slice(0, 10); // YYYY-MM-DD
    
    if (!result[eventKey][dateDay]) result[eventKey][dateDay] = 0;
    result[eventKey][dateDay] += 1;
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
  const pstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const month = pstDate.toLocaleDateString('en-US', { month: 'short' });
  const day = pstDate.getDate();
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
    
    // Create datasets for each event
    const datasets = Object.entries(groupedByEvent).map(([eventKey, eventData]) => {
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
      <h2>Pins Sold by {selectedEvent === 'All' ? 'Day' : 'Hour'} (PST)</h2>
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
              text: selectedEvent === 'All' ? 'Date (PST)' : 'Time (PST)' 
            } 
          }, 
          y: { 
            title: { 
              display: true, 
              text: 'Pins Sold' 
            } 
          } 
        }
      }} />
    </div>
  );
} 
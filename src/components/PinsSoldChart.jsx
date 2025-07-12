import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

function formatTimeLabel(dateHourString) {
  const date = new Date(dateHourString + ':00:00.000Z');
  const pstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const hour = pstDate.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${ampm}`;
}

export default function PinsSoldChart({ data }) {
  const grouped = groupByHourCount(data, 'updated_at_block_time');
  const labels = Object.keys(grouped).sort();
  const values = labels.map(hour => grouped[hour]);
  const formattedLabels = labels.map(label => formatTimeLabel(label));

  const chartData = {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Pins Sold',
        data: values,
        backgroundColor: '#ffb347',
      },
    ],
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Pins Sold by Hour (PST)</h2>
      <Bar data={chartData} options={{
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { title: { display: true, text: 'Time (PST)' } }, y: { title: { display: true, text: 'Pins Sold' } } }
      }} />
    </div>
  );
} 
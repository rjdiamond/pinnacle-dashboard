import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

function groupByField(data, fieldName) {
  const result = {};
  data.forEach(row => {
    const value = row[fieldName] || 'Unknown';
    if (!result[value]) result[value] = 0;
    result[value] += 1;
  });
  return result;
}

const COLORS = [
  '#4f8cff', '#ffb347', '#6ee7b7', '#f87171', '#a78bfa', '#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#facc15',
];

export default function EditionSeriesPieChart({ data }) {
  const grouped = groupByField(data, 'nft_edition_series_name');
  const labels = Object.keys(grouped);
  const values = labels.map(label => grouped[label]);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: COLORS,
      },
    ],
  };

  return (
    <div style={{ 
      margin: '2rem 0', 
      width: '100%', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '500px',
      minWidth: 'auto'
    }}>
      <h2>Edition Series</h2>
      <div style={{ 
        width: '400px', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: '0 auto'
      }}>
        <Pie data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'bottom',
              labels: {
                font: {
                  size: 11
                }
              }
            } 
          },
        }} />
      </div>
    </div>
  );
} 
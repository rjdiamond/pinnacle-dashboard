import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function topBySum(data, groupKey, valueKey, topN = 15) {
  const result = {};
  data.forEach(row => {
    const key = row[groupKey] || 'Unknown';
    const value = parseFloat(row[valueKey]) || 0;
    if (!result[key]) result[key] = 0;
    result[key] += value;
  });
  return Object.entries(result)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
}

export default function TopReceiversChart({ data }) {
  const top = topBySum(data, 'receiver_username', 'price', 15);
  const labels = top.map(([name]) => name);
  const values = top.map(([, sum]) => sum);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Spend',
        data: values,
        backgroundColor: '#34d399',
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
      minWidth: 'auto'
    }}>
      <h2>Top 15 Buyers by Spend</h2>
      <div style={{ width: '100%', height: '500px' }}>
        <Bar data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          indexAxis: 'y',
          scales: { 
            x: { 
              title: { display: true, text: 'Total Spend ($)' },
              beginAtZero: true
            }, 
            y: { 
              title: { display: true, text: 'Receiver' } 
            } 
          }
        }} />
      </div>
    </div>
  );
} 
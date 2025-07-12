import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

function groupByVariant(data) {
  const result = {};
  data.forEach(row => {
    const variant = row['nft_edition_variant'] || 'Unknown';
    if (!result[variant]) result[variant] = 0;
    result[variant] += 1;
  });
  return result;
}

const COLORS = [
  '#4f8cff', '#ffb347', '#6ee7b7', '#f87171', '#a78bfa', '#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#facc15',
];

export default function EditionVariantPieChart({ data }) {
  const grouped = groupByVariant(data);
  const labels = Object.keys(grouped);
  const values = labels.map(l => grouped[l]);

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
      <h2>Edition Variant Distribution</h2>
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
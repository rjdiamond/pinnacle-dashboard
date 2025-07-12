import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function groupBySetShapeAndVariant(data) {
  const result = {};
  const colorMap = {};
  let colorIndex = 0;
  
  data.forEach(row => {
    const set = row['nft_edition_set_truncatedName'] || 'Unknown';
    const shape = row['nft_edition_shape_name'] || 'Unknown';
    const variant = row['nft_edition_variant'] || 'Unknown';
    
    if (!result[set]) {
      result[set] = {};
    }
    if (!result[set][shape]) {
      result[set][shape] = {};
    }
    if (!result[set][shape][variant]) {
      result[set][shape][variant] = 0;
    }
    result[set][shape][variant] += 1;
    
    // Create unique key for shape+variant combination
    const shapeVariantKey = `${shape} - ${variant}`;
    if (!colorMap[shapeVariantKey]) {
      const colors = [
        '#4f8cff', '#ffb347', '#6ee7b7', '#f87171', '#a78bfa', 
        '#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#facc15',
        '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4',
        '#84cc16', '#f97316', '#ec4899', '#14b8a6', '#6366f1'
      ];
      colorMap[shapeVariantKey] = colors[colorIndex % colors.length];
      colorIndex++;
    }
  });
  
  return { result, colorMap };
}

export default function EditionSetBarChart({ data }) {
  const { result: groupedData, colorMap } = groupBySetShapeAndVariant(data);
  
  // Calculate total transactions per set and sort by total
  const setTotals = Object.entries(groupedData).map(([set, shapes]) => {
    let total = 0;
    Object.values(shapes).forEach(variants => {
      Object.values(variants).forEach(count => {
        total += count;
      });
    });
    return { set, total, shapes };
  });
  
  // Sort by total descending and take top 15
  const topSets = setTotals
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);
  
  // Get all unique shape+variant combinations across all sets
  const allShapeVariants = new Set();
  topSets.forEach(({ shapes }) => {
    Object.entries(shapes).forEach(([shape, variants]) => {
      Object.keys(variants).forEach(variant => {
        allShapeVariants.add(`${shape} - ${variant}`);
      });
    });
  });
  const uniqueShapeVariants = Array.from(allShapeVariants);
  
  // Create datasets for each shape+variant combination
  const datasets = uniqueShapeVariants.map(shapeVariant => {
    const [shape, variant] = shapeVariant.split(' - ');
    return {
      label: shapeVariant,
      data: topSets.map(({ set, shapes }) => {
        return shapes[shape] && shapes[shape][variant] ? shapes[shape][variant] : 0;
      }),
      backgroundColor: colorMap[shapeVariant],
      stack: 'Stack 0',
    };
  });
  
  const labels = topSets.map(({ set }) => set);

  const chartData = {
    labels,
    datasets,
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Top 15 Edition Sets by Transaction Count (Stacked by Shape & Variant)</h2>
      <Bar data={chartData} options={{
        indexAxis: 'y', // This makes it horizontal
        responsive: true,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.x} transactions`;
              }
            }
          }
        },
        scales: { 
          x: { 
            title: { display: true, text: 'Number of Transactions' },
            beginAtZero: true,
            stacked: true
          }, 
          y: { 
            title: { display: true, text: 'Edition Set' },
            stacked: true,
            reverse: false // This ensures highest values appear at the top
          } 
        }
      }} />
    </div>
  );
} 
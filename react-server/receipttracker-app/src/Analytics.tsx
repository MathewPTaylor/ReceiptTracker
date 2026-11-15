import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  type ChartOptions,
  type ChartData,
  type ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register required Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface StockChartProps {
  ticker?: string;
  labels?: string[];
  prices?: number[];
}

const defaultLabels = [
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
];

// Upward-trending intraday price series with realistic pullbacks
const defaultPrices = [
  142.10, 142.85, 142.40, 143.60, 144.25, 143.90, 145.10,
  146.35, 145.80, 147.20, 148.05, 147.75, 149.40, 150.85,
];

export const Analytics: React.FC<StockChartProps> = ({
  ticker = 'ACME',
  labels = defaultLabels,
  prices = defaultPrices,
}) => {
  const startPrice = prices[0] ?? 0;
  const currentPrice = prices[prices.length - 1] ?? 0;
  const priceChange = currentPrice - startPrice;
  const percentChange = startPrice ? ((priceChange / startPrice) * 100).toFixed(2) : '0.00';

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: ticker,
        data: prices,
        borderColor: '#3b4d2b', // Matches --color-accent-primary
        borderWidth: 2,
        tension: 0.15, // Slight smoothing while preserving sharp market fluctuations
        fill: true,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(59, 77, 43, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 77, 43, 0.22)');
          gradient.addColorStop(1, 'rgba(59, 77, 43, 0.0)');
          return gradient;
        },
        pointRadius: 0, // Clean continuous line until hovered
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#3b4d2b',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f241d',
        titleColor: '#cfd4ca',
        bodyColor: '#ffffff',
        cornerRadius: 4, // Crisp corners matching your finance theme
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `$${Number(ctx.parsed.y).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          color: '#e2e5de',
        },
        ticks: {
          color: '#6b7265',
          font: { size: 11 },
          maxTicksLimit: 7,
        },
      },
      y: {
        position: 'right', // Standard brokerage Y-axis placement
        grid: {
          color: '#e2e5de',
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7265',
          font: { size: 11 },
          callback: (value) => `$${Number(value).toFixed(2)}`,
        },
      },
    },
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e5de',
        borderRadius: '0.375rem',
        padding: '1rem',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7265', letterSpacing: '0.04em' }}>
          {ticker}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f241d' }}>
            ${currentPrice.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3b4d2b' }}>
            +{priceChange.toFixed(2)} (+{percentChange}%)
          </span>
        </div>
      </div>

      <div style={{ height: '260px', width: '100%'}}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default Analytics;
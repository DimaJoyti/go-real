'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
}

// Revenue Trend Line Chart
interface RevenueTrendChartProps {
  data: Array<{
    month: string
    revenue: number
    sales: number
  }>
  height?: number
}

export function RevenueTrendChart({ data, height = 300 }: RevenueTrendChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Sales Count',
        data: data.map(item => item.sales),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    ...commonOptions,
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Sales Count',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

// Sales Performance Bar Chart
interface SalesPerformanceChartProps {
  data: Array<{
    name: string
    sales: number
    revenue: number
  }>
  height?: number
}

export function SalesPerformanceChart({ data, height = 300 }: SalesPerformanceChartProps) {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Sales Count',
        data: data.map(item => item.sales),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sales Count',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
        },
        grid: {
          drawOnChartArea: false,
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

// Lead Sources Doughnut Chart
interface LeadSourcesChartProps {
  data: Array<{
    source: string
    count: number
    percentage: number
  }>
  height?: number
}

export function LeadSourcesChart({ data, height = 300 }: LeadSourcesChartProps) {
  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
  ]

  const chartData = {
    labels: data.map(item => item.source),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  }

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = data[context.dataIndex]
            return `${item.source}: ${item.count} (${item.percentage.toFixed(1)}%)`
          }
        }
      }
    }
  }

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

// Lead Status Distribution Pie Chart
interface LeadStatusChartProps {
  data: Array<{
    status: string
    count: number
    percentage: number
  }>
  height?: number
}

export function LeadStatusChart({ data, height = 300 }: LeadStatusChartProps) {
  const statusColors: { [key: string]: string } = {
    'New': 'rgba(59, 130, 246, 0.8)',
    'Contacted': 'rgba(245, 158, 11, 0.8)',
    'Qualified': 'rgba(16, 185, 129, 0.8)',
    'Proposal': 'rgba(139, 92, 246, 0.8)',
    'Negotiation': 'rgba(249, 115, 22, 0.8)',
    'Converted': 'rgba(34, 197, 94, 0.8)',
    'Lost': 'rgba(239, 68, 68, 0.8)',
  }

  const chartData = {
    labels: data.map(item => item.status),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => statusColors[item.status] || 'rgba(156, 163, 175, 0.8)'),
        borderColor: data.map(item => statusColors[item.status]?.replace('0.8', '1') || 'rgba(156, 163, 175, 1)'),
        borderWidth: 2,
      },
    ],
  }

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = data[context.dataIndex]
            return `${item.status}: ${item.count} (${item.percentage.toFixed(1)}%)`
          }
        }
      }
    }
  }

  return (
    <div style={{ height }}>
      <Pie data={chartData} options={options} />
    </div>
  )
}

// Property Types Bar Chart
interface PropertyTypesChartProps {
  data: Array<{
    type: string
    count: number
    avgPrice: number
  }>
  height?: number
}

export function PropertyTypesChart({ data, height = 300 }: PropertyTypesChartProps) {
  const chartData = {
    labels: data.map(item => item.type),
    datasets: [
      {
        label: 'Unit Count',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'Average Price',
        data: data.map(item => item.avgPrice),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Unit Count',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Average Price ($)',
        },
        grid: {
          drawOnChartArea: false,
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

// Conversion Funnel Chart
interface ConversionFunnelChartProps {
  data: Array<{
    stage: string
    count: number
    percentage: number
  }>
  height?: number
}

export function ConversionFunnelChart({ data, height = 300 }: ConversionFunnelChartProps) {
  const chartData = {
    labels: data.map(item => item.stage),
    datasets: [
      {
        label: 'Count',
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    ...commonOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = data[context.dataIndex]
            return `${item.stage}: ${item.count} (${item.percentage.toFixed(1)}%)`
          }
        }
      }
    }
  }

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

// KPI Gauge Chart (using a doughnut chart)
interface KPIGaugeProps {
  value: number
  max: number
  label: string
  color?: string
  height?: number
}

export function KPIGauge({ value, max, label, color = 'rgba(59, 130, 246, 0.8)', height = 200 }: KPIGaugeProps) {
  const percentage = (value / max) * 100
  const remaining = max - value

  const chartData = {
    labels: [label, 'Remaining'],
    datasets: [
      {
        data: [value, remaining],
        backgroundColor: [color, 'rgba(229, 231, 235, 0.3)'],
        borderColor: [color.replace('0.8', '1'), 'rgba(229, 231, 235, 0.5)'],
        borderWidth: 2,
        cutout: '70%',
      },
    ],
  }

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.dataIndex === 0) {
              return `${label}: ${value} (${percentage.toFixed(1)}%)`
            }
            return null
          }
        }
      }
    }
  }

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">{value} / {max}</div>
        </div>
      </div>
    </div>
  )
}

// Export all components
export {
  RevenueTrendChart,
  SalesPerformanceChart,
  LeadSourcesChart,
  LeadStatusChart,
  PropertyTypesChart,
  ConversionFunnelChart,
  KPIGauge,
}

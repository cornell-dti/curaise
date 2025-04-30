"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { generateDateRange, getYAxisDomain } from "../analytics-utils";

type RevenueDataPoint = {
  date: string;
  revenue: number;
  cumulativeRevenue: number;
  originalDate: string;
};

type RevenueChartProps = {
  initialData: RevenueDataPoint[];
};

export default function RevenueChart({ initialData }: RevenueChartProps) {
  const [timeWindow, setTimeWindow] = useState(30);
  const [data, setData] = useState(initialData);
  const [mounted, setMounted] = useState(false);

  // Only render the chart component on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Time window options for the filter buttons
  const timeWindowOptions = [
    { label: "Last 3 days", value: 3 },
    { label: "Last 7 days", value: 7 },
    { label: "Last 14 days", value: 14 },
    { label: "Last 30 days", value: 30 },
  ];

  // Function to filter data by time window
  const filterDataByTimeWindow = (days: number) => {
    setTimeWindow(days);

    // Get today's date and the cutoff date
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of day

    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0); // Start of day

    // Calculate revenue before the cutoff date for cumulative starting point
    const previousRevenue = initialData.reduce((total, item) => {
      const itemDate = new Date(item.originalDate + "T00:00:00Z");
      return itemDate < cutoffDate ? total + item.revenue : total;
    }, 0);

    // Create a map of dates to revenue data for efficient lookups
    const revenueByDate = new Map<string, number>();
    initialData.forEach((item) => {
      const itemDate = new Date(item.originalDate + "T00:00:00Z");
      if (itemDate >= cutoffDate && itemDate <= today) {
        revenueByDate.set(
          item.originalDate,
          (revenueByDate.get(item.originalDate) || 0) + item.revenue
        );
      }
    });

    // Generate complete date range and create chart data points
    const dateRange = generateDateRange(cutoffDate, today);

    let cumulativeTotal = previousRevenue;
    const chartData = dateRange.map(({ dateStr, displayDate }) => {
      const dailyRevenue = revenueByDate.get(dateStr) || 0;
      cumulativeTotal += dailyRevenue;

      return {
        date: displayDate,
        revenue: dailyRevenue,
        cumulativeRevenue: cumulativeTotal,
        originalDate: dateStr,
      };
    });

    setData(chartData);
  };

  // Initialize with the default time window
  useEffect(() => {
    filterDataByTimeWindow(30);
  }, [initialData]);

  // Return placeholder while not mounted (to avoid hydration issues)
  if (!mounted) {
    return (
      <div>
        <div className="flex space-x-2 mb-4">
          {timeWindowOptions.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-1 text-sm rounded-md ${
                timeWindow === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>

        <div className="h-72 border rounded-lg p-4">
          <div className="text-center p-4">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Time window selector */}
      <div className="flex space-x-2 mb-4">
        {timeWindowOptions.map((option) => (
          <button
            key={option.value}
            className={`px-3 py-1 text-sm rounded-md ${
              timeWindow === option.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => filterDataByTimeWindow(option.value)}
            aria-label={`View data for ${option.label}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="h-72 border rounded-lg p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 30,
              }}
              aria-label="Revenue over time chart"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickMargin={10} />
              <YAxis
                domain={getYAxisDomain(data)}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toFixed(2)}`,
                  "Revenue",
                ]}
                labelFormatter={(label: string) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="cumulativeRevenue"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Cumulative Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No revenue data available for the selected time period
          </div>
        )}
      </div>
    </div>
  );
}

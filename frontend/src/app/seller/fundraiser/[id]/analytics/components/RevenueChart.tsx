"use client";

import { useState, useEffect } from "react";
// Import recharts directly in client component
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

  // Function to filter data by time window
  const filterDataByTimeWindow = (days: number) => {
    setTimeWindow(days);

    // Get today's date and strip the time part
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of day

    // Calculate the cutoff date based on the selected time window
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0); // Start of day

    console.log(
      `Filtering from ${cutoffDate.toISOString()} to ${today.toISOString()}`
    );
    console.log(`Data points before filtering: ${initialData.length}`);

    // First, calculate the total revenue up to the cutoff date
    // This is what we'll use as the starting point for our cumulative total
    const previousRevenue = initialData.reduce((total, item) => {
      const itemDate = new Date(item.originalDate + "T00:00:00Z");
      if (itemDate < cutoffDate) {
        return total + item.revenue;
      }
      return total;
    }, 0);

    console.log(`Revenue before cutoff date: $${previousRevenue.toFixed(2)}`);

    // Filter the initialData to include only data points after the cutoff date
    const relevantDates = initialData
      .filter((item) => {
        // Parse the date and ensure it's compared consistently
        const itemDate = new Date(item.originalDate + "T00:00:00Z");
        return itemDate >= cutoffDate && itemDate <= today;
      })
      .sort((a, b) => a.originalDate.localeCompare(b.originalDate));

    console.log(`Data points after filtering: ${relevantDates.length}`);

    // If no data in range, show flat line at previous revenue
    if (relevantDates.length === 0) {
      console.log("No data in range, creating flat line at previous revenue");
      // Create data points for each day in the range with constant cumulative revenue
      const flatLineData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(cutoffDate);
        date.setDate(cutoffDate.getDate() + i);
        const dateString = date.toISOString().split("T")[0];
        const dateObj = new Date(dateString);
        const formattedDate = dateObj.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

        flatLineData.push({
          date: formattedDate,
          revenue: 0, // No new revenue on these days
          cumulativeRevenue: previousRevenue,
          originalDate: dateString,
        });
      }
      setData(flatLineData);
      return;
    }

    // Calculate cumulative revenue starting from the previous total
    let cumulativeRevenue = previousRevenue;
    const filteredData = relevantDates.map((item) => {
      cumulativeRevenue += item.revenue;
      return {
        ...item,
        cumulativeRevenue,
      };
    });

    // Add any missing days between cutoff and first data point
    const firstDataDate = new Date(
      relevantDates[0].originalDate + "T00:00:00Z"
    );
    const missingDays = [];

    let currentDate = new Date(cutoffDate);
    while (currentDate < firstDataDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      const formattedDate = currentDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      missingDays.push({
        date: formattedDate,
        revenue: 0,
        cumulativeRevenue: previousRevenue,
        originalDate: dateString,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Combine the missing days with the filtered data
    const completeData = [...missingDays, ...filteredData];

    // Fill in any gaps between data points to ensure continuous line
    const filledData = [];
    let lastDate = null;
    let lastCumulative = previousRevenue;

    completeData.sort((a, b) => a.originalDate.localeCompare(b.originalDate));

    for (const item of completeData) {
      const currentDate = new Date(item.originalDate + "T00:00:00Z");

      // If this isn't the first date and there's a gap, fill it
      if (lastDate) {
        const dayAfterLast = new Date(lastDate);
        dayAfterLast.setDate(lastDate.getDate() + 1);

        while (dayAfterLast < currentDate) {
          const dateString = dayAfterLast.toISOString().split("T")[0];
          const formattedDate = dayAfterLast.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          // Add a point with the same cumulative value as the last point
          filledData.push({
            date: formattedDate,
            revenue: 0,
            cumulativeRevenue: lastCumulative,
            originalDate: dateString,
          });

          dayAfterLast.setDate(dayAfterLast.getDate() + 1);
        }
      }

      filledData.push(item);
      lastDate = currentDate;
      lastCumulative = item.cumulativeRevenue;
    }

    setData(filledData);
  };

  // Function to calculate reasonable Y-axis domain
  const getYAxisDomain = () => {
    if (data.length === 0) return [0, 10];

    const maxRevenue = Math.max(...data.map((item) => item.cumulativeRevenue));
    // Round up to nearest 50 or 100 for a cleaner chart
    if (maxRevenue < 100) {
      return [0, Math.ceil(maxRevenue / 10) * 10];
    } else if (maxRevenue < 1000) {
      return [0, Math.ceil(maxRevenue / 50) * 50];
    } else {
      return [0, Math.ceil(maxRevenue / 100) * 100];
    }
  };

  // Initialize with the default time window (30 days)
  useEffect(() => {
    filterDataByTimeWindow(30);
  }, [initialData]);

  // Return table only if not mounted yet to avoid hydration issues
  if (!mounted) {
    return (
      <div>
        <div className="flex space-x-2 mb-4">
          {[
            { label: "Last 3 days", value: 3 },
            { label: "Last 7 days", value: 7 },
            { label: "Last 14 days", value: 14 },
            { label: "Last 30 days", value: 30 },
          ].map((option) => (
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
        {[
          { label: "Last 3 days", value: 3 },
          { label: "Last 7 days", value: 7 },
          { label: "Last 14 days", value: 14 },
          { label: "Last 30 days", value: 30 },
        ].map((option) => (
          <button
            key={option.value}
            className={`px-3 py-1 text-sm rounded-md ${
              timeWindow === option.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => filterDataByTimeWindow(option.value)}
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
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickMargin={10} />
              <YAxis
                domain={getYAxisDomain()}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value}`, "Revenue"]}
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

      {/* Data table section */}
      {/* <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-500">
          View revenue data as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-2 py-1">Date</th>
                <th className="text-left px-2 py-1">Daily Revenue</th>
                <th className="text-left px-2 py-1">Cumulative Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="px-2 py-1">{item.date}</td>
                  <td className="px-2 py-1">${item.revenue.toFixed(2)}</td>
                  <td className="px-2 py-1">
                    ${item.cumulativeRevenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details> */}
    </div>
  );
}

"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A donut chart showing revenue breakdown by item";

interface RevenueBreakdownChartProps {
	itemRevenue: Record<string, number>;
	totalRevenue: number;
}

// Vibrant green shades
const greenShades = [
	"#10b981", // Vibrant emerald
	"#059669", // Deeper emerald
	"#34d399", // Bright light green
	"#047857", // Dark forest green
	"#6ee7b7", // Light mint green
	"#22c55e", // Green 500
	"#16a34a", // Green 600
	"#84cc16", // Lime 500
];

export function RevenueBreakdownChart({
	itemRevenue,
	totalRevenue,
}: RevenueBreakdownChartProps) {
	const chartData = React.useMemo(() => {
		return Object.entries(itemRevenue).map(([itemName, revenue], index) => ({
			name: itemName,
			revenue: revenue,
			fill: greenShades[index % greenShades.length],
		}));
	}, [itemRevenue]);

	const chartConfig = React.useMemo(() => {
		const config: ChartConfig = {
			revenue: {
				label: "Revenue",
			},
		};

		Object.keys(itemRevenue).forEach((itemName, index) => {
			config[itemName] = {
				label: itemName,
				color: greenShades[index % greenShades.length],
			};
		});

		return config;
	}, [itemRevenue]);

	return (
		<ChartContainer
			config={chartConfig}
			className="mx-auto aspect-square max-h-[250px]">
			<PieChart>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent hideLabel className="min-w-[180px]" />}
				/>
				<Pie
					data={chartData}
					dataKey="revenue"
					nameKey="name"
					innerRadius={60}
					strokeWidth={5}>
					<Label
						content={({ viewBox }) => {
							if (viewBox && "cx" in viewBox && "cy" in viewBox) {
								return (
									<text
										x={viewBox.cx}
										y={viewBox.cy}
										textAnchor="middle"
										dominantBaseline="middle">
										<tspan
											x={viewBox.cx}
											y={viewBox.cy}
											className="fill-foreground text-2xl font-semibold">
											${totalRevenue.toFixed(2)}
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) + 24}
											className="fill-muted-foreground">
											Revenue
										</tspan>
									</text>
								);
							}
						}}
					/>
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

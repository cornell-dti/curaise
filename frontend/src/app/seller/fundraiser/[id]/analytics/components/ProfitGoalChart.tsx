"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface ProfitGoalChartProps {
	profit: number;
	goalAmount: number | null;
}

export function ProfitGoalChart({ profit, goalAmount }: ProfitGoalChartProps) {
	const chartConfig = {
		profit: {
			label: "Profit",
			color: "#15803d",
		},
		remaining: {
			label: "Remaining",
			color: "#e5e7eb",
		},
	};

	// Calculate profit percentage (capped at 100%)
	const profitPercentage =
		goalAmount && goalAmount > 0
			? Math.min((profit / goalAmount) * 100, 100)
			: 0;
	const remainingPercentage = 100 - profitPercentage;

	const remaining = (goalAmount || 0) - profit;
	const chartData = [
		{
			name: "Profit",
			value: profitPercentage,
			displayValue: `$${profit.toFixed(2)}`,
			fill: "#15803d",
		},
		{
			name: "Remaining",
			value: remainingPercentage,
			displayValue: `$${remaining.toFixed(2)}`,
			fill: "#e5e7eb",
		},
	];

	return (
		<ChartContainer
			config={chartConfig}
			className="mx-auto aspect-square w-full max-w-[250px]">
			<PieChart>
				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							hideLabel
							className="min-w-[120px]"
							formatter={(value, name, item) => (
								<div className="flex items-center gap-2">
									<div
										className="h-2.5 w-2.5 rounded-[2px]"
										style={{ backgroundColor: item.payload.fill }}
									/>
									<span>{item.payload.name}: {item.payload.displayValue}</span>
								</div>
							)}
						/>
					}
				/>
				<Pie
					data={chartData}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					innerRadius="60%"
					outerRadius="80%"
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
											y={(viewBox.cy || 0) - 12}
											className="fill-foreground text-3xl font-semibold">
											${profit}
											<tspan
												className="fill-muted-foreground text-lg font-normal"
												dy="0">
												/{goalAmount || 0}
											</tspan>
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) + 24}
											className="fill-muted-foreground text-sm">
											profit
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

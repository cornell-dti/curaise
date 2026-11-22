"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatMoney, profitGoalProgress } from "@/lib/profit";

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

	const { percentage: profitPercentage, remaining } = profitGoalProgress(
		profit,
		goalAmount
	);
	const remainingPercentage = 100 - profitPercentage;

	const chartData = [
		{
			name: "Profit",
			value: profitPercentage,
			displayValue: formatMoney(profit),
			fill: "#15803d",
		},
		{
			name: "Remaining",
			value: remainingPercentage,
			displayValue: formatMoney(remaining),
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
										{/* Goal sits on its own line so cents fit inside the ring */}
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) - 8}
											className="fill-foreground text-2xl font-semibold">
											{formatMoney(profit)}
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) + 18}
											className="fill-muted-foreground text-sm">
											{goalAmount && goalAmount > 0
												? `of ${formatMoney(goalAmount)} goal`
												: "profit"}
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

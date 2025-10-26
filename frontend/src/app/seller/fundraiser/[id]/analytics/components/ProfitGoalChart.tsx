"use client";
import {
	Label,
	PolarGrid,
	PolarRadiusAxis,
	RadialBar,
	RadialBarChart,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface ProfitGoalChartProps {
	profit: number;
	goalAmount: number | null;
}

export function ProfitGoalChart({ profit, goalAmount }: ProfitGoalChartProps) {
	// Chart configuration
	const chartConfig = {
		profit: {
			label: "Profit",
			color: "#15803d",
		},
	};

	// Calculate profit percentage
	const profitPercentage =
		goalAmount && goalAmount > 0 ? (profit / goalAmount) * 100 : 0;

	const chartData = [
		{
			name: "profit",
			profit: profitPercentage,
			fill: "#15803d",
		},
	];

	return (
		<ChartContainer
			config={chartConfig}
			className="mx-auto aspect-square max-h-[250px]">
			<RadialBarChart
				data={chartData}
				startAngle={0}
				endAngle={profitPercentage}
				innerRadius={80}
				outerRadius={110}>
				<PolarGrid
					gridType="circle"
					radialLines={false}
					stroke="none"
					className="first:fill-muted last:fill-background"
					polarRadius={[86, 74]}
				/>
				<RadialBar dataKey="profit" background />
				<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
				</PolarRadiusAxis>
			</RadialBarChart>
		</ChartContainer>
	);
}

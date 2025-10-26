import { Progress } from "@/components/ui/progress";

interface ItemsSoldCardProps {
	items: Record<string, number>;
}

export function ItemsSoldCard({ items }: ItemsSoldCardProps) {
	// Convert Record to array and calculate total
	const itemsArray = Object.entries(items).map(([name, quantity]) => ({
		name,
		quantity,
	}));

	const total = itemsArray.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<div className="space-y-6">
			{itemsArray.map((item, index) => {
				const percentage = total > 0 ? (item.quantity / total) * 100 : 0;
				return (
					<div key={index} className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
							<span className="text-base font-medium text-muted-foreground">
								{item.name.charAt(0)}
							</span>
						</div>

						<div className="flex-1 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-base font-medium text-foreground">
									{item.name}
								</span>
								<span className="text-base font-semibold">
									{item.quantity}/{total}
								</span>
							</div>
							<Progress
								value={percentage}
								className="h-2.5 [&>div]:bg-green-700"
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}

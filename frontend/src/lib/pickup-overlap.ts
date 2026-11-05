type TimeRange = {
	startsAt: Date;
	endsAt: Date;
};

export function timeRangesOverlap(a: TimeRange, b: TimeRange) {
	return (
		a.startsAt.getTime() < b.endsAt.getTime() &&
		b.startsAt.getTime() < a.endsAt.getTime()
	);
}

export function findOverlappingFundraisers<
	T extends { pickupEvents: TimeRange[] },
>(pickupEvent: TimeRange, fundraisers: T[]) {
	return fundraisers.filter((fundraiser) =>
		fundraiser.pickupEvents.some((other) =>
			timeRangesOverlap(pickupEvent, other),
		),
	);
}

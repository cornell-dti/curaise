"use client";

import { useRef, useState } from "react";

export type RingArc = {
	id: string;
	start: number;
	length: number;
	color: string;
	stripedOn?: string;
	opacity?: number;
	label: string;
};

type Hover = { id: string; x: number; y: number; flip: boolean };

const RING_LENGTH = 100;
const MIN_STRIPED_LENGTH = 1;

const CIRCLE = {
	cx: 21,
	cy: 21,
	r: 15.9155,
	fill: "none",
	strokeWidth: 5,
};

const solidDash = (length: number) =>
	`${length.toFixed(3)} ${(RING_LENGTH - length).toFixed(3)}`;

const stripeDash = (length: number) => {
	const stripeCount = Math.floor((length + 1) / 2);
	const stripedLength = 2 * stripeCount - 1;
	return `${"1 ".repeat(stripedLength)}${RING_LENGTH - stripedLength}`;
};

const swatchBackground = (arc: RingArc) =>
	arc.stripedOn
		? `repeating-linear-gradient(135deg, ${arc.color} 0 2px, ${arc.stripedOn} 2px 5px)`
		: arc.color;

export function DonutRing({
	arcs,
	showTrack = false,
	children,
}: {
	arcs: RingArc[];
	showTrack?: boolean;
	children: React.ReactNode;
}) {
	const boxRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<Hover | null>(null);
	const visibleArcs = arcs.filter((arc) => arc.length > 0);
	const hoveredArc = hover
		? visibleArcs.find((arc) => arc.id === hover.id)
		: undefined;

	const trackPointer = (id: string, event: React.MouseEvent) => {
		const box = boxRef.current?.getBoundingClientRect();
		if (!box) {
			return;
		}
		const x = event.clientX - box.left;
		setHover({
			id,
			x,
			y: event.clientY - box.top,
			flip: x > box.width / 2,
		});
	};

	return (
		<div ref={boxRef} className="relative size-[168px] self-center">
			<svg
				viewBox="2 2 38 38"
				aria-hidden="true"
				className="block size-full -rotate-90">
				{showTrack && <circle {...CIRCLE} stroke="#E5E7EB" />}
				{visibleArcs.map((arc) => (
					<g
						key={arc.id}
						opacity={arc.opacity}
						strokeDashoffset={RING_LENGTH - arc.start}
						onMouseMove={(event) => trackPointer(arc.id, event)}
						onMouseLeave={() => setHover(null)}>
						<circle
							{...CIRCLE}
							stroke={arc.stripedOn ?? arc.color}
							strokeDasharray={solidDash(arc.length)}
						/>
						{arc.stripedOn && arc.length >= MIN_STRIPED_LENGTH && (
							<circle
								{...CIRCLE}
								stroke={arc.color}
								strokeDasharray={stripeDash(arc.length)}
							/>
						)}
					</g>
				))}
			</svg>
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
				<div className="flex w-[66%] flex-col items-center">{children}</div>
			</div>
			{hover && hoveredArc && (
				<div
					className="pointer-events-none absolute z-10 flex w-max max-w-60 items-center gap-2 break-words rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl"
					style={{
						left: hover.x,
						top: hover.y,
						transform: hover.flip
							? "translate(calc(-100% - 12px), 12px)"
							: "translate(12px, 12px)",
					}}>
					<span
						className="size-2.5 flex-none rounded-[2px]"
						style={{ background: swatchBackground(hoveredArc) }}
					/>
					<span className="min-w-0">{hoveredArc.label}</span>
				</div>
			)}
		</div>
	);
}

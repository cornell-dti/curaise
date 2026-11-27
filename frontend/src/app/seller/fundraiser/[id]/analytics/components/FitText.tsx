"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function FitText({
	align = "left",
	className,
	children,
}: {
	align?: "left" | "center";
	className?: string;
	children: React.ReactNode;
}) {
	const boxRef = useRef<HTMLSpanElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const [scale, setScale] = useState(1);

	useLayoutEffect(() => {
		const box = boxRef.current;
		const text = textRef.current;
		if (!box || !text) {
			return;
		}
		const fit = () =>
			setScale(Math.min(1, box.clientWidth / text.offsetWidth));
		fit();
		const observer = new ResizeObserver(fit);
		observer.observe(box);
		observer.observe(text);
		return () => observer.disconnect();
	}, []);

	return (
		<span
			ref={boxRef}
			className={cn(
				"flex w-full",
				align === "center" && "justify-center",
				className
			)}>
			<span
				ref={textRef}
				className={cn(
					"flex-none whitespace-nowrap",
					align === "center" ? "origin-center" : "origin-left"
				)}
				style={{ transform: `scale(${scale})` }}>
				{children}
			</span>
		</span>
	);
}

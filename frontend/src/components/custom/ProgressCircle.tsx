/**
 * v0 by Vercel.
 * @see https://v0.dev/t/Uw1cSs81SHo
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
export default function ProgressCircle({
  color,
  percent,
  amount,
  title,
}: {
  color: string;
  percent: number;
  amount: number;
  title: string;
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[200px] md:h-[200px]">
        <svg
          className="absolute top-0 left-0 w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="white"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={color}
            strokeWidth="7"
            strokeDasharray="251.2"
            strokeLinecap="round"
            strokeDashoffset={251.2 * (1 - percent)}
          />
        </svg>
        <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl sm:text-3xl md:text-4xl font-semi-bold text-gray-900 dark:text-gray-50">
        {(title === "raised" || title === "profit") ? `$${amount}` : amount}
        </div>
        <div className="absolute top-[62.6%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs sm:text-sm md:text-base font-semi-bold text-gray-900 dark:text-gray-50">
          <p>{title}</p>
        </div>
      </div>
    </div>
  );
}

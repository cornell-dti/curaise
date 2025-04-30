import React from "react";

type GoalProgressCircleProps = {
  currentAmount: number;
  goalAmount: number;
  progressPercent: number;
  hasGoal?: boolean;
};

export default function GoalProgressCircle({
  currentAmount,
  goalAmount,
  progressPercent,
  hasGoal = true,
}: GoalProgressCircleProps) {
  return (
    <div className="flex justify-center items-center h-40">
      <div className="relative">
        {/* SVG Circle showing progress */}
        <svg className="w-32 h-32" viewBox="0 0 36 36">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="15.91549430918954"
            fill="transparent"
            stroke="#C9E4C7"
            strokeWidth="3"
          ></circle>

          {/* Progress circle - only render if there's a goal */}
          {hasGoal && (
            <circle
              cx="18"
              cy="18"
              r="15.91549430918954"
              fill="transparent"
              stroke="#138808"
              strokeWidth="3"
              strokeDasharray={`${progressPercent} ${100 - progressPercent}`}
              strokeDashoffset="25"
              transform="rotate(-90 18 18)"
            ></circle>
          )}
        </svg>

        {/* Text in the middle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">
            ${currentAmount.toFixed(0)}
          </span>
          {hasGoal ? (
            <span className="text-xs text-gray-500">out of ${goalAmount}</span>
          ) : (
            <span className="text-xs text-gray-500">no goal set</span>
          )}
        </div>
      </div>
    </div>
  );
}

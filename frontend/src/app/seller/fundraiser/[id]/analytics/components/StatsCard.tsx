import React from "react";

type StatsCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  backgroundColor?: string;
};

export default function StatsCard({
  label,
  value,
  subtitle = "Total",
  backgroundColor = "#BDCDB3",
}: StatsCardProps) {
  return (
    <div className="bg-[#BDCDB3] rounded-lg p-4" style={{ backgroundColor }}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

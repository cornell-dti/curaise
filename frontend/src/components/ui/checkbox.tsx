import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, ...props }) => {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
      checked={checked}
      style={{ accentColor: "black" }}
      {...props}
    />
  );
};

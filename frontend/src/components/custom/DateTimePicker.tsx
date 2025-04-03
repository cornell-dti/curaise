"use client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Select date and time",
}: DateTimePickerProps) {
  // Generate hours and minutes for the time picker
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // Get current hour and minute from value
  const selectedHour = value ? value.getHours() : 9;
  const selectedMinute = value ? Math.floor(value.getMinutes() / 5) * 5 : 0;

  // Handle time selection
  const handleTimeChange = (type: "hour" | "minute", newValue: string) => {
    if (!value) {
      // If no date is selected, create one with today's date
      const today = new Date();
      if (type === "hour") {
        today.setHours(Number.parseInt(newValue), selectedMinute);
      } else {
        today.setHours(selectedHour, Number.parseInt(newValue));
      }
      onChange(today);
    } else {
      const newDate = new Date(value);
      if (type === "hour") {
        newDate.setHours(Number.parseInt(newValue), selectedMinute);
      } else {
        newDate.setHours(selectedHour, Number.parseInt(newValue));
      }
      onChange(newDate);
    }
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full pl-3 text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
            aria-label="Select date and time"
          >
            {value ? (
              format(value, "PPP p") // Show date and time
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-0">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                if (date) {
                  // Preserve the current time when selecting a new date
                  const newDate = new Date(date);
                  if (value) {
                    newDate.setHours(value.getHours(), value.getMinutes());
                  } else {
                    newDate.setHours(9, 0); // Default to 9:00 AM
                  }
                  onChange(newDate);
                } else {
                  onChange(undefined);
                }
              }}
              initialFocus
              disabled={disabled}
            />

            {/* Time picker section */}
            <div className="border-t border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Time</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Hour selector */}
                  <Select
                    value={selectedHour.toString()}
                    onValueChange={(value: string) =>
                      handleTimeChange("hour", value)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-center text-sm">:</span>

                  {/* Minute selector */}
                  <Select
                    value={selectedMinute.toString()}
                    onValueChange={(value: string) =>
                      handleTimeChange("hour", value)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute.toString()}>
                          {minute.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

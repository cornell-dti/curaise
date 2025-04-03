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
  // Generate hours (1-12) and minutes for the time picker
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 4 }, (_, i) => i * 15);

  // Get current hour, minute, and period from value
  const date = value || new Date();
  const hour24 = date.getHours();
  const selectedHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const selectedMinute = Math.floor(date.getMinutes() / 15) * 15;
  const selectedPeriod = hour24 >= 12 ? "PM" : "AM";

  // Handle time selection
  const handleTimeChange = (
    type: "hour" | "minute" | "period",
    newValue: string
  ) => {
    const newDate = new Date(value || new Date());

    if (type === "hour") {
      let hour24 = parseInt(newValue, 10);
      if (selectedPeriod === "PM" && hour24 < 12) {
        hour24 += 12;
      } else if (selectedPeriod === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      newDate.setHours(hour24, selectedMinute);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(newValue, 10));
    } else if (type === "period") {
      let hour24 = selectedHour;
      if (newValue === "PM" && hour24 < 12) {
        hour24 += 12;
      } else if (newValue === "AM" && hour24 === 12) {
        hour24 = 0;
      } else if (newValue === "AM" && hour24 > 12) {
        hour24 -= 12;
      }
      newDate.setHours(hour24);
    }

    onChange(newDate);
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
            {value ? format(value, "PPP p") : <span>{placeholder}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-0">
            <div className="flex justify-center">
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
                className="rounded-md mx-auto"
              />
            </div>

            {/* Time picker section */}
            <div className="border-t border-border p-3">
              <div className="flex items-center justify-between">
                <div className="w-8 flex-shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex items-center space-x-2 ml-4">
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
                      handleTimeChange("minute", value)
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

                  {/* AM/PM selector */}
                  <Select
                    value={selectedPeriod}
                    onValueChange={(value: string) =>
                      handleTimeChange("period", value)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
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

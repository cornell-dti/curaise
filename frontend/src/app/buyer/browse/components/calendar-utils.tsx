import { View, Views } from "react-big-calendar";
import { CalendarEvent } from "./Calendar";
import { Clock3, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

function hexToHSL(hex: string) {
  let r = 0,
    g = 0,
    b = 0;

  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);

  const f = (n: number) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))),
    );

  return `#${f(0).toString(16).padStart(2, "0")}${f(8)
    .toString(16)
    .padStart(2, "0")}${f(4).toString(16).padStart(2, "0")}`;
}

export const organizationColors = [
  "#f74545ff", // red
  "#6a9f48", // green
  "#3197f7", // blue
  "#f78b2d", // orange
  "#f7c948", // yellow
  "#5b6cf7", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#2dd4bf", // teal
  "#6b7280", // gray
];

export const eventStyleGetter = (
  event: CalendarEvent,
  organizationNames: string[],
  currentView: View,
  isPickupEvent: boolean,
) => {
  const backgroundColor = event.organization
    ? organizationColors[organizationNames.indexOf(event.organization)]
    : "#3174ad";

  const isMonthPickup = currentView === Views.MONTH && isPickupEvent;

  return {
    className: isMonthPickup ? "calendar-month-pickup-event" : undefined,
    style: {
      backgroundColor: isMonthPickup
        ? "transparent"
        : `color-mix(in srgb, ${backgroundColor} 70%, white)`,
      opacity: 1,
      border: isMonthPickup
        ? "none"
        : currentView !== Views.MONTH
          ? `2px solid ${backgroundColor}`
          : `none`,
      borderRadius: currentView !== Views.MONTH ? "6px" : "2px",
      boxShadow: isMonthPickup ? "none" : undefined,
    },
  };
};

export function CalendarEventComponent({
  event,
  currentView,
  organizationNames,
  isPickupEvent,
}: {
  event: CalendarEvent;
  currentView: View;
  organizationNames: string[];
  isPickupEvent: boolean;
}) {
  return (
    <div
      style={{
        fontSize: "12px",
        lineHeight: "1.2",
        fontFamily: "DM Sans, sans-serif",
        cursor: "pointer",
      }}
    >
      {currentView === Views.MONTH && isPickupEvent ? (
        <div className="flex items-center gap-1 pl-1">
          <span
            className="block h-2 w-2 shrink-0"
            style={{
              backgroundColor:
                organizationColors[
                  organizationNames.indexOf(event.organization)
                ] ?? "#3174ad",
            }}
          />
          <span className="truncate font-medium text-black">
            {moment(event.start).format("h:mm A")}{" "}
            <span className="font-normal">{event.title}</span>
          </span>
        </div>
      ) : (
        <>
          <div
            style={{
              fontWeight: currentView !== Views.MONTH ? "700" : "600",
              fontSize: currentView == Views.DAY ? "16px" : "12px",
            }}
          >
            {event.title}
          </div>
          {currentView !== Views.MONTH && event.title.includes("Pick Up") && (
            <div className="flex flex-col py-1 gap-1">
              <div
                style={{
                  fontSize: currentView == Views.DAY ? "14px" : "10px",
                  opacity: 0.9,
                }}
              >
                {event.organization}
              </div>
              <div
                className={cn(
                  "flex gap-1",
                  currentView == Views.DAY ? "text-[14px]" : "text-[10px]",
                )}
              >
                <MapPin
                  className={cn(
                    currentView == Views.DAY ? "h-4 w-4" : "h-3 w-3",
                  )}
                />{" "}
                {event.location}
              </div>
              <div
                className={cn(
                  "flex gap-1",
                  currentView == Views.DAY ? "text-[14px]" : "text-[10px]",
                )}
              >
                <Clock3
                  className={cn(
                    currentView == Views.DAY ? "h-4 w-4" : "h-3 w-3",
                  )}
                />
                {moment(event.start).format("h:mm A")} -{" "}
                {moment(event.end).format("h:mm A")}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

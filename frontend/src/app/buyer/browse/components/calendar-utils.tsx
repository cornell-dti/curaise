import { View, Views } from "react-big-calendar";
import { CalendarEvent } from "./CalendarView";
import { Clock3, FileText, MapPin, ShoppingBag } from "lucide-react";
import {
  formatCompactTime,
  formatTimeRange,
  getOrganizationColor,
} from "./browse-utils";

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
    s = 0;
  const l = (max + min) / 2;

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

export const eventStyleGetter = (
  event: CalendarEvent,
  organizationNames: string[],
  currentView: View,
) => {
  const color = getOrganizationColor(
    organizationNames.indexOf(event.organization),
  );
  const lightColor = `color-mix(in srgb, ${color} 30%, white)`;

  if (currentView === Views.MONTH && event.type === "pickup") {
    return {
      className: "calendar-month-pickup-event",
      style: {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
      },
    };
  }

  if (event.type === "buying") {
    return {
      style: {
        backgroundColor: lightColor,
        border: `1px solid ${color}`,
        borderRadius: "3px",
        padding: "3px 4px",
        color: "black",
      },
    };
  }

  return {
    style: {
      backgroundColor: lightColor,
      border: `1px solid ${color}`,
      borderRadius: "5px",
      padding: "9px",
      color: "black",
      boxShadow: "0 0 0 1px white",
    },
  };
};

function PickupDetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-[3px]">
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}

export function CalendarEventComponent({
  event,
  currentView,
  organizationNames,
}: {
  event: CalendarEvent;
  currentView: View;
  organizationNames: string[];
}) {
  const color = getOrganizationColor(
    organizationNames.indexOf(event.organization),
  );

  if (event.type === "buying") {
    return (
      <div className="flex min-w-0 items-center gap-[5px] text-[12px] leading-[15px] text-black">
        <FileText className="size-3 shrink-0" />
        <span className="truncate">
          Pre-Order Form | <span className="font-bold">{event.title}</span>
        </span>
      </div>
    );
  }

  if (currentView === Views.MONTH) {
    return (
      <div className="flex min-w-0 items-center gap-[3px] pl-1 text-[12px] leading-[20px] text-black">
        <span
          className="size-[9px] shrink-0 rounded-[1px]"
          style={{ backgroundColor: color }}
        />
        <span className="truncate">
          <span className="font-semibold">
            {formatCompactTime(event.start)}
          </span>{" "}
          {event.title}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[13px] text-black">
      <div className="flex flex-col gap-[5px]">
        <div className="flex min-w-0 items-center gap-[3px] text-[12px] leading-[15px]">
          <ShoppingBag className="size-3 shrink-0" />
          <span className="truncate">Pick Up</span>
        </div>
        <p className="line-clamp-3 break-normal text-[13px] font-bold leading-[16px]">
          {event.title}
        </p>
      </div>
      <div className="flex flex-col gap-[5px] text-[10px] leading-[13px]">
        <PickupDetailRow
          icon={
            <span
              className="size-[9px] shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          }
        >
          {event.organization}
        </PickupDetailRow>
        <PickupDetailRow icon={<MapPin className="size-[10px] shrink-0" />}>
          {event.locations.join(", ")}
        </PickupDetailRow>
        <PickupDetailRow icon={<Clock3 className="size-[10px] shrink-0" />}>
          {formatTimeRange(event.start, event.end)}
        </PickupDetailRow>
      </div>
    </div>
  );
}

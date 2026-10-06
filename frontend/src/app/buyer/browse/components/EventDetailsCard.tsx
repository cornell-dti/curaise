import Image from "next/image";
import Link from "next/link";
import { MapPin, Tag, X, type LucideIcon } from "lucide-react";
import { z } from "zod";
import { BasicFundraiserSchema, CompleteItemSchema } from "common";
import { formatTimeRange } from "./browse-utils";

type Fundraiser = z.infer<typeof BasicFundraiserSchema>;
type Item = z.infer<typeof CompleteItemSchema>;

const VISIBLE_ITEM_COUNT = 2;

function formatPrice(price: number) {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

function getPriceRange(items: Item[]) {
  if (items.length === 0) return null;
  const prices = items.map((item) => Number(item.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? formatPrice(min)
    : `${formatPrice(min)}–${formatPrice(max)}`;
}

function Divider() {
  return <div className="h-px w-full bg-[#DDDDDD]" />;
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <p className="text-[12px] font-bold leading-[16px] text-black">
        {label}
      </p>
      {children}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[6px] text-[12px] leading-[16px] text-black">
      <Icon className="size-[14px] shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function EventDetailsCard({
  fundraiser,
  items,
  color,
  onClose,
}: {
  fundraiser: Fundraiser;
  items: Item[];
  color: string;
  onClose: () => void;
}) {
  const fundraiserUrl = `/buyer/fundraiser/${fundraiser.id}`;
  const priceRange = getPriceRange(items);
  const visibleItems = items.slice(0, VISIBLE_ITEM_COUNT);
  const hiddenItemCount = items.length - visibleItems.length;

  return (
    <div
      className="flex w-full flex-col gap-[10px] rounded-[8px] border-2 bg-white px-5 py-4 shadow-[0_4px_13px_rgba(0,0,0,0.25)]"
      style={{ borderColor: color }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-[16px] font-bold leading-[20px] text-black">
            {fundraiser.name}
          </h3>
          <div className="flex items-center gap-[6px]">
            <span
              className="size-[10px] shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[12px] leading-[16px] text-black">
              {fundraiser.organization.name}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close fundraiser details"
          className="shrink-0 text-black hover:opacity-60"
        >
          <X className="size-5" />
        </button>
      </div>

      <Divider />

      <Section label="Pickup Details">
        {fundraiser.pickupEvents.map((pickup) => (
          <DetailRow key={pickup.id} icon={MapPin}>
            {pickup.location}, {formatTimeRange(pickup.startsAt, pickup.endsAt)}
          </DetailRow>
        ))}
      </Section>

      {priceRange && (
        <Section label="Price">
          <DetailRow icon={Tag}>{priceRange}</DetailRow>
        </Section>
      )}

      {items.length > 0 && (
        <>
          <Divider />
          <Section label="Items">
            <div className="grid grid-cols-2 gap-[10px]">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[3px] border-[0.5px] border-[#F6F6F6] bg-white shadow-[1px_1px_2.5px_rgba(140,140,140,0.25)]"
                >
                  <div className="relative h-[104px] w-full bg-gray-200">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2 py-[6px] text-[12px] leading-[16px] text-black">
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0">
                      {formatPrice(Number(item.price))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {hiddenItemCount > 0 && (
              <Link
                href={fundraiserUrl}
                className="self-start text-[12px] font-bold leading-[16px] text-black underline"
              >
                +{hiddenItemCount} more {hiddenItemCount === 1 ? "item" : "items"}
              </Link>
            )}
          </Section>
        </>
      )}

      <Link
        href={fundraiserUrl}
        className="mt-[6px] flex h-[34px] w-full items-center justify-center rounded-[8px] bg-black px-5 text-[16px] font-semibold leading-[24px] text-[#FEFDFD] hover:bg-black/80"
      >
        View Fundraiser
      </Link>
    </div>
  );
}

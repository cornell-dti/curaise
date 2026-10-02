import { X } from "lucide-react";
import {
  categories,
  getOrganizationColor,
  type Filters,
  type Organization,
} from "./browse-utils";

function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[6px] rounded-[6px] border-[0.5px] border-[#BABABA] bg-white px-2 py-1">
      <span className="text-[14px] font-semibold leading-[21px] text-black">
        {label}
      </span>
      <span className="h-5 w-[0.5px] bg-[#DDDDDD]" />
      {children}
    </div>
  );
}

function Chip({
  label,
  leading,
  onRemove,
}: {
  label: string;
  leading: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="flex items-center gap-1 rounded-[4px] bg-[#F6F6F6] px-1 py-[2px]">
      {leading}
      <span className="text-[12px] leading-[18px] text-black">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex items-center justify-center text-black hover:opacity-60"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

export function FilterChips({
  organizations,
  filters,
  onFiltersChange,
}: {
  organizations: Organization[];
  filters: Filters;
  onFiltersChange: (newFilters: Filters) => void;
}) {
  const selectedClubs = organizations
    .map((organization, index) => ({ organization, colorIndex: index }))
    .filter(({ organization }) =>
      filters.organizations.includes(organization.id),
    );
  const selectedCategories = categories.filter(({ id }) =>
    filters.categories.includes(id),
  );

  return (
    <>
      {selectedClubs.length > 0 && (
        <ChipGroup label="Clubs">
          {selectedClubs.map(({ organization, colorIndex }) => (
            <Chip
              key={organization.id}
              label={organization.name}
              leading={
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: getOrganizationColor(colorIndex) }}
                />
              }
              onRemove={() =>
                onFiltersChange({
                  ...filters,
                  organizations: filters.organizations.filter(
                    (id) => id !== organization.id,
                  ),
                })
              }
            />
          ))}
        </ChipGroup>
      )}

      {selectedCategories.length > 0 && (
        <ChipGroup label="Items">
          {selectedCategories.map(({ id, label, icon: Icon }) => (
            <Chip
              key={id}
              label={label}
              leading={<Icon className="size-[13px] shrink-0 text-black" />}
              onRemove={() =>
                onFiltersChange({
                  ...filters,
                  categories: filters.categories.filter((c) => c !== id),
                })
              }
            />
          ))}
        </ChipGroup>
      )}
    </>
  );
}

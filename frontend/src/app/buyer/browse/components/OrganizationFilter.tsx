import { organizationColors } from "./utils";

interface OrganizationFilterProps {
  organizations: string[];
  selectedOrganizations: string[];
  onToggleOrganization: (org: string) => void;
}

export function OrganizationFilter({
  organizations,
  selectedOrganizations,
  onToggleOrganization,
}: OrganizationFilterProps) {
  return (
    <div className="w-full bg-white relative rounded-[8px] shrink-0 w-full border border-[#ddd]">
      <div className="px-[16px] overflow-clip rounded-[inherit] size-full">
        <div className=" content-stretch flex flex-col gap-[8px] items-start p-[16px] relative size-full">
          <div className="content-stretch flex flex-col justify-between relative shrink-0 w-full">
            <p className="leading-[21px] relative shrink-0 text-[14px] text-black whitespace-nowrap">
              Clubs
            </p>
            <span className="text-xs">(Only can select 3 clubs at a time)</span>
          </div>
          <div className="relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[8px] items-start relative size-full">
              {organizations.map((org) => (
                <label
                  key={org}
                  className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrganizations.includes(org)}
                    onChange={() => onToggleOrganization(org)}
                    className="sr-only"
                  />
                  <div
                    className="relative rounded-[2px] shrink-0 size-[12px] border-[0.6px] border-muted-foreground"
                    style={{
                      backgroundColor: selectedOrganizations.includes(org)
                        ? organizationColors[organizations.indexOf(org)]
                        : "#ffffff",
                    }}
                  />
                  <p className="leading-[18px] relative shrink-0 text-[12px] text-black whitespace-nowrap">
                    {org}
                  </p>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

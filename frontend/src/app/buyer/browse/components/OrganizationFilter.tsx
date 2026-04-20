import { ChevronDown } from "lucide-react";

export const organizations = [
  "Cornell Data Science",
  "DCC",
  "Digital Tech & Innovation",
  "CUxD",
];

export const events: CalendarEvent[] = [
  {
    title: "CDS Annual Gala",
    allDay: true,
    start: new Date(2026, 3, 5),
    end: new Date(2026, 3, 6),
    organization: "Cornell Data Science",
  },
  {
    title: "DCC Paris Baguette Fundraiser",
    start: new Date(2026, 3, 2, 11, 0),
    end: new Date(2026, 3, 2, 14, 0),
    organization: "DCC",
  },
  {
    title: "Redi x CURaise Hwa Yuan Fundraiser",
    start: new Date(2026, 3, 3, 11, 0),
    end: new Date(2026, 3, 3, 14, 0),
    organization: "Digital Tech & Innovation",
  },
  {
    title: "CURaise Egg Tart Fundraiser",
    start: new Date(2026, 3, 7, 10, 0),
    end: new Date(2026, 3, 13, 18, 0),
    organization: "Cornell Data Science",
  },
  {
    title: "DTI Pudding Fundraiser",
    start: new Date(2026, 3, 16, 11, 0),
    end: new Date(2026, 3, 16, 15, 0),
    organization: "Digital Tech & Innovation",
  },
  {
    title: "CDS Coffee Sale",
    start: new Date(2026, 3, 20, 9, 0),
    end: new Date(2026, 3, 20, 12, 0),
    organization: "Cornell Data Science",
  },
  {
    title: "DCC Spring Brunch",
    start: new Date(2026, 3, 24, 10, 0),
    end: new Date(2026, 3, 24, 13, 0),
    organization: "DCC",
  },
  {
    title: "CUxD Design Workshop",
    start: new Date(2026, 3, 28, 14, 0),
    end: new Date(2026, 3, 28, 17, 0),
    organization: "CUxD",
  },
  {
    title: "DTI Tech Talk",
    start: new Date(2026, 3, 30, 18, 0),
    end: new Date(2026, 3, 30, 20, 0),
    organization: "Digital Tech & Innovation",
  },
  {
    title: "CDS Networking Event",
    start: new Date(2026, 4, 2, 17, 0),
    end: new Date(2026, 4, 2, 19, 0),
    organization: "Cornell Data Science",
  },
  {
    title: "DCC Bake Sale",
    start: new Date(2026, 4, 5, 11, 0),
    end: new Date(2026, 4, 5, 15, 0),
    organization: "DCC",
  },
];

interface OrganizationFilterProps {
  selectedOrganizations: string[];
  onToggleOrganization: (org: string) => void;
}

const organizationColors: Record<string, string> = {
  "Cornell Data Science": "#f74545",
  DCC: "#6a9f48",
  "Digital Tech & Innovation": "#3197f7",
  CUxD: "#ffffff",
};

export function OrganizationFilter({
  selectedOrganizations,
  onToggleOrganization,
}: OrganizationFilterProps) {
  return (
    <div className="w-full bg-white relative rounded-[8px] shrink-0 w-full border border-[#ddd]">
      <div className="px-[16px] overflow-clip rounded-[inherit] size-full">
        <div className=" content-stretch flex flex-col gap-[8px] items-start p-[16px] relative size-full">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
            <p className="leading-[21px] relative shrink-0 text-[14px] text-black text-center whitespace-nowrap">
              Clubs
            </p>
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
                    className="relative rounded-[1px] shrink-0 size-[12px] border-[0.6px] border-black"
                    style={{
                      backgroundColor: selectedOrganizations.includes(org)
                        ? organizationColors[org]
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

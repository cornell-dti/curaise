import { Switch } from "@/components/ui/switch";

export function IncludePendingSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      Include Pending orders
    </label>
  );
}

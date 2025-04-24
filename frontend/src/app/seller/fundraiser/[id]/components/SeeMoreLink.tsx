"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SeeMoreLink({ path }: { path: string }) {
  const currentPath = usePathname();
  return (
    <div className="w-full flex flex-row justify-end">
      <Link href={`${currentPath}/${path}`}>
        <p className="text-[#3197F7] underline hover:text-[#1f6dc2] cursor-pointer">
          See More
        </p>
      </Link>
    </div>
  );
}

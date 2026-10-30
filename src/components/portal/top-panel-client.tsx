"use client";

import { Building2, Check, ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <ul className="-mb-px flex gap-1">
      {items.map((i) => {
        const on = i.href === "/portal" ? path === "/portal" : path.startsWith(i.href);
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center border-b-[3px] px-3 text-[13px] whitespace-nowrap transition-colors duration-150 outline-none focus-visible:underline",
                on ? "border-brand font-medium text-white" : "text-navy-muted border-transparent hover:text-white",
              )}
            >
              {i.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Switch the active organisation. The server only accepts memberships the user really holds. */
export function WorkspaceSwitcher({ active, options }: { active: number | null; options: { id: number; label: string; kind: string }[] }) {
  const router = useRouter();
  const current = options.find((o) => o.id === active);
  if (options.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={options.length < 2}
        className="focus-visible:ring-brand inline-flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 text-[13px] text-white transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 disabled:cursor-default disabled:hover:bg-white/5"
      >
        <Building2 className="text-brand size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate font-medium">{current?.label ?? "Choose a workspace"}</span>
        {options.length > 1 && <ChevronDown className="size-3.5 text-white/70" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {options.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onClick={async () => {
                if (o.id === active) return;
                await api("/api/me/workspace", "POST", { membershipId: o.id });
                toast.success(`Now working in ${o.label}`);
                router.push("/portal");
                router.refresh();
              }}
            >
              {o.id === active ? <Check className="size-4" /> : <span className="size-4" />}
              {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenu({ name, email, role }: { name: string; email: string; role: string }) {
  const router = useRouter();
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="bg-brand text-brand-foreground grid size-9 place-items-center rounded-full text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
        {/* Base UI requires a group label inside a Menu.Group; outside one it throws when the menu opens. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-[13px] font-medium text-foreground">{name}</span>
            <span className="block text-[12px] font-normal">{email}</span>
            <span className="mt-1 block text-[12px] font-normal">{role}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await api("/api/auth/logout");
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

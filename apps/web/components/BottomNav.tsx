"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ShoppingBasket, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/this-week", label: "Ugeplan", icon: CalendarDays },
  { href: "/shopping", label: "Indkøb", icon: ShoppingBasket },
  { href: "/chat", label: "AI Chef", icon: MessageSquare },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 pb-[env(safe-area-inset-bottom)] pt-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs font-medium transition",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

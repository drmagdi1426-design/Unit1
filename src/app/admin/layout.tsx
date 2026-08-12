import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { adminLogoutAction } from "./actions";

const NAV_ITEMS = [
  { href: "/admin", label: "نظرة عامة", icon: "📊" },
  { href: "/admin/questions", label: "تحليل الأسئلة", icon: "🧩" },
  { href: "/admin/participants", label: "المشاركون", icon: "👥" },
  { href: "/admin/item-banks", label: "بنوك الأسئلة", icon: "📚" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();

  if (!admin) {
    // Only reachable at /admin/login (everything else is guarded by proxy.ts).
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-extrabold text-brand-strong">
            <span className="text-xl">🛡️</span>
            لوحة تحكم المسؤول
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-bold">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-muted hover:bg-brand-soft hover:text-brand-strong"
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <form action={adminLogoutAction}>
              <button className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-bold text-danger hover:bg-danger/20">
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

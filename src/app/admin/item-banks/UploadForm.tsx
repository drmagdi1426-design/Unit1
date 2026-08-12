"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

export default function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setIssues([]);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/item-banks", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "فشل الاستيراد.");
        setIssues(data.issues ?? []);
        return;
      }
      setSuccess(`تم استيراد ${data.questionCount} سؤالاً بنجاح.`);
      formRef.current?.reset();
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-extrabold">رفع بنك أسئلة جديد</h2>
      <p className="mb-4 text-sm text-muted">
        يجب أن يتبع الملف تنسيق ورقة &quot;Item Bank&quot; ذاته (26 عموداً)، مع ورقتي
        &quot;Blueprint&quot; و&quot;QA Log&quot; اختيارياً.
      </p>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-muted">رمز الوحدة (فريد)</label>
            <input
              name="code"
              required
              placeholder="UNIT-2"
              className="rounded-xl border border-border bg-background px-4 py-2.5 outline-none ring-brand/30 focus:ring-2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-muted">العنوان</label>
            <input
              name="title"
              required
              placeholder="الوحدة 2 - ..."
              className="rounded-xl border border-border bg-background px-4 py-2.5 outline-none ring-brand/30 focus:ring-2"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-muted">وصف مختصر (اختياري)</label>
          <input
            name="description"
            className="rounded-xl border border-border bg-background px-4 py-2.5 outline-none ring-brand/30 focus:ring-2"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-muted">ملف Excel</label>
          <input
            name="file"
            type="file"
            accept=".xlsx"
            required
            className="rounded-xl border border-border bg-background px-4 py-2.5 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-bold file:text-brand-strong"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="makeActive" className="h-4 w-4 accent-brand" />
          تعيينه كبنك الأسئلة النشط فور الاستيراد
        </label>

        {error && (
          <div className="rounded-xl bg-danger/10 p-3 text-sm font-semibold text-danger">
            <p>{error}</p>
            {issues.length > 0 && (
              <ul className="mt-2 list-disc pr-5 text-xs font-normal">
                {issues.slice(0, 15).map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
                {issues.length > 15 && <li>...و{issues.length - 15} ملاحظة أخرى.</li>}
              </ul>
            )}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">{success}</div>
        )}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "جارٍ الرفع والتحقق..." : "رفع واستيراد"}
        </Button>
      </form>
    </Card>
  );
}

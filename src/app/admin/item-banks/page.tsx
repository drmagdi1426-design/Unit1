import { prisma } from "@/lib/prisma";
import { Card, Button } from "@/components/ui";
import UploadForm from "./UploadForm";
import { activateItemBankAction } from "./actions";

export default async function AdminItemBanksPage() {
  const banks = await prisma.itemBank.findMany({
    orderBy: { importedAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">بنوك الأسئلة</h1>
        <p className="mt-1 text-muted">
          البنك النشط هو ما يُعرض للمشاركين الجدد عند التسجيل. يمكن أن يكون بنك واحد نشطاً في كل مرة.
        </p>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="py-2 pr-2 font-bold">الرمز</th>
                <th className="py-2 pr-2 font-bold">العنوان</th>
                <th className="py-2 pr-2 font-bold">عدد الأسئلة</th>
                <th className="py-2 pr-2 font-bold">عدد المحاولات</th>
                <th className="py-2 pr-2 font-bold">تاريخ الاستيراد</th>
                <th className="py-2 pr-2 font-bold">الحالة</th>
                <th className="py-2 pr-2 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {banks.map((b) => (
                <tr key={b.id} className="border-b border-border">
                  <td className="py-3 pr-2 font-bold">{b.code}</td>
                  <td className="py-3 pr-2">{b.title}</td>
                  <td className="py-3 pr-2 tabular-nums">{b._count.questions}</td>
                  <td className="py-3 pr-2 tabular-nums">{b._count.attempts}</td>
                  <td className="py-3 pr-2 text-xs text-muted">
                    {new Date(b.importedAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="py-3 pr-2">
                    {b.isActive ? (
                      <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success">
                        نشط
                      </span>
                    ) : (
                      <span className="rounded-full bg-border px-2 py-1 text-xs font-bold text-muted">
                        غير نشط
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-2">
                    {!b.isActive && (
                      <form action={activateItemBankAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <Button variant="ghost" type="submit" className="!px-3 !py-1.5 text-xs">
                          تفعيل
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <UploadForm />
    </div>
  );
}

import { PageShell } from "@/components/ui";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <PageShell className="flex max-w-md flex-1 flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mb-2 text-4xl">🎯</div>
        <h1 className="text-2xl font-extrabold text-foreground">سجّل بياناتك للبدء</h1>
        <p className="mt-2 text-muted">
          45 سؤالاً، تغذية راجعة فورية على كل إجابة، ونقاط ومستويات تتابع تقدّمك.
        </p>
      </div>
      <RegisterForm />
    </PageShell>
  );
}

"use client";

import { Button } from "@/components/ui";

export default function PrintButton() {
  return (
    <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
      🖨️ طباعة النتيجة / حفظ كملف PDF
    </Button>
  );
}

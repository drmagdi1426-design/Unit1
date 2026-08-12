"use client";

import { deleteParticipantAction } from "./actions";

export default function DeleteParticipantButton({
  participantId,
  participantName,
  className = "",
}: {
  participantId: string;
  participantName: string;
  className?: string;
}) {
  return (
    <form
      action={deleteParticipantAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `هل أنت متأكد من حذف "${participantName}" وكل نتائجه وإجاباته نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={participantId} />
      <button
        type="submit"
        className={`rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/20 ${className}`}
      >
        🗑️ حذف
      </button>
    </form>
  );
}

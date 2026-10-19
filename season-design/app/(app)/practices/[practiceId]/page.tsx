import Link from "next/link";
import { notFound } from "next/navigation";
import { getSavedTrainingPracticeAction } from "@/features/training-dna/actions";
import { PracticePreview } from "@/features/training-dna/practice-preview";
import { FeedbackForm } from "@/features/training-dna/feedback-form";

export default async function SavedPracticePage({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}) {
  const { practiceId } = await params;
  const saved = await getSavedTrainingPracticeAction(practiceId);
  if (!saved) notFound();

  return (
    <main className="shell pageStack" dir="rtl">
      <Link href="/practices/new" className="backLink">← לאימון חדש</Link>
      <PracticePreview practice={saved.practice} />
      <FeedbackForm practice={saved.practice} />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  assignmentDetailsResponseSchema,
  assignmentIntakeErrorResponseSchema,
  type AssignmentDetails,
} from "@repo/shared/assignment";
import { getApiUrl } from "@/lib/api-base";

export default function AssignmentDetailsPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAssignment() {
      if (!assignmentId) {
        setErrorMessage("Missing assignment id");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(getApiUrl(`/assignments/${assignmentId}`), {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const rawError = await response.json().catch(() => null);
          const parsedError = assignmentIntakeErrorResponseSchema.safeParse(rawError);
          setErrorMessage(parsedError.success ? parsedError.data.error : "Failed to load assignment");
          return;
        }

        const raw = await response.json().catch(() => null);
        const parsed = assignmentDetailsResponseSchema.safeParse(raw);

        if (!parsed.success) {
          setErrorMessage("Unexpected response while loading assignment");
          return;
        }

        setAssignment(parsed.data.assignment);
      } catch {
        setErrorMessage("Could not reach backend endpoint.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAssignment();
  }, [assignmentId]);

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">Assignment</h1>
          <Link href="/assignments" className="text-sm font-medium text-gray-700 hover:text-black">
            Back to assignments
          </Link>
        </div>

        {isLoading ? <p className="text-sm text-gray-500">Loading assignment...</p> : null}
        {!isLoading && errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        {!isLoading && !errorMessage && assignment ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h2 className="text-lg font-semibold text-gray-900">{assignment.chapterName}</h2>
              <p className="mt-1 text-sm text-gray-600">Due Date: {assignment.dueDate}</p>
              <p className="text-sm text-gray-600">Created by: {assignment.createdBy.username}</p>
              <p className="text-sm text-gray-600">
                Totals: {assignment.totals.totalQuestions} questions, {assignment.totals.totalMarks} marks
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">Question Type Breakdown</h3>
              <div className="mt-2 space-y-2">
                {assignment.questionTypes.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm"
                  >
                    <span className="text-gray-800">{row.type}</span>
                    <span className="text-gray-600">
                      {row.questions} x {row.marks}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">Generated Assignment Content (Dummy)</h3>
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">{assignment.generatedContent.title}</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{assignment.generatedContent.body}</pre>
              </div>
            </div>

            {assignment.additionalInfo ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Additional Information</h3>
                <p className="mt-2 text-sm text-gray-700">{assignment.additionalInfo}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

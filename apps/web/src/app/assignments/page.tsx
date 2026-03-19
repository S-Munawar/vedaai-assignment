"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  assignmentIntakeErrorResponseSchema,
  assignmentListResponseSchema,
  type AssignmentListItem,
} from "@repo/shared/assignment";
import { getApiUrl } from "@/lib/api-base";

export default function Assignments() {
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAssignments() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(getApiUrl("/assignments"), {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const rawError = await response.json().catch(() => null);
          const errorParsed = assignmentIntakeErrorResponseSchema.safeParse(rawError);
          setErrorMessage(errorParsed.success ? errorParsed.data.error : "Failed to load assignments");
          return;
        }

        const raw = await response.json().catch(() => null);
        const parsed = assignmentListResponseSchema.safeParse(raw);

        if (!parsed.success) {
          setErrorMessage("Unexpected response while loading assignments");
          return;
        }

        setAssignments(parsed.data.assignments);
      } catch {
        setErrorMessage("Could not reach backend endpoint.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAssignments();
  }, []);

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">Assignments created by teachers in your school.</p>
        </header>

        {isLoading ? <p className="text-sm text-gray-500">Loading assignments...</p> : null}
        {!isLoading && errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        {!isLoading && !errorMessage && assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No assignments found for your school yet.</p>
        ) : null}

        {!isLoading && !errorMessage && assignments.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {assignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/assignments/${assignment.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
              >
                <h2 className="text-base font-semibold text-gray-900">{assignment.chapterName}</h2>
                <p className="mt-1 text-xs text-gray-500">Due: {assignment.dueDate}</p>
                <p className="mt-1 text-xs text-gray-500">Created by: {assignment.createdBy.username}</p>
                <p className="mt-2 text-sm text-gray-700">
                  {assignment.totalQuestions} questions • {assignment.totalMarks} marks • {assignment.questionTypeCount} types
                </p>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

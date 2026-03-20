"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  assignmentCreatedRealtimeEventSchema,
  assignmentDeletedRealtimeEventSchema,
  assignmentIntakeErrorResponseSchema,
  assignmentListResponseSchema,
  type AssignmentListItem,
} from "@repo/shared/assignment";
import { getApiUrl } from "@/lib/api-base";
import { getRealtimeSocket } from "@/lib/realtime";

export default function Assignments() {
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">("connecting");

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

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(assignmentId));

    try {
      const response = await fetch(getApiUrl(`/assignments/${assignmentId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const errorParsed = assignmentIntakeErrorResponseSchema.safeParse(rawError);
        const errorMsg = errorParsed.success ? errorParsed.data.error : "Failed to delete assignment";
        setErrorMessage(errorMsg);
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(assignmentId);
          return next;
        });
        return;
      }

      // The real-time event will handle removing from the list
    } catch {
      setErrorMessage("Could not reach backend endpoint.");
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
    }
  };

  useEffect(() => {
    const socket = getRealtimeSocket();

    if (!socket) {
      setRealtimeStatus("disconnected");
      return;
    }

    setRealtimeStatus(socket.connected ? "connected" : "connecting");

    const onAssignmentCreated = (payload: unknown) => {
      const parsed = assignmentCreatedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      const incoming = parsed.data.assignment;

      setAssignments((prev) => {
        if (prev.some((assignment) => assignment.id === incoming.id)) {
          return prev;
        }

        return [incoming, ...prev];
      });
    };

    const onAssignmentDeleted = (payload: unknown) => {
      const parsed = assignmentDeletedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      setAssignments((prev) => prev.filter((assignment) => assignment.id !== parsed.data.assignmentId));
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(parsed.data.assignmentId);
        return next;
      });
    };

    const onConnect = () => setRealtimeStatus("connected");
    const onDisconnect = () => setRealtimeStatus("disconnected");
    const onReconnectAttempt = () => setRealtimeStatus("reconnecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("assignment:created", onAssignmentCreated);
    socket.on("assignment:deleted", onAssignmentDeleted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("assignment:created", onAssignmentCreated);
      socket.off("assignment:deleted", onAssignmentDeleted);
    };
  }, []);

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <header className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                realtimeStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : realtimeStatus === "reconnecting"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              Realtime: {realtimeStatus}
            </span>
          </div>
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
              <div
                key={assignment.id}
                className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="flex-1 text-left"
                  >
                    <h2 className="text-base font-semibold text-gray-900">{assignment.chapterName}</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Class {assignment.classLevel || "-"} • {assignment.subject || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Due: {assignment.dueDate}</p>
                    <p className="mt-1 text-xs text-gray-500">Created by: {assignment.createdBy.username}</p>
                    <p className="mt-2 text-sm text-gray-700">
                      {assignment.totalQuestions} questions • {assignment.totalMarks} marks • {assignment.questionTypeCount} types
                    </p>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDeleteAssignment(assignment.id);
                    }}
                    disabled={deletingIds.has(assignment.id)}
                    className="mt-1 flex-shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete assignment"
                  >
                    {deletingIds.has(assignment.id) ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

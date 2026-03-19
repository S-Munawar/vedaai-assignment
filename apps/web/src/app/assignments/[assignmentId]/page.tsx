"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  assignmentCreatedRealtimeEventSchema,
  assignmentDeletedRealtimeEventSchema,
  assignmentDetailsResponseSchema,
  assignmentIntakeErrorResponseSchema,
  type AssignmentDetails,
} from "@repo/shared/assignment";
import { getApiUrl } from "@/lib/api-base";
import { getRealtimeSocket } from "@/lib/realtime";

export default function AssignmentDetailsPage() {
  const params = useParams<{ assignmentId: string }>();
  const router = useRouter();
  const assignmentId = params.assignmentId;

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">("connecting");

  const loadAssignment = useCallback(async () => {
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
  }, [assignmentId]);

  useEffect(() => {
    void loadAssignment();
  }, [loadAssignment]);

  const handleDeleteAssignment = async () => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    if (!assignmentId) {
      setErrorMessage("Missing assignment id");
      return;
    }

    setIsDeleting(true);

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
        setIsDeleting(false);
        return;
      }

      // The router will be handled by the real-time event
    } catch {
      setErrorMessage("Could not reach backend endpoint.");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const socket = getRealtimeSocket();

    if (!socket) {
      setRealtimeStatus("disconnected");
      return;
    }

    setRealtimeStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => setRealtimeStatus("connected");
    const onDisconnect = () => setRealtimeStatus("disconnected");
    const onReconnectAttempt = () => setRealtimeStatus("reconnecting");

    const onAssignmentCreated = (payload: unknown) => {
      const parsed = assignmentCreatedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      if (parsed.data.assignment.id === assignmentId) {
        void loadAssignment();
      }
    };

    const onAssignmentDeleted = (payload: unknown) => {
      const parsed = assignmentDeletedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      if (parsed.data.assignmentId === assignmentId) {
        // Redirect to assignments page after a short delay
        setTimeout(() => {
          router.push("/assignments");
        }, 500);
      }
    };

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
  }, [assignmentId, loadAssignment]);

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assignment</h1>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleDeleteAssignment()}
              disabled={isDeleting || isLoading}
              className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <Link href="/assignments" className="text-sm font-medium text-gray-700 hover:text-black">
              Back to assignments
            </Link>
          </div>
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

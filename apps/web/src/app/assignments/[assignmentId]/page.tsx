"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  assignmentCreatedRealtimeEventSchema,
  deleteAssignmentResponseSchema,
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

      const rawSuccess = await response.json().catch(() => null);
      const parsedSuccess = deleteAssignmentResponseSchema.safeParse(rawSuccess);

      if (!parsedSuccess.success) {
        setErrorMessage("Unexpected response while deleting assignment");
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

  const renderPaperLine = (line: string, index: number) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={`space-${index}`} className="h-3" />;
    }

    if (/^=+$/.test(trimmed)) {
      return <hr key={`hr-${index}`} className="my-3 border-gray-300" />;
    }

    if (/^SECTION\s+[A-Z]+:/i.test(trimmed)) {
      return (
        <h4 key={`section-${index}`} className="mt-6 text-center text-base font-bold text-gray-900">
          {trimmed}
        </h4>
      );
    }

    if (trimmed === "ANSWER KEY") {
      return (
        <h4 key={`answers-${index}`} className="mt-8 text-lg font-bold text-gray-900">
          {trimmed}
        </h4>
      );
    }

    if (/^Q\d+\./.test(trimmed)) {
      return (
        <p key={`q-${index}`} className="mt-2 text-[13px] leading-relaxed text-gray-900">
          {trimmed}
        </p>
      );
    }

    if (/^Q\d+:/.test(trimmed)) {
      return (
        <p key={`a-${index}`} className="mt-2 text-[13px] leading-relaxed text-gray-800">
          {trimmed}
        </p>
      );
    }

    if (/^(Chapter|Due Date|Total Marks|Total Questions|OVERVIEW|INSTRUCTIONS):/i.test(trimmed)) {
      return (
        <p key={`meta-${index}`} className="text-[13px] font-semibold text-gray-800">
          {trimmed}
        </p>
      );
    }

    return (
      <p key={`line-${index}`} className="text-[13px] leading-relaxed text-gray-800">
        {trimmed}
      </p>
    );
  };

  function calculateRecommendedTimeMinutes(details: AssignmentDetails): number {
    const baseByType: Record<string, number> = {
      "Multiple Choice Questions": 1.5,
      "True/False Questions": 1,
      "Short Questions": 3,
      "Numerical Problems": 4,
      "Diagram/Graph-Based Questions": 5,
      "Long Answer Questions": 6,
    };

    const totalMinutes = details.questionTypes.reduce((sum, row) => {
      const base = baseByType[row.type] ?? 2.5;
      const perQuestion = base + row.marks * 1.1;
      return sum + row.questions * perQuestion;
    }, 0);

    const rounded = Math.ceil(totalMinutes / 5) * 5;
    return Math.max(30, rounded);
  }

  function formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }

    return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minutes`;
  }

  function resolveHeaderMeta(details: AssignmentDetails) {
    const defaultTime = `Time Allowed: ${formatMinutes(calculateRecommendedTimeMinutes(details))}`;
    const defaultInstruction = "All questions are compulsary unless stated otherwise.";

    let timeLine = defaultTime;
    let instructionLine = defaultInstruction;

    const info = details.additionalInfo || "";
    const lines = info
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const explicitTime = line.match(/^time\s*(allowed)?\s*:\s*(.+)$/i);
      if (explicitTime?.[2]) {
        timeLine = `Time Allowed: ${explicitTime[2].trim()}`;
        continue;
      }

      if (/^all\s+questions/i.test(line)) {
        instructionLine = line;
        continue;
      }

      const explicitInstruction = line.match(/^(instructions?|note)\s*:\s*(.+)$/i);
      if (explicitInstruction?.[2]) {
        instructionLine = explicitInstruction[2].trim();
      }
    }

    if (timeLine === defaultTime) {
      const inlineDuration = info.match(/(\d+)\s*(hours?|hrs?|minutes?|mins?)/i);
      if (inlineDuration?.[1] && inlineDuration?.[2]) {
        const value = Number(inlineDuration[1]);
        const unitRaw = inlineDuration[2].toLowerCase();
        const unit = unitRaw.startsWith("h") ? "hour" : "minute";
        const label = value === 1 ? unit : `${unit}s`;
        timeLine = `Time Allowed: ${value} ${label}`;
      }
    }

    return {
      schoolName: details.schoolName || "School",
      subject: details.subject || "-",
      classLevel: details.classLevel || "-",
      maxMarks: details.totals.totalMarks,
      timeLine,
      instructionLine,
    };
  }

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0%,#f5f5f5_40%,#efefef_100%)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-300 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur sm:p-8">
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
            {(() => {
              const headerMeta = resolveHeaderMeta(assignment);

              return (
            <article className="mx-auto max-w-[820px] rounded-lg border-2 border-dashed border-sky-400 bg-[#fbfbfb] p-5 text-gray-900 sm:p-8">
              <header className="text-center font-['Times_New_Roman',serif]">
                <h2 className="text-[34px] font-semibold leading-tight">{headerMeta.schoolName}</h2>
                <p className="mt-1 text-base font-semibold">Subject: {headerMeta.subject}</p>
                <p className="text-base font-semibold">Class: {headerMeta.classLevel}</p>
              </header>

              <div className="mt-6 flex items-center justify-between text-[13px] font-semibold">
                <span>{headerMeta.timeLine}</span>
                <span>Maximum Marks: {headerMeta.maxMarks}</span>
              </div>

              <p className="mt-4 text-[13px] text-gray-800">{headerMeta.instructionLine}</p>

              <div className="mt-5 space-y-1 text-[13px] text-gray-800">
                <p>Name: ____________</p>
                <p>Roll Number: ____________</p>
                <p>Class: {headerMeta.classLevel} Section: ____________</p>
              </div>

              <div className="mt-8 font-['Times_New_Roman',serif]">
                {assignment.generatedContent.body
                  .split("\n")
                  .map((line, index) => renderPaperLine(line, index))}
              </div>
            </article>
              );
            })()}

            <aside className="rounded-lg border border-gray-200 bg-white p-4">
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
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}

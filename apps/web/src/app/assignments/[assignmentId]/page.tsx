"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const articleRef = useRef<HTMLElement | null>(null);

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

  const handleDownloadAsPdf = () => {
    if (typeof window === "undefined") {
      return;
    }

    const articleElement = articleRef.current;
    if (!articleElement) {
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Assignment</title>
          ${styles}
          <style>
            @page {
              margin: 12mm;
            }

            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            #assignment-print-article {
              background: #ffffff !important;
              border-radius: 0 !important;
            }
          </style>
        </head>
        <body>
          ${articleElement.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    let hasPrinted = false;

    const printAndCleanup = () => {
      if (hasPrinted) {
        return;
      }

      hasPrinted = true;
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      window.setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 800);
    };

    iframe.onload = printAndCleanup;

    // Fallback in case onload already fired before callback assignment.
    window.setTimeout(() => {
      if (!iframe.parentNode || hasPrinted) {
        return;
      }

      printAndCleanup();
    }, 300);
  };

  useEffect(() => {
    const socket = getRealtimeSocket();

    if (!socket) {
      return;
    }


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

    socket.on("assignment:created", onAssignmentCreated);
    socket.on("assignment:deleted", onAssignmentDeleted);

    return () => {
      socket.off("assignment:created", onAssignmentCreated);
      socket.off("assignment:deleted", onAssignmentDeleted);
    };
  }, [assignmentId, loadAssignment, router]);

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
    <section className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full flex-1 flex-col gap-3 rounded-xl">

        {isLoading ? (
          <div className="rounded-2xl bg-white/70 p-5 text-sm text-muted">Loading assignment...</div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-2xl bg-white/70 p-5 text-sm text-error">{errorMessage}</div>
        ) : null}

        {!isLoading && !errorMessage && assignment ? (
          <div className="flex flex-col gap-3 rounded-4xl bg-white p-5 md:bg-[#5E5E5E]">
            <aside className="flex flex-col items-start justify-center gap-4 rounded-4xl bg-dark px-8 py-6 md:bg-dark/80 text-white">
              <p className="text-base font-bold leading-relaxed">
                Certainly, {assignment.createdBy.username}! Here are customized Question Paper for your CBSE Grade {assignment.classLevel} {assignment.subject} classes on the NCERT chapters: {assignment.chapterName}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadAsPdf}
                  className="hidden items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:opacity-90 md:inline-flex"
                >
                  <Image src="/icons/Download.svg" alt="Download" width={16} height={16} />
                  <span>Download as PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAsPdf}
                  className="inline-flex items-center justify-center rounded-full bg-transparent text-primary transition hover:opacity-90 md:hidden"
                >
                  <Image src="/mobile-icons/Download.svg" alt="Download" width={32} height={32} />
                </button>
              </div>
            </aside>
              {(() => {
                const headerMeta = resolveHeaderMeta(assignment);

                return (
            <article ref={articleRef} id="assignment-print-article" className="flex flex-col rounded-4xl bg-off-white-primary p-5 text-primary font-['Inter',serif] md:bg-white">
              <header className="text-center font-['Times_New_Roman',serif]">
                <h2 className="text-[32px] font-bold leading-tight text-primary">{headerMeta.schoolName}</h2>
                <p className="mt-1 text-2xl font-semibold text-primary">Subject: {headerMeta.subject}</p>
                <p className="text-2xl font-semibold text-primary">Class: {headerMeta.classLevel}</p>
              </header>

              <div className="mt-6 flex items-center justify-between text-lg font-semibold text-primary">
                <span>{headerMeta.timeLine}</span>
                <span>Maximum Marks: {headerMeta.maxMarks}</span>
              </div>

              <p className="mt-4 text-lg font-semibold text-primary">{headerMeta.instructionLine}</p>

              <div className="mt-5 space-y-1 text-lg font-semibold text-primary">
                <p>Name: ____________</p>
                <p>Roll Number: ____________</p>
                <p>Class: {headerMeta.classLevel} Section: ____________</p>
              </div>

              <div className="mt-8">
                {assignment.generatedContent.body
                  .split("\n")
                  .map((line, index) => renderPaperLine(line, index))}
              </div>
            </article>
                );
              })()}

          </div>
        ) : null}
      </div>

    </section>
  );
}

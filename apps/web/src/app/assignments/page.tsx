"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  assignmentCreatedRealtimeEventSchema,
  deleteAssignmentResponseSchema,
  assignmentDeletedRealtimeEventSchema,
  assignmentIntakeErrorResponseSchema,
  assignmentListResponseSchema,
  type AssignmentListItem,
} from "@repo/shared/assignment";
import { getApiUrl } from "@/lib/api-base";
import { getRealtimeSocket } from "@/lib/realtime";
import Image from 'next/image';
import { Plus } from 'lucide-react';


export default function Assignments() {
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState("all");
  const [draftClass, setDraftClass] = useState("all");
  const [draftSubject, setDraftSubject] = useState("all");
  const [draftCreator, setDraftCreator] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "reconnecting" | "disconnected">("connecting");

  const classOptions = useMemo(() => {
    return Array.from(
      new Set(assignments.map((assignment) => assignment.classLevel?.trim() || "").filter(Boolean)),
    ).sort((a, b) => Number(a) - Number(b));
  }, [assignments]);

  const subjectOptions = useMemo(() => {
    return Array.from(
      new Set(assignments.map((assignment) => assignment.subject?.trim() || "").filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [assignments]);

  const creatorOptions = useMemo(() => {
    return Array.from(
      new Set(assignments.map((assignment) => assignment.createdBy.username.trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const classLevel = assignment.classLevel?.trim() || "";
      const subject = assignment.subject?.trim() || "";
      const creator = assignment.createdBy.username.trim();

      const matchesClass = selectedClass === "all" || classLevel === selectedClass;
      const matchesSubject = selectedSubject === "all" || subject === selectedSubject;
      const matchesCreator = selectedCreator === "all" || creator === selectedCreator;

      if (!matchesClass || !matchesSubject || !matchesCreator) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchText = [
        assignment.chapterName,
        classLevel,
        subject,
        creator,
        assignment.dueDate,
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(normalizedQuery);
    });
  }, [assignments, searchQuery, selectedClass, selectedSubject, selectedCreator]);

  const activeFiltersCount = [selectedClass, selectedSubject, selectedCreator].filter(
    (value) => value !== "all",
  ).length;

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

      const rawSuccess = await response.json().catch(() => null);
      const parsedSuccess = deleteAssignmentResponseSchema.safeParse(rawSuccess);

      if (!parsedSuccess.success) {
        setErrorMessage("Unexpected response while deleting assignment");
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
    <section className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl rounded-xl p-6 sm:p-8">
        {isLoading || errorMessage || assignments.length > 0 ? (
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
        ) : null}

        {isLoading ? <p className="text-sm text-gray-500">Loading assignments...</p> : null}
        {!isLoading && errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        {!isLoading && !errorMessage && assignments.length > 0 ? (
          <div className="mb-5 rounded-xl border border-gray-200 bg-[#f2f2f2] p-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftClass(selectedClass);
                  setDraftSubject(selectedSubject);
                  setDraftCreator(selectedCreator);
                  setIsFiltersOpen(true);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-600 transition hover:bg-white"
              >
                <span aria-hidden="true">▿</span>
                <span>Filter By</span>
                {activeFiltersCount > 0 ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-800 px-1 text-[10px] font-semibold text-white">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </button>

              <div className="relative w-full max-w-xs">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">⌕</span>
                <input
                  id="assignment-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search Assignment"
                  className="h-9 w-full rounded-full border border-gray-300 bg-white pl-8 pr-3 text-xs text-gray-700 outline-none transition focus:border-gray-400"
                />
              </div>
            </div>
          </div>
        ) : null}

        {isFiltersOpen && assignments.length > 0 ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  <p className="mt-1 text-sm text-gray-500">Set filters and apply them to the assignments list.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="assignment-class-filter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Class
                  </label>
                  <select
                    id="assignment-class-filter"
                    value={draftClass}
                    onChange={(event) => setDraftClass(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-400"
                  >
                    <option value="all">All classes</option>
                    {classOptions.map((classLevel) => (
                      <option key={classLevel} value={classLevel}>
                        Class {classLevel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="assignment-subject-filter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Subject
                  </label>
                  <select
                    id="assignment-subject-filter"
                    value={draftSubject}
                    onChange={(event) => setDraftSubject(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-400"
                  >
                    <option value="all">All subjects</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="assignment-creator-filter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Creator
                  </label>
                  <select
                    id="assignment-creator-filter"
                    value={draftCreator}
                    onChange={(event) => setDraftCreator(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-400"
                  >
                    <option value="all">All creators</option>
                    {creatorOptions.map((creator) => (
                      <option key={creator} value={creator}>
                        {creator}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftClass("all");
                    setDraftSubject("all");
                    setDraftCreator("all");
                  }}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Clear
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen(false)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClass(draftClass);
                      setSelectedSubject(draftSubject);
                      setSelectedCreator(draftCreator);
                      setIsFiltersOpen(false);
                    }}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && !errorMessage && assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-8 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/no-assignments.png"
                alt="Development in progress"
                width={260}
                height={260}
                className="mx-auto"
                priority
              />
              <div className="mx-auto flex max-w-xl flex-col gap-2 px-4">
                <h1 className="text-primary text-xl font-bold">No assignments yet</h1>
                <p className="text-secondary text-lg font-normal whitespace-normal wrap-break-word">
                  Create your first assignment to start collecting and grading student submissions. You can set up
                  rubrics, define marking criteria, and let AI assist with grading.
                </p>
              </div>
            </div>

            <Link
              href="/create-assignment"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-6 py-3 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New First Assignment</span>
            </Link>
          </div>
        ) : null}

        {!isLoading && !errorMessage && assignments.length > 0 && filteredAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">No assignments match the current search and filters.</p>
        ) : null}

        {!isLoading && !errorMessage && filteredAssignments.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredAssignments.map((assignment) => (
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
                    className="mt-1 shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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

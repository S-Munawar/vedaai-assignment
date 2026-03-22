"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  assignmentCreatedRealtimeEventSchema,
  assignmentDeletedRealtimeEventSchema,
} from "@repo/shared/assignment";
import { getRealtimeSocket } from "@/lib/realtime";
import Image from "next/image";
import { useAssignmentsList } from "@/hooks/useAssignmentsList";
import { PageHeader } from "@/components/PageHeader";

export default function Assignments() {
  const {
    assignments,
    isLoading,
    errorMessage,
    deletingIds,
    searchQuery,
    selectedClass,
    selectedSubject,
    selectedCreator,
    isFiltersOpen,
    realtimeStatus,
    loadAssignments,
    deleteAssignment,
    setSearchQuery,
    setSelectedClass,
    setSelectedSubject,
    setSelectedCreator,
    setIsFiltersOpen,
    setRealtimeStatus,
    onRealtimeCreated,
    onRealtimeDeleted,
  } = useAssignmentsList();

  const [draftClass, setDraftClass] = useState("all");
  const [draftSubject, setDraftSubject] = useState("all");
  const [draftCreator, setDraftCreator] = useState("all");
  const [openMenuAssignmentId, setOpenMenuAssignmentId] = useState<string | null>(null);

  const classOptions = useMemo(() => {
    return Array.from(
      new Set(assignments.map((a) => a.classLevel?.trim() || "").filter(Boolean)),
    ).sort((a, b) => Number(a) - Number(b));
  }, [assignments]);

  const subjectOptions = useMemo(() => {
    return Array.from(
      new Set(assignments.map((a) => a.subject?.trim() || "").filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [assignments]);

  const creatorOptions = useMemo(() => {
    return Array.from(
      new Set(assignments.map((a) => a.createdBy.username.trim()).filter(Boolean)),
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

      if (!matchesClass || !matchesSubject || !matchesCreator) return false;
      if (!normalizedQuery) return true;

      const searchText = [assignment.chapterName, classLevel, subject, creator, assignment.dueDate]
        .join(" ")
        .toLowerCase();

      return searchText.includes(normalizedQuery);
    });
  }, [assignments, searchQuery, selectedClass, selectedSubject, selectedCreator]);

  const activeFiltersCount = [selectedClass, selectedSubject, selectedCreator].filter(
    (v) => v !== "all",
  ).length;

  const hasAssignments = assignments.length > 0;
  const hasError = Boolean(errorMessage);
  const hasFilteredAssignments = filteredAssignments.length > 0;

  const showHeader = isLoading || hasError || hasAssignments;
  const showToolbar = !isLoading && !hasError && hasAssignments;
  const showFiltersModal = isFiltersOpen && hasAssignments;
  const showEmptyState = !isLoading && !hasError && !hasAssignments;
  // FIX: added `hasAssignments` to prevent this firing on the empty state
  const showNoResults = !isLoading && !hasError && hasAssignments && !hasFilteredAssignments;
  const showAssignmentsGrid = !isLoading && !hasError && hasFilteredAssignments;
  const showFooterAction = hasAssignments;

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : "-");

  const openFilters = () => {
    setDraftClass(selectedClass);
    setDraftSubject(selectedSubject);
    setDraftCreator(selectedCreator);
    setIsFiltersOpen(true);
  };

  const resetDraftFilters = () => {
    setDraftClass("all");
    setDraftSubject("all");
    setDraftCreator("all");
  };

  const applyDraftFilters = () => {
    setSelectedClass(draftClass);
    setSelectedSubject(draftSubject);
    setSelectedCreator(draftCreator);
    setIsFiltersOpen(false);
  };

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) {
      setRealtimeStatus("disconnected");
      return;
    }

    setRealtimeStatus(socket.connected ? "connected" : "connecting");

    const onAssignmentCreated = (payload: unknown) => {
      const parsed = assignmentCreatedRealtimeEventSchema.safeParse(payload);
      if (parsed.success) onRealtimeCreated(parsed.data.assignment);
    };

    const onAssignmentDeleted = (payload: unknown) => {
      const parsed = assignmentDeletedRealtimeEventSchema.safeParse(payload);
      if (parsed.success) onRealtimeDeleted(parsed.data.assignmentId);
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
  }, [setRealtimeStatus, onRealtimeCreated, onRealtimeDeleted]);

  return (
    <section
      className="flex min-h-screen flex-col"
      onClick={() => setOpenMenuAssignmentId(null)}
    >
      <div className="mx-auto flex w-full max-w-384 flex-1 flex-col gap-3 rounded-xl">
        <PageHeader
          title="Assignments"
          subtitle="Manage and create assignments for your classes."
          showRealtime
          realtimeStatus={realtimeStatus}
          showHeader={showHeader}
        />

        {isLoading ? <p className="text-sm text-gray-500">Loading assignments...</p> : null}
        {!isLoading && hasError ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        {showToolbar ? (
          <div className="flex h-16 w-full items-center justify-between gap-4 rounded-2xl bg-white px-4 text-sm font-bold text-disabled">
            <button
              type="button"
              onClick={openFilters}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-muted/20"
            >
              <Image src="/icons/Filter.svg" alt="" aria-hidden="true" width={16} height={16} />
              <span className="md:hidden">Filter</span>
              <span className="hidden md:inline">Filter By</span>
              {activeFiltersCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-white">
                  {activeFiltersCount}
                </span>
              ) : null}
            </button>

            <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-border bg-background p-3 text-disabled">
              <Image src="/icons/Search.svg" alt="" aria-hidden="true" width={16} height={16} />
              <input
                id="assignment-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search Name"
                className="w-full bg-transparent outline-none placeholder:text-disabled md:hidden"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search Assignments"
                className="hidden w-full bg-transparent outline-none placeholder:text-disabled md:block"
              />
            </div>
          </div>
        ) : null}

        {showFiltersModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Set filters and apply them to the assignments list.
                  </p>
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
                  <label
                    htmlFor="assignment-class-filter"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Class
                  </label>
                  <select
                    id="assignment-class-filter"
                    value={draftClass}
                    onChange={(e) => setDraftClass(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-400"
                  >
                    <option value="all">All classes</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="assignment-subject-filter"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Subject
                  </label>
                  <select
                    id="assignment-subject-filter"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-400"
                  >
                    <option value="all">All subjects</option>
                    {subjectOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="assignment-creator-filter"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Creator
                  </label>
                  <select
                    id="assignment-creator-filter"
                    value={draftCreator}
                    onChange={(e) => setDraftCreator(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-400"
                  >
                    <option value="all">All creators</option>
                    {creatorOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={resetDraftFilters}
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
                    onClick={applyDraftFilters}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center gap-8 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/no-assignments.png"
                alt="No assignments yet"
                width={260}
                height={260}
                className="mx-auto"
                priority
              />
              <div className="mx-auto flex max-w-xl flex-col gap-2 px-4">
                <h1 className="text-xl font-bold text-primary">No assignments yet</h1>
                <p className="text-lg font-normal text-secondary">
                  Create your first assignment to start collecting and grading student submissions.
                  You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>
              </div>
            </div>
            <Link
              href="/create-assignment"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-6 py-3 text-white"
            >
              <Image src="/icons/Plus.svg" alt="" aria-hidden="true" width={16} height={16} className="mr-2" />
              <span>Create New First Assignment</span>
            </Link>
          </div>
        ) : null}

        {showNoResults ? (
          <p className="text-sm text-gray-500">
            No assignments match the current search and filters.
          </p>
        ) : null}

        {showAssignmentsGrid ? (
          // FIX: wrap all cards in a single ref'd div for the click-outside handler
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-3xl border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm"
              >
                {/* FIX: min-h-23 is non-standard — replaced with min-h-[5.75rem] */}
                <div className="flex min-h-[5.75rem] flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/assignments/${assignment.id}`} className="flex-1 text-left">
                      <h2 className="text-base font-semibold text-gray-900">
                        {assignment.chapterName}
                      </h2>
                    </Link>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuAssignmentId((current) =>
                            current === assignment.id ? null : assignment.id,
                          );
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
                        aria-label="More options"
                      >
                        <Image src="/icons/MoreVertical.svg" alt="" aria-hidden="true" width={16} height={16} />
                      </button>

                      {openMenuAssignmentId === assignment.id ? (
                        <div
                          className="absolute right-6 top-4 z-20 flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-2 text-primary shadow-lg"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Link
                            href={`/assignments/${assignment.id}`}
                            onClick={() => setOpenMenuAssignmentId(null)}
                            className="whitespace-nowrap rounded-md px-2 py-1 text-left text-sm hover:bg-off-white-primary"
                          >
                            View Assignment
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              void deleteAssignment(assignment.id);
                              setOpenMenuAssignmentId(null);
                            }}
                            disabled={deletingIds.has(assignment.id)}
                            className="whitespace-nowrap rounded-md px-2 py-1 text-left text-sm text-error hover:bg-off-white-primary disabled:opacity-50"
                          >
                            {deletingIds.has(assignment.id) ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-muted">
                      <span className="font-bold text-primary">Assigned on:</span>{" "}
                      {formatDate(assignment.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-primary">Due:</span> {assignment.dueDate}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {showFooterAction ? (
        // FIX: h-18 is non-standard → h-20; bg-linear-to-b → bg-gradient-to-b
        <div className="sticky bottom-0 hidden h-20 w-full items-center justify-center sm:flex">
          <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white" />
          {/* FIX: was a plain <button>, should be a <Link> since it navigates */}
          <Link
            href="/create-assignment"
            className="relative inline-flex items-center gap-1 rounded-full bg-primary px-6 py-3 text-white"
          >
            <Image src="/icons/Plus.svg" alt="" aria-hidden="true" width={16} height={16} className="mr-2" />
            <span>Create Assignment</span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
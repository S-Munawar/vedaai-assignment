"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  schoolBoardOptions,
  schoolMediumOptions,
  type School,
} from "@repo/shared/schools";
import { useSchools } from "@/hooks/useSchools";
import { PageHeader } from "@/components/PageHeader";

const DEMO_ADMIN_API_KEY = "c90dddb6-9c9f-43c3-815c-8a3e146b5381";

function schoolSearchText(school: School) {
  return [
    school.name,
    school.board,
    school.medium,
    school.schoolType,
    school.location.addressLine,
    school.location.city,
    school.location.state,
    school.location.country,
    school.principalName,
    school.contactEmail,
    school.contactPhone,
    school.website,
    school.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function AdminSchoolSearchPage() {
  const { schools, isLoadingSchools, schoolError, loadSchools: loadSchoolsAction } = useSchools();
  const [adminKey, setAdminKey] = useState("");
  const [query, setQuery] = useState("");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [mediumFilter, setMediumFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return schools.filter((school) => {
      if (boardFilter !== "all" && school.board !== boardFilter) {
        return false;
      }

      if (mediumFilter !== "all" && school.medium !== mediumFilter) {
        return false;
      }

      if (activeFilter === "active" && !school.isActive) {
        return false;
      }

      if (activeFilter === "inactive" && school.isActive) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return schoolSearchText(school).includes(normalizedQuery);
    });
  }, [schools, query, boardFilter, mediumFilter, activeFilter]);

  async function handleLoadSchools() {
    await loadSchoolsAction({ adminKey });
  }

  return (
    <section className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-384 flex-1 flex-col gap-3 rounded-xl">
        <PageHeader
          title="School Search"
          subtitle="Search registered schools by name, location, board, medium, and status."
          showHeader
        />

        <div className="rounded-2xl bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">Admin Filters</p>
              <p className="text-xs text-secondary">
                Demo API key: <span className="font-semibold text-primary">{DEMO_ADMIN_API_KEY}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminKey(DEMO_ADMIN_API_KEY)}
                className="rounded-full border border-border bg-off-white-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-white"
              >
                Use Demo Key
              </button>
              <Link
                href="/admin/schools"
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1.5fr_auto]">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Admin Key (optional)</label>
              <input
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="Provide admin key to include inactive schools"
                type="password"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleLoadSchools()}
              disabled={isLoadingSchools}
              className="mt-6 h-10 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingSchools ? "Loading..." : "Load Schools"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search schools, city, principal..."
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
            />

            <select
              value={boardFilter}
              onChange={(event) => setBoardFilter(event.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Boards</option>
              {schoolBoardOptions.map((board) => (
                <option key={board} value={board}>
                  {board}
                </option>
              ))}
            </select>

            <select
              value={mediumFilter}
              onChange={(event) => setMediumFilter(event.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Mediums</option>
              {schoolMediumOptions.map((medium) => (
                <option key={medium} value={medium}>
                  {medium}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {schoolError ? <p className="mt-3 text-sm text-red-600">❌ {schoolError}</p> : null}
        </div>

        <div className="space-y-3">
          {filteredSchools.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-sm text-secondary">No schools found for current search.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredSchools.map((school) => (
                <Link
                  key={school.id}
                  href={`/admin/schools/search/${school.id}`}
                  className="rounded-3xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-900">{school.name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        school.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {school.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    {school.board} • {school.medium} • {school.schoolType}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {[school.location.addressLine, school.location.city, school.location.state, school.location.country]
                      .filter(Boolean)
                      .join(", ") || "Location not provided"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Principal: {school.principalName || "-"} | Contact: {school.contactEmail || school.contactPhone || "-"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">Website: {school.website || "-"}</p>
                  <p className="mt-1 text-xs text-gray-600">Established: {school.establishedYear ?? "-"}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                    Description: {school.description || "No description provided."}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary">Open full details →</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

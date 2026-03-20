"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  listSchoolsResponseSchema,
  schoolsErrorResponseSchema,
  schoolBoardOptions,
  schoolMediumOptions,
  type School,
} from "@repo/shared/schools";
import { getApiUrl } from "@/lib/api-base";

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
  const [adminKey, setAdminKey] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [query, setQuery] = useState("");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [mediumFilter, setMediumFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  async function loadSchools() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(getApiUrl("/schools"), {
        method: "GET",
        headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const parsedError = schoolsErrorResponseSchema.safeParse(rawError);
        setMessage(parsedError.success ? `❌ ${parsedError.data.error}` : "❌ Failed to load schools");
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = listSchoolsResponseSchema.safeParse(raw);

      if (!parsed.success) {
        setMessage("❌ Unexpected schools response");
        return;
      }

      setSchools(parsed.data.schools);
      setMessage(`✅ Loaded ${parsed.data.schools.length} schools`);
    } catch {
      setMessage("❌ Could not reach backend endpoint.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">School Search</h1>
            <p className="mt-1 text-sm text-gray-500">
              Search registered schools by name, location, board, medium, and status.
            </p>
          </div>
          <Link href="/admin/schools" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Back to School Admin
          </Link>
        </header>

        <div className="rounded-lg border border-gray-200 p-4">
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
              onClick={() => void loadSchools()}
              disabled={isLoading}
              className="mt-6 h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {isLoading ? "Loading..." : "Load Schools"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search schools, city, principal..."
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={boardFilter}
              onChange={(event) => setBoardFilter(event.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {message ? (
            <p className={`mt-3 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{message}</p>
          ) : null}
        </div>

        <div className="mt-5 space-y-2">
          {filteredSchools.length === 0 ? (
            <p className="text-sm text-gray-500">No schools found for current search.</p>
          ) : (
            filteredSchools.map((school) => (
              <Link
                key={school.id}
                href={`/admin/schools/search/${school.id}`}
                className="block rounded-lg border border-gray-200 p-4 transition hover:border-gray-300 hover:shadow-sm"
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
                <p className="mt-1 text-xs text-gray-600">
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
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  Description: {school.description || "No description provided."}
                </p>
                <p className="mt-2 text-xs font-semibold text-blue-700">Open full details →</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

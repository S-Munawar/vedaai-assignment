"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { schoolDetailsResponseSchema, schoolsErrorResponseSchema, type School } from "@repo/shared/schools";
import { getApiUrl } from "@/lib/api-base";

export default function AdminSchoolDetailsPage() {
  const params = useParams<{ schoolId: string }>();
  const schoolId = params.schoolId;

  const [school, setSchool] = useState<School | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSchool() {
    if (!schoolId) {
      setMessage("❌ Missing school id");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(getApiUrl(`/schools/${schoolId}`), {
        method: "GET",
        headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const parsedError = schoolsErrorResponseSchema.safeParse(rawError);
        setMessage(parsedError.success ? `❌ ${parsedError.data.error}` : "❌ Failed to load school details");
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = schoolDetailsResponseSchema.safeParse(raw);

      if (!parsed.success) {
        setMessage("❌ Unexpected school details response");
        return;
      }

      setSchool(parsed.data.school);
      setMessage("✅ School details loaded");
    } catch {
      setMessage("❌ Could not reach backend endpoint.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSchool();
  }, [schoolId]);

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">School Details</h1>
            <p className="mt-1 text-sm text-gray-500">View complete profile of the selected school.</p>
          </div>
          <Link href="/admin/schools/search" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Back to Search
          </Link>
        </header>

        <div className="mb-4 rounded-lg border border-gray-200 p-4">
          <div className="grid gap-3 sm:grid-cols-[1.5fr_auto]">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Admin Key (optional)</label>
              <input
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="Provide admin key to access inactive schools"
                type="password"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadSchool()}
              disabled={isLoading}
              className="mt-6 h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {isLoading ? "Loading..." : "Reload"}
            </button>
          </div>

          {message ? (
            <p className={`mt-3 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{message}</p>
          ) : null}
        </div>

        {school ? (
          <article className="rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900">{school.name}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  school.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                }`}
              >
                {school.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-gray-700"><span className="font-semibold">Board:</span> {school.board}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Medium:</span> {school.medium}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Type:</span> {school.schoolType}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Established:</span> {school.establishedYear ?? "-"}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Principal:</span> {school.principalName || "-"}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Contact Email:</span> {school.contactEmail || "-"}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Contact Phone:</span> {school.contactPhone || "-"}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Website:</span> {school.website || "-"}</p>
            </div>

            <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Location</p>
              <p className="mt-1">{school.location.addressLine || "-"}</p>
              <p>{[school.location.city, school.location.state, school.location.country].filter(Boolean).join(", ") || "-"}</p>
              <p>Postal Code: {school.location.postalCode || "-"}</p>
            </div>

            <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Description</p>
              <p className="mt-1 whitespace-pre-wrap">{school.description || "No description provided."}</p>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

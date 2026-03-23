"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSchools } from "@/hooks/useSchools";
import { useToast } from "@/components/ToastProvider";

export default function AdminSchoolDetailsPage() {
  const params = useParams<{ schoolId: string }>();
  const schoolId = params.schoolId;
  const { selectedSchool: school, isLoadingSchoolDetails, schoolDetailsError, loadSchoolDetails } = useSchools();
  const [adminKey, setAdminKey] = useState("");
  const toast = useToast();

  const loadSchool = useCallback(async (showSuccessToast = false) => {
    if (!schoolId) {
      toast.error("Missing school id.");
      return;
    }

    const loadedSchool = await loadSchoolDetails(schoolId, { adminKey });

    if (loadedSchool) {
      if (showSuccessToast) {
        toast.success("School details loaded.");
      }
      return;
    }

    if (schoolDetailsError) {
      toast.error(schoolDetailsError);
      return;
    }

    toast.error("Failed to load school details.");
  }, [adminKey, loadSchoolDetails, schoolDetailsError, schoolId, toast]);

  useEffect(() => {
    void loadSchool();
  }, [loadSchool]);

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
              onClick={() => void loadSchool(true)}
              disabled={isLoadingSchoolDetails}
              className="mt-6 h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {isLoadingSchoolDetails ? "Loading..." : "Reload"}
            </button>
          </div>
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

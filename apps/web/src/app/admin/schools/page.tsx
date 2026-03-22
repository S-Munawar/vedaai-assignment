"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  createSchoolRequestSchema,
  createSchoolResponseSchema,
  schoolBoardOptions,
  schoolMediumOptions,
  schoolTypeOptions,
  schoolsErrorResponseSchema,
} from "@repo/shared/schools";
import { getApiUrl } from "@/lib/api-base";
import { useSchools } from "@/hooks/useSchools";
import type { AdminSchoolForm } from "@/types/admin-school.types";
import { PageHeader } from "@/components/PageHeader";

const INITIAL_FORM: AdminSchoolForm = {
  name: "",
  board: "CBSE",
  medium: "English",
  schoolType: "Private",
  location: {
    addressLine: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  },
  contactEmail: "",
  contactPhone: "",
  website: "",
  principalName: "",
  establishedYear: "",
  description: "",
  isActive: true,
};

const DEMO_ADMIN_API_KEY = "c90dddb6-9c9f-43c3-815c-8a3e146b5381";

export default function AdminSchoolsPage() {
  const { loadSchools, schoolError } = useSchools();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [adminKey, setAdminKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function updateField<K extends keyof AdminSchoolForm>(key: K, value: AdminSchoolForm[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function updateLocationField<K extends keyof AdminSchoolForm["location"]>(
    key: K,
    value: AdminSchoolForm["location"][K],
  ) {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [key]: value,
      },
    }));
  }

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const payloadCandidate = {
        ...formData,
        establishedYear: formData.establishedYear
          ? Number(formData.establishedYear)
          : null,
      };

      const parsedPayload = createSchoolRequestSchema.safeParse(payloadCandidate);

      if (!parsedPayload.success) {
        setMessage(`❌ ${parsedPayload.error.issues[0]?.message || "Invalid school details"}`);
        return;
      }

      const response = await fetch(getApiUrl("/schools"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(parsedPayload.data),
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const parsedError = schoolsErrorResponseSchema.safeParse(rawError);
        setMessage(parsedError.success ? `❌ ${parsedError.data.error}` : "❌ Failed to create school");
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = createSchoolResponseSchema.safeParse(raw);

      if (!parsed.success) {
        setMessage("❌ Unexpected response while creating school.");
        return;
      }

      setMessage(`✅ School created: ${parsed.data.school.name}`);
      setFormData(INITIAL_FORM);
      await loadSchools({ adminKey });
    } catch {
      setMessage("❌ Could not reach backend endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-384 flex-1 flex-col gap-3 rounded-xl">
        <PageHeader
          title="School Admin"
          subtitle="Add and manage school profiles used across registration and assignments."
          showHeader
        />

        <div className="rounded-2xl bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-primary">Create School Profile</h2>
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
                href="/admin/schools/search"
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Search Schools
              </Link>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">School Name</label>
            <input
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Enter school name"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Board</label>
              <select
                value={formData.board}
                onChange={(event) => updateField("board", event.target.value as AdminSchoolForm["board"])}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {schoolBoardOptions.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Medium</label>
              <select
                value={formData.medium}
                onChange={(event) => updateField("medium", event.target.value as AdminSchoolForm["medium"])}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {schoolMediumOptions.map((medium) => (
                  <option key={medium} value={medium}>
                    {medium}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">School Type</label>
              <select
                value={formData.schoolType}
                onChange={(event) =>
                  updateField("schoolType", event.target.value as AdminSchoolForm["schoolType"])
                }
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {schoolTypeOptions.map((schoolType) => (
                  <option key={schoolType} value={schoolType}>
                    {schoolType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Established Year</label>
              <input
                value={formData.establishedYear}
                onChange={(event) => updateField("establishedYear", event.target.value)}
                placeholder="e.g. 1998"
                inputMode="numeric"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
              <input
                value={formData.location.addressLine}
                onChange={(event) => updateLocationField("addressLine", event.target.value)}
                placeholder="Street / Area"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input
                value={formData.location.city}
                onChange={(event) => updateLocationField("city", event.target.value)}
                placeholder="City"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <input
                value={formData.location.state}
                onChange={(event) => updateLocationField("state", event.target.value)}
                placeholder="State"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
              <input
                value={formData.location.country}
                onChange={(event) => updateLocationField("country", event.target.value)}
                placeholder="Country"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                value={formData.location.postalCode}
                onChange={(event) => updateLocationField("postalCode", event.target.value)}
                placeholder="Postal code"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact Email</label>
              <input
                value={formData.contactEmail}
                onChange={(event) => updateField("contactEmail", event.target.value)}
                placeholder="school@example.com"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact Phone</label>
              <input
                value={formData.contactPhone}
                onChange={(event) => updateField("contactPhone", event.target.value)}
                placeholder="+91..."
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Website</label>
              <input
                value={formData.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://..."
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Principal Name</label>
              <input
                value={formData.principalName}
                onChange={(event) => updateField("principalName", event.target.value)}
                placeholder="Principal"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Any additional details about the school"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(event) => updateField("isActive", event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                School is active
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Admin Key</label>
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Enter admin key"
              type="password"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {message ? (
            <p className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{message}</p>
          ) : null}
          {schoolError && !message ? <p className="text-sm text-red-600">❌ {schoolError}</p> : null}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Add School"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

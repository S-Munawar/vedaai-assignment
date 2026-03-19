"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createSchoolResponseSchema,
  listSchoolsResponseSchema,
  schoolsErrorResponseSchema,
  type School,
} from "@repo/shared/schools";
import { getApiUrl } from "@/lib/api-base";

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);

  async function loadSchools() {
    setIsLoadingSchools(true);

    try {
      const response = await fetch(getApiUrl("/schools"), { method: "GET" });

      if (!response.ok) {
        setMessage("❌ Could not load schools.");
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = listSchoolsResponseSchema.safeParse(raw);

      if (!parsed.success) {
        setMessage("❌ Unexpected schools response.");
        return;
      }

      setSchools(parsed.data.schools);
    } catch {
      setMessage("❌ Could not reach backend endpoint.");
    } finally {
      setIsLoadingSchools(false);
    }
  }

  useEffect(() => {
    void loadSchools();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(getApiUrl("/schools"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ name: schoolName }),
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
      setSchoolName("");
      await loadSchools();
    } catch {
      setMessage("❌ Could not reach backend endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Admin: School Management</h1>
          <p className="mt-1 text-sm text-gray-500">Add schools that users can select during registration.</p>
        </header>

        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">School Name</label>
            <input
              value={schoolName}
              onChange={(event) => setSchoolName(event.target.value)}
              placeholder="Enter school name"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center rounded-full bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {isSubmitting ? "Saving..." : "Add School"}
          </button>
        </form>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">Registered Schools</h2>
          {isLoadingSchools ? <p className="mt-2 text-sm text-gray-500">Loading schools...</p> : null}
          {!isLoadingSchools && schools.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No schools added yet.</p>
          ) : null}
          {!isLoadingSchools && schools.length > 0 ? (
            <div className="mt-2 space-y-2">
              {schools.map((school) => (
                <div key={school.id} className="rounded-lg border border-gray-200 p-3 text-sm text-gray-800">
                  {school.name}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

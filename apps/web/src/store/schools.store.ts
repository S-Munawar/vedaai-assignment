"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  listSchoolsResponseSchema,
  schoolDetailsResponseSchema,
  schoolsErrorResponseSchema,
} from "@repo/shared/schools";
import { getApiUrl } from "@/lib/api-base";
import type { SchoolStore } from "@/types/schools-store.types";

export const useSchoolsStore = create<
  SchoolStore,
  [['zustand/devtools', never]]
>(
  devtools((set) => ({
  schools: [],
  selectedSchool: null,
  isLoadingSchools: false,
  isLoadingSchoolDetails: false,
  schoolError: "",
  schoolDetailsError: "",
  loadSchools: async (options) => {
    set({ isLoadingSchools: true, schoolError: "" });

    try {
      const response = await fetch(getApiUrl("/schools"), {
        method: "GET",
        headers: options?.adminKey ? { "x-admin-key": options.adminKey } : undefined,
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const parsedError = schoolsErrorResponseSchema.safeParse(rawError);
        set({
          schoolError: parsedError.success ? parsedError.data.error : "Failed to load schools",
          schools: [],
        });
        return [];
      }

      const raw = await response.json().catch(() => null);
      const parsed = listSchoolsResponseSchema.safeParse(raw);

      if (!parsed.success) {
        set({ schoolError: "Unexpected schools response", schools: [] });
        return [];
      }

      set({ schools: parsed.data.schools });
      return parsed.data.schools;
    } catch {
      set({ schoolError: "Could not reach backend endpoint.", schools: [] });
      return [];
    } finally {
      set({ isLoadingSchools: false });
    }
  },
  loadSchoolDetails: async (schoolId, options) => {
    set({ isLoadingSchoolDetails: true, schoolDetailsError: "" });

    try {
      const response = await fetch(getApiUrl(`/schools/${schoolId}`), {
        method: "GET",
        headers: options?.adminKey ? { "x-admin-key": options.adminKey } : undefined,
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const parsedError = schoolsErrorResponseSchema.safeParse(rawError);
        set({
          schoolDetailsError: parsedError.success
            ? parsedError.data.error
            : "Failed to load school details",
          selectedSchool: null,
        });
        return null;
      }

      const raw = await response.json().catch(() => null);
      const parsed = schoolDetailsResponseSchema.safeParse(raw);

      if (!parsed.success) {
        set({ schoolDetailsError: "Unexpected school details response", selectedSchool: null });
        return null;
      }

      set({ selectedSchool: parsed.data.school });
      return parsed.data.school;
    } catch {
      set({ schoolDetailsError: "Could not reach backend endpoint.", selectedSchool: null });
      return null;
    } finally {
      set({ isLoadingSchoolDetails: false });
    }
  },
  clearSchoolErrors: () => set({ schoolError: "", schoolDetailsError: "" }),
  }), { name: 'SchoolsStore' }),
);

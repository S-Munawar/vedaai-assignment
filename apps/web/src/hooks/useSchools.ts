"use client";

import { useSchoolsStore } from "@/store/schools.store";

export function useSchools() {
  const schools = useSchoolsStore((state) => state.schools);
  const selectedSchool = useSchoolsStore((state) => state.selectedSchool);
  const isLoadingSchools = useSchoolsStore((state) => state.isLoadingSchools);
  const isLoadingSchoolDetails = useSchoolsStore((state) => state.isLoadingSchoolDetails);
  const schoolError = useSchoolsStore((state) => state.schoolError);
  const schoolDetailsError = useSchoolsStore((state) => state.schoolDetailsError);

  const loadSchools = useSchoolsStore((state) => state.loadSchools);
  const loadSchoolDetails = useSchoolsStore((state) => state.loadSchoolDetails);
  const clearSchoolErrors = useSchoolsStore((state) => state.clearSchoolErrors);

  return {
    schools,
    selectedSchool,
    isLoadingSchools,
    isLoadingSchoolDetails,
    schoolError,
    schoolDetailsError,
    loadSchools,
    loadSchoolDetails,
    clearSchoolErrors,
  };
}

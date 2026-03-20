import type { School } from '@repo/shared/schools';

export type SchoolStore = {
  schools: School[];
  selectedSchool: School | null;
  isLoadingSchools: boolean;
  isLoadingSchoolDetails: boolean;
  schoolError: string;
  schoolDetailsError: string;
  loadSchools: (options?: { adminKey?: string }) => Promise<School[]>;
  loadSchoolDetails: (schoolId: string, options?: { adminKey?: string }) => Promise<School | null>;
  clearSchoolErrors: () => void;
};

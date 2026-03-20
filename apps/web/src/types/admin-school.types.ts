import { schoolBoardOptions, schoolMediumOptions, schoolTypeOptions } from '@repo/shared/schools';

export type AdminSchoolForm = {
  name: string;
  board: (typeof schoolBoardOptions)[number];
  medium: (typeof schoolMediumOptions)[number];
  schoolType: (typeof schoolTypeOptions)[number];
  location: {
    addressLine: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contactEmail: string;
  contactPhone: string;
  website: string;
  principalName: string;
  establishedYear: string;
  description: string;
  isActive: boolean;
};

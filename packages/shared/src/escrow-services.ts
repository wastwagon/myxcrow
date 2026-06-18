export const ESCROW_CATEGORY = {
  PHYSICAL_GOODS: 'PHYSICAL_GOODS',
  PROFESSIONAL_SERVICE: 'PROFESSIONAL_SERVICE',
} as const;

export type EscrowCategory = (typeof ESCROW_CATEGORY)[keyof typeof ESCROW_CATEGORY];

export const ESCROW_CATEGORY_LABELS: Record<EscrowCategory, string> = {
  PHYSICAL_GOODS: 'Physical goods (item to ship)',
  PROFESSIONAL_SERVICE: 'Professional service',
};

/** Popular professional services on MYXCROW */
export const PROFESSIONAL_SERVICE_TYPES = [
  'Web Development & Design',
  'Mobile App Development',
  'Graphic Design & Branding',
  'Photography & Videography',
  'Copywriting & Content Writing',
  'Digital Marketing & SEO',
  'Social Media Management',
  'Consulting & Business Advisory',
  'Legal & Compliance Services',
  'Accounting & Bookkeeping',
  'Virtual Assistant & Admin Support',
  'Translation & Interpretation',
  'Tutoring & Online Training',
  'Home Repair & Maintenance',
  'Event Planning & Coordination',
  'IT Support & Troubleshooting',
  'Other Professional Service',
] as const;

export type ProfessionalServiceType = (typeof PROFESSIONAL_SERVICE_TYPES)[number];

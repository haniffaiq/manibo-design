interface IconProps {
  className?: string;
}

export function IconDashboard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5C2 2.67 2.67 2 3.5 2h2.09a1 1 0 0 1 .97.76l.54 2.17a1 1 0 0 1-.49 1.1L5.2 6.85a8.26 8.26 0 0 0 3.95 3.95l.82-1.41a1 1 0 0 1 1.1-.49l2.17.54a1 1 0 0 1 .76.97v2.09c0 .83-.67 1.5-1.5 1.5A11.5 11.5 0 0 1 2 3.5Z" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M13.3 9.7a1.1 1.1 0 0 0 .22 1.21l.04.04a1.33 1.33 0 1 1-1.88 1.88l-.04-.04a1.1 1.1 0 0 0-1.21-.22 1.1 1.1 0 0 0-.67 1v.13a1.33 1.33 0 1 1-2.67 0v-.07a1.1 1.1 0 0 0-.72-1 1.1 1.1 0 0 0-1.21.22l-.04.04a1.33 1.33 0 1 1-1.88-1.88l.04-.04a1.1 1.1 0 0 0 .22-1.21 1.1 1.1 0 0 0-1-.67h-.13a1.33 1.33 0 1 1 0-2.67h.07a1.1 1.1 0 0 0 1-.72 1.1 1.1 0 0 0-.22-1.21l-.04-.04a1.33 1.33 0 1 1 1.88-1.88l.04.04a1.1 1.1 0 0 0 1.21.22h.05a1.1 1.1 0 0 0 .67-1v-.13a1.33 1.33 0 1 1 2.67 0v.07a1.1 1.1 0 0 0 .67 1 1.1 1.1 0 0 0 1.21-.22l.04-.04a1.33 1.33 0 1 1 1.88 1.88l-.04.04a1.1 1.1 0 0 0-.22 1.21v.05a1.1 1.1 0 0 0 1 .67h.13a1.33 1.33 0 0 1 0 2.67h-.07a1.1 1.1 0 0 0-1 .67Z" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="4.5" r="2.5" />
      <path d="M1 13.5c0-2.49 2.24-4.5 5-4.5s5 2.01 5 4.5" />
      <circle cx="12" cy="5" r="2" />
      <path d="M15 13.5c0-1.66-1.12-3.08-2.72-3.72" />
    </svg>
  );
}

export function IconBuilding({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <path d="M5.5 5.5h2M5.5 8h2M5.5 10.5h2M8.5 5.5h2M8.5 8h2" />
    </svg>
  );
}

export function IconMicrophone({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="1.5" width="6" height="8" rx="3" />
      <path d="M2.5 7.5a5.5 5.5 0 0 0 11 0M8 13v1.5M5.5 14.5h5" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5 2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4L8 1.5Z" />
    </svg>
  );
}

export function IconActivity({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 8h-3l-2 5-3-10-2 5h-3" />
    </svg>
  );
}

export function IconCode({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4 2 8l3 4M11 4l3 4-3 4M9.5 2.5 6.5 13.5" />
    </svg>
  );
}

export function IconPackage({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5 2.5 4.5v7L8 14.5l5.5-3v-7L8 1.5Z" />
      <path d="M2.5 4.5 8 7.5l5.5-3M8 7.5v7" />
    </svg>
  );
}

export function IconLayers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 2 5l6 3 6-3-6-3Z" />
      <path d="M2 8l6 3 6-3" />
      <path d="M2 11l6 3 6-3" />
    </svg>
  );
}

export function IconTruck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 2.5h9v8H1z" />
      <path d="M10 5.5h2.5l2 2.5v2.5h-4.5" />
      <circle cx="4" cy="11.5" r="1.5" />
      <circle cx="12" cy="11.5" r="1.5" />
    </svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M5 1.5v3M11 1.5v3M2 6h12" />
      <path d="M5.5 8.5h.01M8 8.5h.01M10.5 8.5h.01M5.5 11h.01M8 11h.01" />
    </svg>
  );
}

export function IconBookOpen({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 2.5h4.5a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H1.5ZM14.5 2.5H10a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5h5Z" />
    </svg>
  );
}

export function IconLogOut({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" />
    </svg>
  );
}

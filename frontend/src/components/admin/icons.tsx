import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "home"
  | "calendar"
  | "users"
  | "wallet"
  | "refund"
  | "sparkle"
  | "shield"
  | "settings"
  | "more"
  | "plus"
  | "search"
  | "close"
  | "chevronRight"
  | "chevronDown"
  | "upload"
  | "check"
  | "clock"
  | "phone"
  | "arrowUpRight"
  | "camera"
  | "trash"
  | "lock"
  | "bell"
  | "user"
  | "logout"
  | "chart"
  | "image"
  | "note"
  | "eye"
  | "eyeOff";

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="3.5" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10.5h17" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 20c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 6.3M17.4 15.2c1.9.6 3.2 2.3 3.6 4.8" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="3.5" />
      <path d="M3.5 10.5h17" />
      <circle cx="16.5" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  refund: (
    <>
      <path d="M4 9a8 8 0 1 1 1 8.5" />
      <path d="M4 4.5V9h4.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5 3.6-.5 5-1.9 5.5-5.5Z" />
      <path d="M17.5 14.5c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4-2.9 7.2-7 9-4.1-1.8-7-5-7-9V6l7-2.5Z" />
      <path d="m9.2 11.8 2 2 3.6-3.8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  upload: (
    <>
      <path d="M12 16V4.5M7.5 9 12 4.5 16.5 9" />
      <path d="M4.5 15v3A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  phone: (
    <path d="M6.5 3.8h3l1.3 3.6-2 1.4a11 11 0 0 0 5.4 5.4l1.4-2 3.6 1.3v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 6a2 2 0 0 1 2-2.2Z" />
  ),
  arrowUpRight: (
    <>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  camera: (
    <>
      <path d="M4.5 8.5h3l1.4-2h6.2l1.4 2h3v10h-15v-10Z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.8 13h9.4l.8-13" />
      <path d="M10.5 11v5M13.5 11v5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2.5h-15L6 16.5Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M5 20c.6-3.6 3.4-5.6 7-5.6s6.4 2 7 5.6" />
    </>
  ),
  logout: (
    <>
      <path d="M14 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
      <path d="M17 8.5 20.5 12 17 15.5M10 12h10" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-4M12.5 16V8M17 16v-6" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17 4.8-4.3 3.4 3 2.4-2.1 4.4 4.4" />
    </>
  ),
  note: (
    <>
      <path d="M6 3.5h8L20 9v11.5H6V3.5Z" />
      <path d="M13.5 3.7V9H19" />
      <path d="M9 13h6M9 16.5h4" />
    </>
  ),
  eye: (
    <>
      <path d="M3.5 12S6.8 6 12 6s8.5 6 8.5 6-3.3 6-8.5 6-8.5-6-8.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.6 6.4A9.7 9.7 0 0 1 12 6c5.2 0 8.5 6 8.5 6a15 15 0 0 1-3 3.6" />
      <path d="M6.4 8A15 15 0 0 0 3.5 12s3.3 6 8.5 6a9 9 0 0 0 3.5-.7" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

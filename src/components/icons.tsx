import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 22v-2a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" />
      <path d="M12 18V10" />
      <path d="M2 10l10-7 10 7" />
      <path d="M12 10a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0v-4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

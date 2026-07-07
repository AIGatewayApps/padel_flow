import type { SVGProps } from "react";

interface PadelFlowLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function PadelFlowLogo({ size = 28, ...props }: PadelFlowLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-label="PadelFlow logo"
      className="text-[var(--color-primary)]"
      {...props}
    >
      <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 14 Q14 8 20 14 Q14 20 8 14Z" fill="currentColor" opacity="0.9" />
      <circle cx="14" cy="14" r="2.5" fill="white" />
    </svg>
  );
}

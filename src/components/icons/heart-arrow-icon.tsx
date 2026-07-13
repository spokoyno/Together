type HeartArrowIconProps = React.SVGProps<SVGSVGElement> & {
  strokeWidth?: number;
};

/** Symmetric heart pierced by a cupid arrow — stroke style, matches Lucide nav icons. */
export function HeartArrowIcon({
  className,
  strokeWidth = 2,
  ...props
}: HeartArrowIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
      <path d="M3.5 17 20.5 6.5" />
      <path d="m20.5 6.5-2.2 1" />
      <path d="m20.5 6.5-1.2 2" />
      <path d="m3.5 17 1.6-1.4" />
      <path d="m3.5 17 1.8 1" />
    </svg>
  );
}

type HeartArrowIconProps = React.SVGProps<SVGSVGElement>;

/** Cute cupid-style heart pierced by an arrow. */
export function HeartArrowIcon({ className, ...props }: HeartArrowIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 20.5s-5.5-3.4-7.2-6.8C3.1 10.3 4.6 7 7.4 7c1.5 0 2.8.8 3.6 2  .8-1.2 2.1-2 3.6-2 2.8 0 4.3 3.3 2.6 6.7C17.5 17.1 12 20.5 12 20.5Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M3.5 12.5 20 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M17.5 6.5 20 8l-1.2 2.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M5.5 14.2 3.5 12.5l1.8-1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

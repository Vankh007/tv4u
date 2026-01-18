import { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export const HomeFilledIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="currentColor"
    {...props}
  >
    <path d="M261.56 101.28a8 8 0 0 0-11.06 0L66.4 277.15a8 8 0 0 0-2.47 5.79L63.9 448a32 32 0 0 0 32 32H192a16 16 0 0 0 16-16V328a8 8 0 0 1 8-8h80a8 8 0 0 1 8 8v136a16 16 0 0 0 16 16h96.06a32 32 0 0 0 32-32V282.94a8 8 0 0 0-2.47-5.79Z" />
    <path d="m490.91 244.15l-74.8-71.56V64a16 16 0 0 0-16-16h-48a16 16 0 0 0-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.14-22.14 8.63l-212.7 203.5c-6.22 6-7 15.87-1.34 22.37A16 16 0 0 0 43 267.56L250.5 69.28a8 8 0 0 1 11.06 0l207.52 198.28a16 16 0 0 0 22.59-.44c6.14-6.36 5.63-16.86-.76-22.97Z" />
  </svg>
);

export const ShortsIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 32 32"
    {...props}
  >
    <g fill="none">
      <path fill="currentColor" d="M2 9a1 1 0 0 1 1-1h.14a.86.86 0 0 1 .86.86a.86.86 0 0 0 .044.272l.85 2.552a1 1 0 0 1 0 .632l-.85 2.551A.86.86 0 0 0 4 15.14a.86.86 0 0 1-.86.86H3a1 1 0 0 1-1-1V9Zm27 5h-1l-1 4l1 4h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1ZM16.5 25L7 26v2a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-2l-9.5-1ZM18 10H6l1 4h15a4 4 0 0 0-4-4Z" />
      <path fill="currentColor" opacity="0.6" d="M4 9h1.5A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15H4V9Zm3 5h19v12H7V14Zm6.5 13a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1Z" />
      <path fill="currentColor" d="M19 27.5a.5.5 0 1 1-1 0a.5.5 0 0 1 1 0Z" />
      <path fill="currentColor" opacity="0.7" d="M26 14h2v8h-2v-8ZM9 16a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1v2a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-7Z" />
      <path fill="currentColor" d="M11 18a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-3Z" />
    </g>
  </svg>
);

export const AnimeIcon = ({ size = 24, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 256 256"
    fill="currentColor"
    {...props}
  >
    <path d="M204 88a12 12 0 1 1-12-12a12 12 0 0 1 12 12m-12 68a12 12 0 1 0 12 12a12 12 0 0 0-12-12m-96-52a16 16 0 1 0 16 16a16 16 0 0 0-16-16m136-48v144a16 16 0 0 1-16 16H40a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16h176a16 16 0 0 1 16 16m-64 64h48V56h-48Zm-32.25 46a39.76 39.76 0 0 0-17.19-23.34a32 32 0 1 0-45.12 0A39.84 39.84 0 0 0 56.25 166a8 8 0 0 0 15.5 4c2.64-10.25 13.06-18 24.25-18s21.62 7.73 24.25 18a8 8 0 1 0 15.5-4M216 200v-64h-48v64z" />
  </svg>
);

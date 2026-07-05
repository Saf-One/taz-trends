import type { SortDir } from "./useSortable";

export function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir;
}) {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="currentColor"
        className={active && dir === "asc" ? "text-wine" : "text-ink/20"}
      >
        <path d="M5 0l5 6H0z" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="currentColor"
        className={active && dir === "desc" ? "text-wine" : "text-ink/20"}
      >
        <path d="M5 6L0 0h10z" />
      </svg>
    </span>
  );
}

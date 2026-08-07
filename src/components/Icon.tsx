import { FALLBACK_ICON, type IconName } from "../icons/names";

const FILES = import.meta.glob("../icons/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const REGISTRY: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, source]) => [
    path.split("/").pop()!.replace(/\.svg$/, ""),
    source,
  ])
);

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export function Icon({ name, size = 20, className = "", style, label }: Props) {
  const source = REGISTRY[name] ?? REGISTRY[FALLBACK_ICON];
  return (
    <span
      className={`icon ${className}`}
      style={{ width: size, height: size, ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}

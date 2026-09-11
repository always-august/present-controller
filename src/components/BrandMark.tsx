export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className={`font-semibold tracking-tight ${size === "lg" ? "text-6xl" : "text-sm"}`}>마부</span>
  );
}

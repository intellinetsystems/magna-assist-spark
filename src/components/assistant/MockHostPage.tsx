import hostBg from "@/assets/mahindra-host-bg.jpg";

export function MockHostPage() {
  return (
    <div
      className="absolute inset-0 bg-[var(--surface-1)] overflow-hidden bg-no-repeat bg-top"
      style={{
        backgroundImage: `url(${hostBg})`,
        backgroundSize: "100% auto",
      }}
      aria-hidden
    />
  );
}

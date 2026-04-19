interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  background?: "white" | "surface" | "surface-alt" | "primary" | "dark";
  style?: React.CSSProperties;
}

export default function SectionWrapper({
  children,
  id,
  className = "",
  background = "white",
  style,
}: SectionWrapperProps) {
  const bgClasses = {
    white: "bg-white",
    surface: "bg-surface",
    "surface-alt": "bg-surface-alt",
    primary: "bg-primary text-white",
    dark: "bg-gray-900 text-white",
  };

  return (
    <section id={id} className={`py-16 md:py-24 ${bgClasses[background]} ${className}`} style={style}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

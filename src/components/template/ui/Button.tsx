import { getButtonClass } from "@/lib/theme";
import type { BrandingConfig } from "@/lib/types";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  buttonStyle?: BrandingConfig["buttonStyle"];
  className?: string;
}

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  buttonStyle = "rounded",
  className = "",
}: ButtonProps) {
  const radius = getButtonClass(buttonStyle);

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-light shadow-sm hover:shadow-md",
    secondary:
      "bg-secondary text-white hover:bg-secondary-light shadow-sm hover:shadow-md",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-white",
  };

  const cls = `inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-200 ${radius} ${variants[variant]} ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children}
      </button>
    );
  }

  return (
    <a href={href ?? "#"} className={cls}>
      {children}
    </a>
  );
}

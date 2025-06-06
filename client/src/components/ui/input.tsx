import React from "react";
import "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={className}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

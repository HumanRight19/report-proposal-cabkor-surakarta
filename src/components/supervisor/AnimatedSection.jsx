import { useEffect, useState } from "react";

export default function AnimatedSection({ children, animationKey, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);

    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [animationKey]);

  return (
    <div
      className={`
        transition-all duration-300 ease-out
        motion-reduce:transition-none
        ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

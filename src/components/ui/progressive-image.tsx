"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ProgressiveImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "alt"
> & {
  alt: string;
  wrapperClassName?: string;
  skeletonClassName?: string;
};

export function ProgressiveImage({
  wrapperClassName,
  skeletonClassName,
  className,
  onLoad,
  loading = "lazy",
  decoding = "async",
  ...props
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {!loaded && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 animate-pulse bg-slate-200/70",
            skeletonClassName
          )}
        />
      )}
      <img
        {...props}
        loading={loading}
        decoding={decoding}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
    </div>
  );
}

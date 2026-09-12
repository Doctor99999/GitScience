"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`sci-skeleton ${className ?? "h-4 w-full"}`}
      role="status"
      aria-label="Loading"
    />
  );
}

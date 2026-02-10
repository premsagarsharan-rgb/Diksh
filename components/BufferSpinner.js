"use client";

export default function BufferSpinner({ size = 18, className = "" }) {
  return (
    <img
      src="/buffer.svg"
      alt=""
      style={{ width: size, height: size }}
      className={`inline-block animate-spin ${className}`}
    />
  );
}

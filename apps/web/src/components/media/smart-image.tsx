"use client";

import Image from "next/image";
import { CldImage } from "next-cloudinary";

type SmartImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  quality?: number;
};

export function SmartImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  className,
  priority,
  quality,
}: SmartImageProps) {
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        className={className}
        priority={priority}
        quality={quality}
      />
    );
  }

  return (
    <CldImage
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}

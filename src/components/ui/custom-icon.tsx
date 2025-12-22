
'use client';

import { cn } from "@/lib/utils"

export const CustomIcon = ({ src, className }: { src: string, className?: string }) => (
    <div
      className={cn("w-full h-full", className)}
      style={{
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
);

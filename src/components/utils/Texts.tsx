import { cn } from '@/services/utils';

export function Title({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLHeadingElement>) {
  return (
    <h1 className={cn('scroll-m-20 text-6xl font-black uppercase', className)} {...props}>
      {children}
    </h1>
  );
}

export function H1({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLHeadingElement>) {
  return (
    <h1 className={cn('scroll-m-20 text-4xl font-bold tracking-tight', className)} {...props}>
      {children}
    </h1>
  );
}

export function H2({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLHeadingElement>) {
  return (
    <h2 className={cn('scroll-m-20 text-3xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h2>
  );
}

export function H3({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLHeadingElement>) {
  return (
    <h3 className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function H4({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLHeadingElement>) {
  return (
    <h4 className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h4>
  );
}

export function P24({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-[18px] md:text-[24px] font-mono font-normal leading-0', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function P18({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-[15px] md:text-[18px] font-mono font-normal leading-0', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function P16({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[16px] font-mono font-normal leading-0', className)} {...props}>
      {children}
    </p>
  );
}

export function P14({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[14px] font-mono font-normal leading-0', className)} {...props}>
      {children}
    </p>
  );
}

export function P12({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[12px] font-mono font-normal leading-0', className)} {...props}>
      {children}
    </p>
  );
}

export function P10({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[10px] font-mono font-normal leading-0', className)} {...props}>
      {children}
    </p>
  );
}

export function Link({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLAnchorElement>) {
  return (
    <a
      className={cn('flex items-center gap-1 group cursor-pointer w-fit leading-0', className)}
      {...props}
    >
      {children}
    </a>
  );
}

import { cn } from '@/services/utils';

export function Grid1({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('grid grid-cols-1 gap-y-5 md:gap-5 w-full', className)} {...props}>
      {children}
    </div>
  );
}

export function Grid2({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={cn('grid md:grid-cols-2 grid-cols-1 gap-y-5 md:gap-5 w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Grid3({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={cn('grid md:grid-cols-3 grid-cols-1 gap-y-5 md:gap-5 w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Col1({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('col-span-1', className)} {...props}>
      {children}
    </div>
  );
}

export function Col2({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('col-span-2', className)} {...props}>
      {children}
    </div>
  );
}

export function Col3({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('col-span-3', className)} {...props}>
      {children}
    </div>
  );
}

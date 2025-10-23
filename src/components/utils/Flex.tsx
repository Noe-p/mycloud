import { cn } from '@/services/utils';

export function Col({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {children}
    </div>
  );
}

export function Row({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-row', className)} {...props}>
      {children}
    </div>
  );
}

export function ColCenter({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col items-center w-full', className)} {...props}>
      {children}
    </div>
  );
}

export function RowCenter({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-row items-center', className)} {...props}>
      {children}
    </div>
  );
}

export function RowBetween({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-row justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function RowAround({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-row justify-around', className)} {...props}>
      {children}
    </div>
  );
}

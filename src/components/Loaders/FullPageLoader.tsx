import { cn } from '@/services/utils';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  className?: string;
}

export function FullPageLoader(props: LoaderProps): React.JSX.Element {
  const { className } = props;

  return (
    <div className={cn('flex justify-center items-center min-h-screen w-full', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
    </div>
  );
}

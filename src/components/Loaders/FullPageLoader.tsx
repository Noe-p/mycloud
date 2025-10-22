import { Layout } from 'lucide-react';
import { PageLoader } from './PageLoader';

interface LoaderProps {
  className?: string;
}

export function FullPageLoader(props: LoaderProps): React.JSX.Element {
  const { className } = props;

  return (
    <Layout className={`justify-center items-center ${className}`}>
      <PageLoader className='h-full' />
    </Layout>
  );
}

import { HomePage } from '@/components/pages/HomePage';
import { getMessages, locales } from '@/i18n/config';
import { defaultMetadata } from '@/services/metadata';
import { PageBaseProps } from '@/types/next';
import { Metadata } from 'next';

export async function generateMetadata(
  props: PageBaseProps
): Promise<Metadata> {
  const params = await props.params;
  const messages = await getMessages(params.locale);

  if (!messages?.metas) {
    console.error(`Messages not found for locale: ${params.locale}`);
    return defaultMetadata;
  }

  const t = messages.metas;

  return {
    ...defaultMetadata,
    title: t.home.title,
    description: t.home.description,
    keywords: t.home.keywords,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: t.home.title,
      description: t.home.description,
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function Page(): React.JSX.Element {
  return <HomePage />;
}

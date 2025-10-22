/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable indent */
import { ProjectsPage } from '@/components/pages/ProjectsPage';
import { getMessages, locales } from '@/i18n/config';
import { defaultMetadata } from '@/services/metadata';
import { PageBaseProps } from '@/types/next';
import { Metadata } from 'next';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageBaseProps
): Promise<Metadata> {
  const params = await props.params;
  const messages = await getMessages(params.locale);

  if (!messages?.metas) {
    console.error(`Messages not found for locale: ${params.locale}`);
    return defaultMetadata;
  }

  const t = messages.metas as any;

  return {
    ...defaultMetadata,
    title: t.projects.title,
    description: t.projects.description,
    keywords: t.projects.keywords,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: t.projects.title,
      description: t.projects.description,
    },
  };
}

export default function Page(): React.JSX.Element {
  return <ProjectsPage />;
}

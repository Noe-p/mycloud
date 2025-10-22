/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectDetail } from '@/components/pages/ProjectDetail';
import { getMessages } from '@/i18n/config';
import { defaultMetadata } from '@/services/metadata';
import { projects } from '@/static/projects';
import { PageBaseProps } from '@/types/next';
import { Metadata } from 'next';

export async function generateMetadata(
  props: PageBaseProps
): Promise<Metadata> {
  const params = await props.params;
  const messages = await getMessages(params.locale);
  const project = projects.find((p) => p.slug === params.slug);

  if (!messages?.projects || !project) {
    console.error(
      `Messages not found for locale: ${params.locale} or project: ${params.slug}`
    );
    return defaultMetadata;
  }

  const projectData = (messages.projects as any)[project.slug];

  if (!projectData?.metas) {
    console.error(`Project metadata not found for: ${project.slug}`);
    return defaultMetadata;
  }

  return {
    ...defaultMetadata,
    title: projectData.metas.title,
    description: projectData.metas.description,
    keywords: projectData.metas.keywords,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: projectData.metas.title,
      description: projectData.metas.description,
    },
  };
}

export async function generateStaticParams() {
  const locales = ['fr', 'en'];
  const paths = projects.flatMap((project) =>
    locales.map((locale) => {
      return {
        locale,
        slug: project.slug,
      };
    })
  );
  return paths;
}

export default async function Detail({ params }: PageBaseProps) {
  const { slug } = await params;
  if (!slug) {
    throw new Error('Slug is required');
  } else return <ProjectDetail slug={slug} />;
}

/* eslint-disable indent */
'use client';
import { FullPageLoader } from '@/components/Loaders/FullPageLoader';
import { projects } from '@/static/projects';
import { Col } from '@/static/styles/Flex';
import { useTranslations } from 'next-intl';
import { Layout } from '../utils/Layout';
import { H1, P16 } from '../utils/Texts';

interface ProjectDetailProps {
  slug: string;
}

export function ProjectDetail({ slug }: ProjectDetailProps) {
  const project = projects.find((p) => p.slug === slug);
  const tProjects = useTranslations('projects');

  return project ? (
    <Layout>
      <Col className="w-full h-screen flex items-center justify-center gap-4">
        <H1>{tProjects(project.title)}</H1>
        <P16>{tProjects(project.description)}</P16>
        <P16>{project.id}</P16>
      </Col>
    </Layout>
  ) : (
    <FullPageLoader />
  );
}

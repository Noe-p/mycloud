/* eslint-disable indent */
'use client';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/services/routes';
import { projects } from '@/static/projects';
import { Col } from '@/static/styles/Flex';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Layout } from '../utils/Layout';
import { H1 } from '../utils/Texts';

export function ProjectsPage(): React.JSX.Element {
  const router = useRouter();
  const tCommons = useTranslations('common');

  return (
    <Layout>
      <Col className="w-full h-screen items-center justify-center">
        <H1>{tCommons('projects.name')}</H1>
        {projects.map((project) => (
          <Button
            key={project.slug}
            className="mt-4"
            variant="outline"
            onClick={() => router.push(ROUTES.projects.project(project.slug))}
          >
            {project.id}
          </Button>
        ))}
      </Col>
    </Layout>
  );
}

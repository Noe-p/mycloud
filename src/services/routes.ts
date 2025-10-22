export const ROUTES = {
  home: '/',
  projects: {
    all: '/projects',
    project: (slug: string) => `/projects/${slug}`,
  },
};

export const GLOBAL_PREFIX = {
  API: 'api',
  STATIC_PATH: {
    public: 'public',
    files: 'files',
  },
};

export const NO_CONTENT_ROUTES = ['favicon.ico', 'socket.io'];

export const EXCLUDE_GLOBAL_PREFIX_ROUTES = ['/', 'health', ...NO_CONTENT_ROUTES];

export const getExcludePrefixRoutes = () => {
  const routes = new Set<string>();
  for (const route of EXCLUDE_GLOBAL_PREFIX_ROUTES) {
    routes.add(route);
    if (route !== '/') {
      routes.add(route.startsWith('/') ? route : `/${route}`);
    }
  }
  return Array.from(routes);
};

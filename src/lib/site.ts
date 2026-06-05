export const site = {
  name: 'Akxar Labs',
  title: 'Akxar Labs — Human-centered AI research',
  description:
    'Akxar Labs is an AI research organization studying reliable reasoning, alignment, and human-centered AI systems.',
  email: 'hello@akxarlabs.org',
  repository: 'https://github.com/AkxarLabs/website',
};

export const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Research', href: '/research' },
];

export const withBase = (path: string) => {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanPath ? `${base}${cleanPath}` : base;
};

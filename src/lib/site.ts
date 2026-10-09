export const site = {
  name: 'Akxar Labs',
  legalName: 'Ai Raxka Research LLP',
  llpin: 'ACN-6285',
  title: 'Akxar Labs — Multi-agent AI safety research',
  description:
    'Akxar Labs is an early-stage research lab building open environments and oversight tools for studying how AI agents behave together.',
  email: 'sneheel@akxar.xyz',
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

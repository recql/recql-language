import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'RecQL Documentation',
  tagline: 'Declarative Query Language for Recommenders, Search, and Ranking Engines',
  favicon: 'img/favicon.ico',

  url: 'https://docs.recql.io',
  baseUrl: '/',

  organizationName: 'recql',
  projectName: 'recql-language',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/docs',
          editUrl: 'https://github.com/recql/recql-language/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/recql-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'RecQL',
      logo: {
        alt: 'RecQL Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/docs',
          position: 'left',
          label: 'Language Guide',
        },
        {
          to: '/docs/ebnf-grammar',
          position: 'left',
          label: 'EBNF Grammar',
        },
        {
          to: '/docs/ir',
          position: 'left',
          label: 'Intermediate Representation (IR)',
        },
        {
          to: '/docs/recipes',
          position: 'left',
          label: 'Cookbook',
        },
        {
          href: 'https://github.com/recql',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Specification',
          items: [
            {
              label: 'Language Overview',
              to: '/docs',
            },
            {
              label: 'Execution Semantics',
              to: '/docs/semantics',
            },
            {
              label: 'EBNF Grammar',
              to: '/docs/ebnf-grammar',
            },
            {
              label: 'Intermediate Representation (IR)',
              to: '/docs/ir',
            },
          ],
        },
        {
          title: 'Reference',
          items: [
            {
              label: 'Retrievers',
              to: '/docs/reference/retrievers',
            },
            {
              label: 'Encoders',
              to: '/docs/reference/encoders',
            },
            {
              label: 'Scoring & Models',
              to: '/docs/reference/scoring-models',
            },
            {
              label: 'Reorderers',
              to: '/docs/reference/reordering',
            },
            {
              label: 'Expressions & Functions',
              to: '/docs/reference/expressions',
            },
          ],
        },
        {
          title: 'Community & Code',
          items: [
            {
              label: 'GitHub Organization',
              href: 'https://github.com/recql',
            },
            {
              label: 'Core Engine (Python)',
              href: 'https://github.com/recql/recql-python-core',
            },
            {
              label: 'Playground',
              href: 'https://github.com/recql/recql-playground',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RecQL Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['ebnf', 'sql', 'yaml', 'json', 'bash', 'python'],
    },
  },
};

export default config;

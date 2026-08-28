import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Specification',
      collapsed: false,
      items: [
        'index',
        'semantics',
        'ebnf-grammar',
        'ir',
      ],
    },
    {
      type: 'category',
      label: 'Function & Pipeline Reference',
      collapsed: false,
      items: [
        'reference/retrievers',
        'reference/encoders',
        'reference/scoring-models',
        'reference/reordering',
        'reference/expressions',
      ],
    },
    {
      type: 'category',
      label: 'Examples & Patterns',
      collapsed: false,
      items: [
        'recipes',
      ],
    },
  ],
};

export default sidebars;

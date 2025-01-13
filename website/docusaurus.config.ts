import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const customLight = {
  ...prismThemes.vsLight,
  styles: [
    ...prismThemes.vsLight.styles,
    {
      types: ['frontmatter'],
      style: {
        color: '#57606a' // GitHub light gray
      }
    },
    {
      types: ['frontmatter', 'punctuation'],
      style: {
        color: '#57606a' // GitHub light gray
      }
    },
    {
      types: ['equals'],
      style: {
        color: '#57606a' // GitHub light gray
      }
    },
    {
      types: ['plain'],
      style: {
        color: '#000000' //
      }
    },
    {
      types: ['comment'],
      style: {
        color: '#6e7781' // GitHub light comment gray
      }
    },
    {
      types: ['tagType'],
      style: {
        color: '#0550ae' // GitHub light blue
      }
    },
    {
      types: ['token', 'tag'],
      style: {
        color: '#cf222e' // GitHub light red
      }
    },
    {
      types: ['id'],
      style: {
        color: '#953800' // GitHub light orange
      }
    },
    {
      types: ['token', 'variable'],
      style: {
        color: '#1a7f37' // GitHub light green - better contrast for variables
      }
    },
    {
      types: ['attr-value', 'string'],
      style: {
        color: '#0a3069' // GitHub light navy
      }
    },
    {
      types: ['function'],
      style: {
        color: '#8250df' // GitHub light purple
      }
    },
    {
      types: ['token.tag.boolean', 'number'],
      style: {
        color: '#0550ae' // GitHub light blue - better contrast for booleans/numbers
      }
    }
  ]
};

const customDark = {
  ...prismThemes.vsDark,
  styles: [
    ...prismThemes.vsDark.styles,
    {
      types: ['frontmatter'],
      style: {
        color: '#8B949E' // Medium gray
      }
    },
    {
      types: ['plain'],
      style: {
        color: '#FFFFFF' //
      }
    },
    {
      types: ['frontmatter', 'punctuation', 'equals'],
      style: {
        color: '#8B949E' // Medium gray
      }
    },
    {
      types: ['comment'],
      style: {
        color: '#6E7681' // VS Code dark comment gray
      }
    },
    {
      types: ['tagType'],
      style: {
        color: '#79C0FF' // VS Code dark blue
      }
    },
    {
      types: ['token', 'tag'],
      style: {
        color: '#FF7B72' // VS Code dark red
      }
    },
    {
      types: ['id'],
      style: {
        color: '#FFA657' // VS Code dark orange
      }
    },
    {
      types: ['token', 'variable'],
      style: {
        color: '#7EE787' // VS Code dark green
      }
    },
    {
      types: ['attr-value', 'string'],
      style: {
        color: '#A5D6FF' // VS Code dark string blue
      }
    },
    {
      types: ['function'],
      style: {
        color: '#D2A8FF' // VS Code dark purple
      }
    },
    {
      types: ['boolean', 'number'],
      style: {
        color: '#79C0FF' // VS Code dark blue
      }
    }
  ]
};

const config: Config = {
  title: 'AIM',
  tagline: 'The AI Markup Language',
  favicon: 'img/favicon/favicon.ico',

  // Set the production url of your site here
  url: 'https://aim.microchipgnu.pt',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'microchipgnu', // Usually your GitHub org/user name.
  projectName: 'aim', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'AIM',
      // logo: {
      //   alt: 'AIM Logo',
      //   src: 'img/logo.svg',
      // },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/microchipgnu/aim',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'X',
              href: 'https://x.com/microchipgnu',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/microchipgnu/aim',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AIM`,
    },
    prism: {
      theme: customLight,
      darkTheme: customDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

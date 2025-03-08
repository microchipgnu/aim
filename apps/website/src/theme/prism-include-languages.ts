import siteConfig from '@generated/docusaurus.config';
import type * as PrismNamespace from 'prismjs';
import type { Optional } from 'utility-types';

export default function prismIncludeLanguages(
  PrismObject: typeof PrismNamespace,
): void {
  const {
    themeConfig: { prism },
  } = siteConfig;
  const { additionalLanguages } = prism as { additionalLanguages: string[] };

  const PrismBefore = globalThis.Prism;
  globalThis.Prism = PrismObject;

  // Add AIM syntax highlighting
  PrismObject.languages.aim = {
    comment: {
      pattern: /<!--[\s\S]*?-->/,
      greedy: true,
    },
    frontmatter: {
      pattern: /^---\n[\s\S]*?\n---/m,
      inside: {
        punctuation: /^---|---$/,
        yaml: {
          pattern: /[\s\S]+/,
        },
      },
    },
    tag: {
      pattern: /{%(.|\n)*?%}/i,
      inside: {
        tagType: {
          pattern: /^({%\s*\/?)(\w|-)*\b/i,
          lookbehind: true,
        },
        id: /#(\w|-)*\b/,
        string: /".*?"/,
        equals: /=/,
        number: /\b\d+\b/i,
        variable: {
          pattern: /\$[\w.]+/i,
          inside: {
            punctuation: /\./i,
          },
        },
        function: /\b\w+(?=\()/,
        punctuation: /({%|\/?%})/i,
        boolean: /false|true/,
      },
    },
    variable: {
      pattern: /\$\w+/i,
    },
    function: {
      pattern: /\b\w+(?=\()/i,
    },
  };

  additionalLanguages.forEach((lang) => {
    if (lang === 'php') {
      require('prismjs/components/prism-markup-templating.js');
    }
    require(`prismjs/components/prism-${lang}`);
  });

  // biome-ignore lint/performance/noDelete: <TODO>
  delete (globalThis as Optional<typeof globalThis, 'Prism'>).Prism;
  if (typeof PrismBefore !== 'undefined') {
    globalThis.Prism = PrismObject;
  }
}

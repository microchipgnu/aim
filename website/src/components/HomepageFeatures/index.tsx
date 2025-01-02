import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import { JSX } from 'react';
import { Code, Bot, Images, Wrench, FileText } from 'lucide-react';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Intuitive Flow Creation',
    Svg: Code,
    description: (
      <>
        Build powerful AI workflows with a developer-friendly syntax. Manage prompts, 
        switch models, and collaborate seamlessly.
      </>
    ),
  },
  {
    title: 'Advanced Capabilities',
    Svg: Bot,
    description: (
      <>
        Leverage loops, branching, and structured generation. Connect to APIs and 
        execute live code for maximum flexibility.
      </>
    ),
  },
  {
    title: 'Multimodal Support',
    Svg: Images,
    description: (
      <>
        Seamlessly integrate text, images, audio, and video in your AI workflows. 
        Switch between data types with ease.
      </>
    ),
  },
  {
    title: 'Prebuilt Tools',
    Svg: Wrench,
    description: (
      <>
        Access a suite of AI tools including speech synthesis, search, RAG, image 
        generation, and web scraping.
      </>
    ),
  },
  {
    title: 'Turing Complete Markdown',
    Svg: FileText,
    description: (
      <>
        Transform Markdown into a full programming language with variables, functions,
        loops and conditionals while maintaining its simple syntax.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>
          <Svg role="img" />
        </div>
        <div className={styles.featureContent}>
          <Heading as="h3" className={styles.featureTitle}>
            {title}
          </Heading>
          <p className={styles.featureDescription}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

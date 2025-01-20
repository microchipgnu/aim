import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import styles from './index.module.css';
import { JSX } from 'react';
import { CodePreview } from '../components/code-preview';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className="text-center">
          <Heading
            as="h1"
            className="hero__title"
            style={{
              fontSize: '3.5rem',
              marginBottom: '1rem'
            }}>
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle" style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: '2rem' }}>
            {siteConfig.tagline}
          </p>
          <div className={styles.buttons} style={{ marginBottom: '1rem' }}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/intro"
              style={{
                padding: '1rem 2rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}>
              Getting Started
            </Link>
          </div>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className={styles.buttons} style={{ marginBottom: '2rem' }}>
            <Link
              to="https://t.me/writeAIM"
              style={{
                padding: '0.75rem 1.5rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}>
              Join our Telegram Group
            </Link>
          </div>
            <CodePreview example='dreamer' title='dreamer.aim' outputs={["You may say I'm a dreamer", "But I'm not the only one", "I hope you'll join us", "And the world will live as one."]} />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}

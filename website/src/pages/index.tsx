import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import { JSX } from 'react';
import React from 'react';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
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
          <div className={styles.buttons} style={{ marginBottom: '3rem' }}>
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
          <div 
            style={{ position: 'relative', height: '300px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src="/img/code-snip.png" 
              alt="AIM Code Snippet"
              style={{
                position: 'absolute',
                left: '50%',
                transform: `translate(-50%, 0) ${isHovered ? 'scale(0.8) translateY(-20px)' : 'scale(1)'}`,
                opacity: isHovered ? 0 : 1,
                maxWidth: '400px',
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                transition: 'all 0.5s ease',
              }}
            />
            <img
              src="/img/code-exec.png"
              alt="AIM Code Execution"
              style={{
                position: 'absolute',
                left: '50%',
                transform: `translate(-50%, 0) ${isHovered ? 'scale(1)' : 'scale(0.8) translateY(20px)'}`,
                opacity: isHovered ? 1 : 0,
                maxWidth: '400px',
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                transition: 'all 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
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

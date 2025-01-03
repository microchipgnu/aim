import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import { JSX } from 'react';
import React from 'react';
export function CodeSnippet() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [currentLine, setCurrentLine] = React.useState(0);
  const [showCode, setShowCode] = React.useState(true);
  const [progressWidth, setProgressWidth] = React.useState(100);
  
  const lines = [
    "Started Imagine execution...",
    "You may say I'm a dreamer,",
    "But I'm not the only one", 
    "I hope someday you'll join us",
    "And the world will live as one",
    "Finished Imagine execution."
  ];

  const handleRun = () => {
    setIsRunning(true);
    setCurrentLine(0);
    setShowCode(false);
    setProgressWidth(0);

    const interval = setInterval(() => {
      setCurrentLine(prev => {
        if (prev >= lines.length - 1) {
          clearInterval(interval);
          setProgressWidth(100);
          
          setTimeout(() => {
            setProgressWidth(0);
            setTimeout(() => {
              setShowCode(true);
              setIsRunning(false);
              setCurrentLine(0);
              setProgressWidth(100);
            }, 1000);
          }, 1000);
          
          return prev;
        }
        setProgressWidth((prev + 1) * (100 / lines.length));
        return prev + 1;
      });
    }, 1000);
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentLine(0);
    setShowCode(true);
    setProgressWidth(100);
  };

  return (
    <div className={styles.codeSnippet} style={{
      backgroundColor: 'var(--ifm-background-surface-color)',
      borderRadius: '10px', 
      overflow: 'hidden',
      boxShadow: '0 8px 16px var(--ifm-color-emphasis-100)',
      fontFamily: '"Fira Code", "Consolas", monospace',
      textAlign: 'left',
      margin: '20px auto',
      height: '400px',
      maxHeight: '80vh',
      width: '100%',
      maxWidth: '600px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--ifm-color-emphasis-300)'
    }}>
      <div className={styles.codeHeader} style={{
        padding: '8px 12px',
        backgroundColor: 'var(--ifm-background-surface-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--ifm-color-emphasis-300)'
      }}>
        <div className={styles.filename} style={{ 
          color: 'var(--ifm-color-content)',
          fontWeight: 500,
          fontSize: '13px'
        }}>AIM</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isRunning ? (
            <button
              onClick={handleRun}
              style={{
                color: 'var(--ifm-color-content)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                border: '1px solid var(--ifm-color-emphasis-300)',
                backgroundColor: 'var(--ifm-background-surface-color)',
                minWidth: '50px'
              }}
            >
              Run
            </button>
          ) : (
            <button
              onClick={handleStop}
              style={{
                color: 'var(--ifm-color-content)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                border: '1px solid var(--ifm-color-emphasis-300)',
                backgroundColor: 'var(--ifm-background-surface-color)',
                minWidth: '50px'
              }}
            >
              Stop
            </button>
          )}
        </div>
      </div>
      {isRunning && (
        <div style={{
          height: '2px',
          backgroundColor: 'var(--ifm-color-emphasis-200)',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: 'var(--ifm-color-primary)',
            width: `${progressWidth}%`,
            transition: 'width 1s linear'
          }} />
        </div>
      )}
      <div className={styles.codeContent} style={{ 
        padding: '16px',
        lineHeight: '1.4',
        overflowY: 'auto',
        flex: 1,
        fontSize: '13px'
      }}>
        {showCode ? (
          <>
            <div className={styles.codeLine} style={{ color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px' }}>---</div>
            <div className={styles.codeLine} style={{ color: 'var(--ifm-color-emphasis-600)' }}>title: "Imagine"</div>
            <div className={styles.codeLine} style={{ color: 'var(--ifm-color-emphasis-600)', marginBottom: '8px' }}>---</div>
            <div className={styles.codeLine} style={{ color: 'var(--ifm-color-content)', marginBottom: '12px', wordBreak: 'break-word' }}>You may say I'm a dreamer,</div>
            
            <div className={styles.codeBlock} style={{ marginBottom: '12px' }}>
              <div className={styles.language} style={{
                color: 'var(--ifm-color-primary)',
                marginBottom: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}>```python</div>
              <div className={styles.code} style={{ 
                color: 'var(--ifm-color-success-darker)',
                backgroundColor: 'var(--ifm-background-color)',
                padding: '8px',
                borderRadius: '6px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>print("But I'm not the only one")</div>
              <div className={styles.language} style={{
                color: 'var(--ifm-color-primary)',
                marginTop: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}>```</div>
            </div>
            
            <div className={styles.codeBlock} style={{ marginBottom: '12px' }}>
              <div className={styles.language} style={{
                color: 'var(--ifm-color-primary)',
                marginBottom: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}>```javascript</div>
              <div className={styles.code} style={{ 
                color: 'var(--ifm-color-success-darker)',
                backgroundColor: 'var(--ifm-background-color)',
                padding: '8px',
                borderRadius: '6px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>console.log("I hope someday you'll join us")</div>
              <div className={styles.language} style={{
                color: 'var(--ifm-color-primary)',
                marginTop: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}>```</div>
            </div>
            
            <div className={styles.codeLine} style={{ color: 'var(--ifm-color-content)', wordBreak: 'break-word' }}>And the world will live as one</div>
          </>
        ) : (
          <div style={{
            backgroundColor: 'var(--ifm-background-color)',
            padding: '8px',
            borderRadius: '6px',
            color: 'var(--ifm-color-content)',
            fontSize: '12px'
          }}>
            {lines.slice(0, currentLine + 1).map((line, index) => (
              <div
                key={index}
                style={{
                  opacity: 1,
                  transform: `translateY(0)`,
                  transition: 'all 0.3s ease',
                  marginBottom: '4px',
                  animation: 'fadeIn 0.5s ease',
                  wordBreak: 'break-word'
                }}
              >
                <span style={{ color: 'var(--ifm-color-primary)' }}>{'>'}</span> {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

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
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <CodeSnippet />
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

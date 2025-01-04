import React from 'react';
import styles from '../pages/index.module.css';

interface CodePreviewProps {
  outputs: string[];
  title?: string;
  children?: React.ReactNode;
  example?: keyof typeof examples;
}

export const examples = {
  "dreamer": {
    title: 'dreamer.aim',
    outputs: [
      "You may say I'm a dreamer",
      "But I'm not the only one", 
      "I hope you'll join us",
      "And the world will live as one."
    ],
    children: `You may say I'm a dreamer

\`\`\`python
print("But I'm not the only one")
\`\`\`

\`\`\`js
console.log("I hope you'll join us")
\`\`\`

And the world will live as one.`
  }
}

export function CodePreview({ outputs, title = 'AIM', children, example }: CodePreviewProps) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [currentLine, setCurrentLine] = React.useState(0);
  const [showCode, setShowCode] = React.useState(true);
  const [progressWidth, setProgressWidth] = React.useState(100);
  
  const content = example ? examples[example].children : children;
  const finalTitle = example ? examples[example].title : title;
  const finalOutputs = example ? examples[example].outputs : outputs;

  const lines = React.useMemo(() => [
    `Started ${finalTitle} execution...`,
    ...finalOutputs,
    `Finished ${finalTitle} execution.`
  ], [finalTitle, finalOutputs]);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentLine(prev => {
          if (prev >= lines.length - 1) {
            clearInterval(interval);
            setProgressWidth(100);
            
            const timer1 = setTimeout(() => {
              setProgressWidth(0);
              const timer2 = setTimeout(() => {
                setShowCode(true);
                setIsRunning(false);
                setCurrentLine(0);
                setProgressWidth(100);
              }, 1000);
              return prev;
            }, 1000);
            return prev;
          }
          setProgressWidth((prev + 1) * (100 / lines.length));
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, lines.length]);

  const handleRun = React.useCallback(() => {
    setIsRunning(true);
    setCurrentLine(0);
    setShowCode(false);
    setProgressWidth(0);
  }, []);

  const handleStop = React.useCallback(() => {
    setIsRunning(false);
    setCurrentLine(0);
    setShowCode(true);
    setProgressWidth(100);
  }, []);

  const commonButtonStyles = React.useMemo(() => ({
    color: 'var(--ifm-color-content)',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    border: '1px solid var(--ifm-color-emphasis-300)',
    minWidth: '50px'
  }), []);

  return (
    <div className={styles.codeSnippet} style={{
      backgroundColor: 'var(--ifm-background-surface-color)',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px var(--ifm-color-emphasis-100)',
      fontFamily: '"Fira Code", "Consolas", monospace',
      textAlign: 'left',
      margin: '20px auto',
      height: '400px',
      maxHeight: '80vh',
      width: '100%',
      maxWidth: '600px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--ifm-color-emphasis-300)',
      color: 'var(--ifm-color-content)'
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
        }}>{finalTitle}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={isRunning ? handleStop : handleRun}
            style={{
              ...commonButtonStyles,
              backgroundColor: 'var(--ifm-background-surface-color)'
            }}
          >
            {isRunning ? 'Stop' : 'Run'}
          </button>
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
        fontSize: '13px',
        whiteSpace: 'pre-wrap',
        color: 'var(--ifm-color-content)'
      }}>
        {showCode ? (
          <div>
            {content}
          </div>
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
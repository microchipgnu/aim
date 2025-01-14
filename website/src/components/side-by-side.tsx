import React from 'react';
import clsx from 'clsx';

interface SideBySideProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}

export const SideBySide: React.FC<SideBySideProps> = ({
  left,
  right,
  className,
}) => {
  return (
    <div className={clsx('flex flex-col md:flex-row gap-4', className)}>
      <div className="flex-1">{left}</div>
      <div className="flex-1">{right}</div>
    </div>
  );
};

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden dark:border dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 ${className}`}>
            {children}
        </div>
    );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-4 sm:p-6 ${className}`}>
            {children}
        </div>
    );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-gray-50 dark:bg-slate-800/50 p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 ${className}`}>
            {children}
        </div>
    );
};


export default Card;
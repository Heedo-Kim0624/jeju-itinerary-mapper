
import React from 'react';
import { Button } from './button';
import { Code } from 'lucide-react';

interface RefactorButtonProps {
  onClick: () => void;
  target: string;
  label?: string;
  className?: string;
}

const RefactorButton: React.FC<RefactorButtonProps> = ({
  onClick,
  target,
  label = '리팩토링',
  className = '',
}) => {
  return (
    <Button 
      onClick={onClick}
      variant="outline"
      className={`flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-700 hover:text-amber-800 ${className}`}
    >
      <Code size={16} />
      <span>{label}</span>
      <span className="text-xs bg-amber-200 px-1.5 py-0.5 rounded-sm">{target}</span>
    </Button>
  );
};

export default RefactorButton;


import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  error: string;
}

const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="p-4">
      <div className="bg-red-50 text-red-600 p-4 rounded flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <div>
          <p className="font-medium">오류가 발생했습니다</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;

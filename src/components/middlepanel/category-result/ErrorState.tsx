
import React from 'react';

interface ErrorStateProps {
  error: string;
}

const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="p-4">
      <div className="bg-red-50 text-red-600 p-3 rounded">
        오류: {error}
      </div>
    </div>
  );
};

export default ErrorState;

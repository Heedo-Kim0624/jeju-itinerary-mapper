interface PromptKeywordBoxProps {
    keywords: string[];
  }
  
  const PromptKeywordBox: React.FC<PromptKeywordBoxProps> = ({ keywords }) => {
    if (keywords.length === 0) return null;
  
    return (
      <div className="border rounded-md p-3 bg-gray-50">
        <h3 className="text-sm font-medium mb-2 text-gray-700">프롬프트 키워드</h3>
        <p className="text-sm text-gray-400">
          {keywords.map((kw, i) => (
            <span key={kw}>
              {i > 0 && ', '}
              {kw}
            </span>
          ))}
        </p>
      </div>
    );
  };
  
  export default PromptKeywordBox;
  
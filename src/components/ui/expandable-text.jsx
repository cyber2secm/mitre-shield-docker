import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ExpandableText = ({ 
  text, 
  maxLines = 2, 
  className = "",
  showMoreText = "Show more",
  showLessText = "Show less"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text.trim() === "") {
    return <p className={`text-slate-500 italic ${className}`}>No description available.</p>;
  }

  return (
    <div className="space-y-3">
      <div 
        className={`text-slate-600 dark:text-slate-300 text-sm leading-relaxed transition-all duration-200 ${className} ${
          !isExpanded ? 'line-clamp-4' : ''
        }`}
        style={{
          display: !isExpanded ? '-webkit-box' : 'block',
          WebkitLineClamp: !isExpanded ? maxLines : 'unset',
          WebkitBoxOrient: 'vertical',
          overflow: !isExpanded ? 'hidden' : 'visible',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      >
        {text}
      </div>
      
      {/* Only show the button if text is long enough to be truncated */}
      {text.length > 100 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0 h-auto font-medium text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              {showLessText}
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              {showMoreText}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ExpandableText; 
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
    <div className="space-y-2">
      <p 
        className={`text-slate-600 text-sm leading-relaxed transition-all duration-200 ${className} ${
          !isExpanded ? 'line-clamp-2' : ''
        }`}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: !isExpanded ? maxLines : 'none',
          WebkitBoxOrient: 'vertical',
          overflow: !isExpanded ? 'hidden' : 'visible'
        }}
      >
        {text}
      </p>
      
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
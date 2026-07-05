
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

const AutoExpandingTextarea = forwardRef<HTMLTextAreaElement, Props>(({ value, className, style, ...props }, ref) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  const adjustHeight = () => {
    const textarea = innerRef.current;
    if (textarea) {
      if (style?.height && style.height !== 'auto') {
        return;
      }
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={innerRef}
      value={value}
      className={`${className} overflow-hidden resize-none`}
      style={style}
      {...props}
    />
  );
});

AutoExpandingTextarea.displayName = 'AutoExpandingTextarea';

export default AutoExpandingTextarea;

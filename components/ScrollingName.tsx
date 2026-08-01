import React, { useState, useEffect, useRef } from 'react';

interface ScrollingNameProps {
  name: string;
  className?: string;
  containerWidth?: string;
}

const ScrollingName: React.FC<ScrollingNameProps> = ({ name, className = "", containerWidth = "100%" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing = textRef.current.scrollWidth > containerRef.current.clientWidth + 5;
        setShouldScroll(isOverflowing);
      }
    };

    checkScroll();
    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [name]);

  const safeWidth = containerWidth.replace(/[^a-zA-Z0-9]/g, '');
  const animationName = `marquee-${safeWidth}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <>
      {shouldScroll && (
        <style>{`
          @keyframes ${animationName} {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      )}
      <div
        ref={containerRef}
        className={className}
        style={{
          width: containerWidth,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'relative',
          ...(shouldScroll ? {
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
          } : {})
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            ...(shouldScroll ? {
              animation: `${animationName} 10s linear infinite`,
            } : {})
          }}
        >
          <span
            ref={textRef}
            style={{
              display: 'inline-block',
              paddingRight: shouldScroll ? '2rem' : '0'
            }}
          >
            {name}
          </span>
          {shouldScroll && (
            <span
              style={{
                display: 'inline-block',
                paddingRight: '2rem'
              }}
            >
              {name}
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default ScrollingName;

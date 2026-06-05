import { useEffect, useRef } from 'react';
import { animate, scrambleText } from 'animejs';

interface ScrambleTextProps {
  text: string;
  className?: string;
  trigger?: unknown;
}

export default function ScrambleText({ text, className, trigger }: ScrambleTextProps) {
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (elRef.current) {
      animate(elRef.current, {
        innerHTML: scrambleText({ 
          text: text
        }),
        duration: 1000,
        easing: 'linear',
      });
    }
  }, [text, trigger]);

  return (
    <span ref={elRef} className={className}>
      {text}
    </span>
  );
}

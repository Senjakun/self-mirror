import { useEffect, useState } from "react";

const quineCode = `s='s=%r;print(s%%s)';print(s%s)`;

const QuineDisplay = () => {
  const [displayedCode, setDisplayedCode] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= quineCode.length) {
        setDisplayedCode(quineCode.slice(0, index));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="relative">
      {/* Code container */}
      <div className="relative bg-code-bg border border-border rounded-lg p-6 box-glow overflow-hidden">
        {/* Line numbers */}
        <div className="flex gap-4">
          <div className="text-muted-foreground font-mono text-sm select-none">
            <div>01</div>
          </div>
          
          {/* Code content */}
          <div className="font-mono text-sm flex-1">
            <span className="text-accent">{displayedCode}</span>
            <span 
              className={`inline-block w-2 h-4 bg-primary ml-0.5 align-middle ${
                showCursor ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>

        {/* Output section */}
        {isComplete && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <span className="text-primary">→</span>
              <span>Output</span>
            </div>
            <div className="font-mono text-sm text-foreground animate-pulse-glow">
              {quineCode}
            </div>
          </div>
        )}

        {/* Decorative scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan" />
        </div>
      </div>

      {/* Floating label */}
      <div className="absolute -top-3 left-4 px-2 bg-background text-xs text-muted-foreground">
        Python Quine
      </div>
    </div>
  );
};

export default QuineDisplay;

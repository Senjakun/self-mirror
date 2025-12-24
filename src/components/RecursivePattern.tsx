import { useEffect, useRef } from "react";

const RecursivePattern = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    let animationId: number;
    let time = 0;

    const drawRecursiveSquare = (
      x: number,
      y: number,
      size: number,
      depth: number,
      maxDepth: number
    ) => {
      if (depth > maxDepth || size < 2) return;

      const alpha = 0.15 + (depth / maxDepth) * 0.3;
      const hue = 160 + depth * 5 + Math.sin(time * 0.001 + depth) * 10;
      
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
      ctx.lineWidth = Math.max(0.5, 2 - depth * 0.3);

      ctx.beginPath();
      ctx.rect(x - size / 2, y - size / 2, size, size);
      ctx.stroke();

      const newSize = size * 0.65;
      const offset = size * 0.25;
      const rotation = Math.sin(time * 0.0005 + depth * 0.5) * 0.1;

      const corners = [
        { dx: -offset, dy: -offset },
        { dx: offset, dy: -offset },
        { dx: -offset, dy: offset },
        { dx: offset, dy: offset },
      ];

      corners.forEach(({ dx, dy }) => {
        const nx = x + dx * Math.cos(rotation) - dy * Math.sin(rotation);
        const ny = y + dx * Math.sin(rotation) + dy * Math.cos(rotation);
        drawRecursiveSquare(nx, ny, newSize, depth + 1, maxDepth);
      });
    };

    const animate = () => {
      time++;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;
      const baseSize = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.5;

      drawRecursiveSquare(centerX, centerY, baseSize, 0, 5);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
    />
  );
};

export default RecursivePattern;

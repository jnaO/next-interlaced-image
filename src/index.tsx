'use client';

import Image, { type ImageProps } from 'next/image';
import {
  type CSSProperties,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

export type InterlacedImageProps = Omit<ImageProps, 'placeholder'> & {
  /** Class for the wrapper that positions and sizes the image. */
  wrapperClassName?: string;
  /** Height of one interlaced row in pixels. Defaults to 4. */
  rowHeight?: number;
  /** Emulated download speed in kbit/s, like a modem's rating. The reveal length follows the image's file size. Defaults to 416. */
  speed?: number;
  /** Fixed reveal length in milliseconds. Overrides `speed`. */
  duration?: number;
  /** Shares the connection with other images: the earliest gets the most, later ones run slower until it finishes. Defaults to true. */
  stack?: boolean;
  /** Holds the reveal until the image is in view. Defaults to true. */
  lazy?: boolean;
};

const noscriptStyles = '[data-interlaced] > img { opacity: 1; }';

// Fallback for when the browser does not report a file size.
const estimatedBytesPerPixel = 0.25;

const bitsPerByte = 8;

// First row and row spacing of each GIF pass, within 8-row strips.
const gifPasses = [
  { start: 0, step: 8 },
  { start: 4, step: 8 },
  { start: 2, step: 4 },
  { start: 1, step: 2 },
];

// The final pass erases the canvas to show the real image underneath.
const finalPassStart = 1;

const stackedReveals: object[] = [];

const stackShare = (reveal: object) => {
  const position = stackedReveals.indexOf(reveal);
  if (position === -1) return 1;
  const weight = (index: number) => 0.5 ** index;
  const total = stackedReveals.reduce((sum, _, i) => sum + weight(i), 0);
  return weight(position) / total;
};

const leaveStack = (reveal: object) => {
  const position = stackedReveals.indexOf(reveal);
  if (position !== -1) stackedReveals.splice(position, 1);
};

const staticBlurDataURL = (src: ImageProps['src']) => {
  if (typeof src === 'string') return undefined;
  return 'default' in src ? src.default.blurDataURL : src.blurDataURL;
};

const imageBytes = (image: HTMLImageElement) => {
  const [entry] = performance.getEntriesByName(image.currentSrc);
  const reported =
    entry instanceof PerformanceResourceTiming ? entry.encodedBodySize : 0;
  return (
    reported ||
    image.naturalWidth * image.naturalHeight * estimatedBytesPerPixel
  );
};

const interlacedRows = (rowCount: number) =>
  gifPasses.flatMap(({ start, step }) => {
    const rows: { row: number; span: number; final: boolean }[] = [];
    const final = start === finalPassStart;
    const end = final ? rowCount + 1 : rowCount;
    for (let row = start; row < end; row += step) {
      rows.push({ row, span: start === 0 ? 8 : start, final });
    }
    return rows;
  });

export function InterlacedImage({
  src,
  blurDataURL,
  wrapperClassName,
  rowHeight = 4,
  speed = 416,
  duration,
  stack = true,
  lazy = true,
  fill,
  onLoad,
  ...imageProps
}: InterlacedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [imageVisible, setImageVisible] = useState(false);
  const [done, setDone] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placeholder = blurDataURL ?? staticBlurDataURL(src);
  const revealing = loaded && inView && !done;

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = event.currentTarget;
    setLoaded(true);
    onLoad?.(event);
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (inView || !wrapper) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [inView]);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!revealing || !image || !canvas || !context) return;

    const { naturalWidth, naturalHeight } = image;
    const { width, height } = canvas.getBoundingClientRect();
    if (naturalWidth === 0 || width === 0 || height === 0) {
      setDone(true);
      return;
    }

    const { objectFit, objectPosition } = getComputedStyle(image);
    canvas.style.objectFit = objectFit;
    canvas.style.objectPosition = objectPosition;

    const pixelRatio = window.devicePixelRatio || 1;
    const displayScale = Math.max(width / naturalWidth, height / naturalHeight);
    const frameWidth = Math.round(naturalWidth * displayScale * pixelRatio);
    const frameHeight = Math.round(naturalHeight * displayScale * pixelRatio);
    canvas.width = frameWidth;
    canvas.height = frameHeight;

    const frame = document.createElement('canvas');
    frame.width = frameWidth;
    frame.height = frameHeight;
    const frameContext = frame.getContext('2d');
    if (frameContext) frameContext.imageSmoothingQuality = 'high';
    frameContext?.drawImage(image, 0, 0, frameWidth, frameHeight);

    const row = Math.max(1, Math.round(rowHeight * pixelRatio));
    const rows = interlacedRows(Math.ceil(frameHeight / row));
    const progressPerMs =
      duration === undefined
        ? speed / bitsPerByte / imageBytes(image)
        : 1 / duration;

    const reveal = {};
    if (stack) stackedReveals.push(reveal);
    let previous = performance.now();
    let progress = 0;
    let drawn = 0;
    let animationFrame = 0;

    const tick = (now: number) => {
      progress = Math.min(
        progress + (now - previous) * progressPerMs * stackShare(reveal),
        1,
      );
      previous = now;
      const target = Math.ceil(progress * rows.length);
      for (; drawn < target; drawn += 1) {
        const { row: rowIndex, span, final } = rows[drawn];
        const y = rowIndex * row;
        if (final) {
          setImageVisible(true);
          context.clearRect(0, y - row, frameWidth, row * 2);
        } else {
          context.drawImage(
            frame,
            0,
            y,
            frameWidth,
            row,
            0,
            y,
            frameWidth,
            row * span,
          );
        }
      }
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        leaveStack(reveal);
        setDone(true);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrame);
      leaveStack(reveal);
    };
  }, [revealing, rowHeight, duration, speed, stack]);

  const wrapperStyle: CSSProperties | undefined =
    !done && placeholder
      ? { backgroundImage: `url("${placeholder}")` }
      : undefined;

  return (
    <span
      ref={wrapperRef}
      className={wrapperClassName}
      style={wrapperStyle}
      data-interlaced={imageVisible ? 'done' : 'loading'}
      data-fill={fill || undefined}
    >
      <Image src={src} fill={fill} onLoad={handleLoad} {...imageProps} />
      {!done && <canvas ref={canvasRef} />}
      <noscript>
        <style>{noscriptStyles}</style>
      </noscript>
    </span>
  );
}

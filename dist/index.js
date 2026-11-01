'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import { useEffect, useRef, useState, } from 'react';
const noscriptStyles = '[data-interlaced] > img { opacity: 1; }';
// Fallback for when the browser does not report a file size.
const estimatedBytesPerPixel = 0.25;
// First row and row spacing of each GIF pass, within 8-row strips.
const gifPasses = [
    { start: 0, step: 8 },
    { start: 4, step: 8 },
    { start: 2, step: 4 },
    { start: 1, step: 2 },
];
// The final pass erases the canvas to show the real image underneath.
const finalPassStart = 1;
const stackedReveals = [];
const stackShare = (reveal) => {
    const position = stackedReveals.indexOf(reveal);
    if (position === -1)
        return 1;
    const weight = (index) => 0.5 ** index;
    const total = stackedReveals.reduce((sum, _, i) => sum + weight(i), 0);
    return weight(position) / total;
};
const leaveStack = (reveal) => {
    const position = stackedReveals.indexOf(reveal);
    if (position !== -1)
        stackedReveals.splice(position, 1);
};
const staticBlurDataURL = (src) => {
    if (typeof src === 'string')
        return undefined;
    return 'default' in src ? src.default.blurDataURL : src.blurDataURL;
};
const imageBytes = (image) => {
    const [entry] = performance.getEntriesByName(image.currentSrc);
    const reported = entry instanceof PerformanceResourceTiming ? entry.encodedBodySize : 0;
    return (reported ||
        image.naturalWidth * image.naturalHeight * estimatedBytesPerPixel);
};
const interlacedRows = (rowCount) => gifPasses.flatMap(({ start, step }) => {
    const rows = [];
    const final = start === finalPassStart;
    const end = final ? rowCount + 1 : rowCount;
    for (let row = start; row < end; row += step) {
        rows.push({ row, span: start === 0 ? 8 : start, final });
    }
    return rows;
});
export function InterlacedImage({ src, blurDataURL, wrapperClassName, rowHeight = 4, modem = 52, duration, stack = true, lazy = true, fill, onLoad, ...imageProps }) {
    const [loaded, setLoaded] = useState(false);
    const [inView, setInView] = useState(!lazy);
    const [imageVisible, setImageVisible] = useState(false);
    const [done, setDone] = useState(false);
    const wrapperRef = useRef(null);
    const imageRef = useRef(null);
    const canvasRef = useRef(null);
    const placeholder = blurDataURL ?? staticBlurDataURL(src);
    const revealing = loaded && inView && !done;
    const handleLoad = (event) => {
        imageRef.current = event.currentTarget;
        setLoaded(true);
        onLoad?.(event);
    };
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (inView || !wrapper)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting)
                setInView(true);
        });
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [inView]);
    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!revealing || !image || !canvas || !context)
            return;
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
        if (frameContext)
            frameContext.imageSmoothingQuality = 'high';
        frameContext?.drawImage(image, 0, 0, frameWidth, frameHeight);
        const row = Math.max(1, Math.round(rowHeight * pixelRatio));
        const rows = interlacedRows(Math.ceil(frameHeight / row));
        const progressPerMs = duration === undefined ? modem / imageBytes(image) : 1 / duration;
        const reveal = {};
        if (stack)
            stackedReveals.push(reveal);
        let previous = performance.now();
        let progress = 0;
        let drawn = 0;
        let animationFrame = 0;
        const tick = (now) => {
            progress = Math.min(progress + (now - previous) * progressPerMs * stackShare(reveal), 1);
            previous = now;
            const target = Math.ceil(progress * rows.length);
            for (; drawn < target; drawn += 1) {
                const { row: rowIndex, span, final } = rows[drawn];
                const y = rowIndex * row;
                if (final) {
                    setImageVisible(true);
                    context.clearRect(0, y - row, frameWidth, row * 2);
                }
                else {
                    context.drawImage(frame, 0, y, frameWidth, row, 0, y, frameWidth, row * span);
                }
            }
            if (progress < 1) {
                animationFrame = requestAnimationFrame(tick);
            }
            else {
                leaveStack(reveal);
                setDone(true);
            }
        };
        animationFrame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(animationFrame);
            leaveStack(reveal);
        };
    }, [revealing, rowHeight, duration, modem, stack]);
    const wrapperStyle = !done && placeholder
        ? { backgroundImage: `url("${placeholder}")` }
        : undefined;
    return (_jsxs("span", { ref: wrapperRef, className: wrapperClassName, style: wrapperStyle, "data-interlaced": imageVisible ? 'done' : 'loading', "data-fill": fill || undefined, children: [_jsx(Image, { src: src, fill: fill, onLoad: handleLoad, ...imageProps }), !done && _jsx("canvas", { ref: canvasRef }), _jsx("noscript", { children: _jsx("style", { children: noscriptStyles }) })] }));
}

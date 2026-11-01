import { type ImageProps } from 'next/image';
export type InterlacedImageProps = Omit<ImageProps, 'placeholder'> & {
    /** Class for the wrapper that positions and sizes the image. */
    wrapperClassName?: string;
    /** Height of one interlaced row in pixels. Defaults to 4. */
    rowHeight?: number;
    /** Emulated connection speed in kB/s. The reveal length follows the image's file size. Defaults to 52. */
    modem?: number;
    /** Fixed reveal length in milliseconds. Overrides `modem`. */
    duration?: number;
    /** Shares the connection with other images: the earliest gets the most, later ones run slower until it finishes. Defaults to true. */
    stack?: boolean;
    /** Holds the reveal until the image is in view. Defaults to true. */
    lazy?: boolean;
};
export declare function InterlacedImage({ src, blurDataURL, wrapperClassName, rowHeight, modem, duration, stack, lazy, fill, onLoad, ...imageProps }: InterlacedImageProps): import("react").JSX.Element;

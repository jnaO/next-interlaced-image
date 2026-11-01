# next-interlaced-image

`next/image` with a 90s interlaced GIF loading effect. The image starts as chunky pixels, then appears in GIF's four interlaced passes. Each row is stretched down over the rows still missing, the way browsers drew interlaced GIFs.

```sh
pnpm add next-interlaced-image
```

Import the styles once, for example in your root layout:

```tsx
import 'next-interlaced-image/styles.css';
```

Use it like `next/image`:

```tsx
import { InterlacedImage } from 'next-interlaced-image';
import photo from './photo.jpg';

<InterlacedImage src={photo} alt="A photo" />;
```

## Props

Takes every `next/image` prop except `placeholder`, plus:

| Prop               | Default | Description                                                                                                                                                      |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapperClassName` |         | Class for the wrapper. Use it for layout, such as width. `className` goes on the `<img>`.                                                                        |
| `rowHeight`        | `4`     | Height of one interlaced row in pixels                                                                                                                           |
| `speed`            | `52`    | Emulated download speed in kB/s. The reveal length follows the image's file size.                                                                                |
| `stack`            | `true`  | Shares the connection between images. The earliest gets the most, and later ones run slower until it finishes. Set to `false` to give each image the full speed. |
| `lazy`             | `true`  | Holds the reveal until the image is in view. Set to `false` to start as soon as the image has loaded.                                                            |
| `duration`         |         | Fixed reveal length in milliseconds. Overrides `speed`.                                                                                                          |

## Notes

- Statically imported images work with no setup. For remote images, pass `blurDataURL` with a tiny image, or the reveal runs without pixels behind it.
- With `fill`, the wrapper fills the nearest positioned parent.
- The reveal starts once the image has loaded, so it does not track download progress.
- `lazy` holds the reveal only. The file itself loads as `next/image` decides, so the reveal can start at once when the image scrolls into view.
- `speed` uses the size the browser reports. If it reports none, such as for a cross-origin image, the size is estimated from the image's dimensions.
- The reveal always plays, including with Reduce Motion on.
- Without JavaScript, the image shows normally.

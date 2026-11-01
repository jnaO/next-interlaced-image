<div align="center">
<pre>
 ██████╗ ██╗███████╗
██╔════╝ ██║██╔════╝
██║  ███╗██║█████╗  
██║   ██║██║██╔══╝  
╚██████╔╝██║██║     
 ╚═════╝ ╚═╝╚═╝     
</pre>

<h1>next-interlaced-image</h1>

<p><code>next/image</code> with the loading effect of a 90s interlaced GIF.</p>
</div>

Images start as chunky pixels, then sweep in over GIF's four interlaced passes, as if they were arriving over a slow modem. Each row is stretched down over the rows still missing, the way browsers used to draw them. The last pass reveals the real image, so nothing shifts when the effect ends.

## Features

- **Works like `next/image`:** swap the component and keep your props.
- **Emulated download speed:** the reveal length follows each image's file size.
- **Shared connection:** images on screen together compete for bandwidth, so later ones load slower.
- **Lazy reveal:** the effect waits until the image scrolls into view.
- **No build step:** statically imported images work as they are.
- **Works without JavaScript:** images show normally.

## Install

```sh
pnpm add next-interlaced-image
```

Requires Next.js 16 or later and React 19 or later.

## Usage

Import the styles once, for example in your root layout:

```tsx
import 'next-interlaced-image/styles.css';
```

Then use it in place of `next/image`:

```tsx
import { InterlacedImage } from 'next-interlaced-image';
import photo from './photo.jpg';

export function Photo() {
  return <InterlacedImage src={photo} alt="A view from the top" />;
}
```

### Full-bleed images

With `fill`, the image fills its nearest positioned parent. `className` goes on the `<img>`, so set `object-fit` there:

```tsx
<header className="hero">
  <InterlacedImage src={photo} alt="" fill priority className="cover" />
</header>;
```

```css
.hero {
  position: relative;
  height: 50vh;
}

.cover {
  object-fit: cover;
}
```

### Layout

The component wraps the image in a `<span>`. Use `wrapperClassName` for anything that affects layout, such as width:

```tsx
<InterlacedImage src={photo} alt="" wrapperClassName="half-width" />;
```

### Tuning the effect

```tsx
// A slower connection, in kB/s
<InterlacedImage src={photo} alt="" modem={28.8} />

// A fixed two-second reveal
<InterlacedImage src={photo} alt="" duration={2000} />

// Chunkier rows, and no waiting for other images
<InterlacedImage src={photo} alt="" rowHeight={8} stack={false} />

// Start as soon as the image has loaded, even off-screen
<InterlacedImage src={photo} alt="" lazy={false} />
```

### Remote images

Pixels come from the tiny placeholder Next.js creates for static imports. For remote images, pass your own through `blurDataURL`. Without one, the first pass draws straight onto an empty background.

```tsx
<InterlacedImage
  src="https://example.com/photo.jpg"
  alt=""
  width={1500}
  height={845}
  blurDataURL="data:image/jpeg;base64,..."
/>;
```

## Props

Takes every `next/image` prop except `placeholder`, plus:

| Prop               | Default | Description                                                                                                                                       |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modem`            | `52`    | Emulated connection speed in kB/s. The reveal length follows the image's file size.                                                               |
| `duration`         |         | Fixed reveal length in milliseconds. Overrides `modem`.                                                                                           |
| `stack`            | `true`  | Shares the connection between images. The earliest gets the most, and later ones run slower until it finishes. `false` gives each the full speed. |
| `lazy`             | `true`  | Holds the reveal until the image is in view. `false` starts it as soon as the image has loaded.                                                   |
| `rowHeight`        | `4`     | Height of one interlaced row in pixels.                                                                                                           |
| `wrapperClassName` |         | Class for the wrapper. `className` goes on the `<img>`.                                                                                           |

## How it works

A GIF stores its rows out of order, in four passes through 8-row strips:

| Pass | Rows            | Drawn as           |
| ---- | --------------- | ------------------ |
| 1    | Every 8th row   | 8 rows tall        |
| 2    | Rows between    | 4 rows tall        |
| 3    | Every 4th row   | 2 rows tall        |
| 4    | Every other row | The finished image |

`InterlacedImage` loads the image normally, then replays those passes on a canvas over it. Pass 4 erases the canvas instead of drawing on it, which uncovers the real `<img>`.

## Good to know

- **The effect doesn't follow the real download.** The reveal starts once the image has loaded, and it replays on every page view, including for cached images.
- **`lazy` holds the reveal, not the file.** The file loads whenever `next/image` decides, so the reveal can start at once when the image scrolls into view.
- **`modem` needs a file size.** It uses the size the browser reports. If there is none, as with most cross-origin images, the size is estimated from the image's dimensions.
- **Stack order is the order reveals start,** which can differ from page order.
- **The reveal always plays,** including with Reduce Motion on.

## License

MIT

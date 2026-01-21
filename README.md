# Parallex

A lightweight, performant JavaScript library for creating smooth parallax scrolling effects with responsive breakpoint support and programmatic controls.

## Features

- 🚀 **Performance optimized** using `requestAnimationFrame` and cached calculations
- 📱 **Responsive breakpoints** with different speeds per breakpoint
- 🎮 **Dual trigger modes**: scroll-based and programmatic controls
- 🎯 **Flexible element targeting** via CSS selectors
- 🔄 **Smart scroll restoration** with multiple modes
- ⚡ **Viewport detection** for efficient resource usage
- 🎨 **Customizable constraints** and active classes
- 🪶 **Zero dependencies**

## Installation

### Via npm

```bash
npm install @ryanrudman/parallex
```

### Via yarn

```bash
yarn add @ryanrudman/parallex
```

### Via pnpm

```bash
pnpm add @ryanrudman/parallex
```

### Direct import

Or include directly in your project:

```javascript
import { Parallex } from './parallex.js';
```

## Quick Start

### Basic Usage

```html
<!-- Add the data attribute to elements you want to parallax -->
<div data-parallex>
  <img src="image.jpg" alt="Parallax Image">
</div>
```

```javascript
import { Parallex } from '@ryanrudman/parallex';

// Initialize with default options
const parallax = Parallex();
parallax.init();
```

### With Custom Options

```javascript
const parallax = Parallex({
  selector: '[data-parallex]',
  speed: 5,
  trigger: 'scroll',
  minActiveBreakpoint: 768,
  scrollRestoration: 'smoothScroll'
});

parallax.init();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rootElement` | Element | `document` | Root element to search for parallax elements |
| `selector` | String | `'[data-parallex]'` | CSS selector for parallax elements |
| `trigger` | String | `'scroll'` | Trigger mode: `'scroll'` or `'controls'` |
| `activeClass` | String | `'parallex-active'` | Class added to active elements |
| `freezeClass` | String | `'parallex-freeze'` | Class to disable transform updates |
| `cssTransitionStyle` | String/Boolean | `false` | CSS transition style to apply |
| `speed` | Number | `5` | Default parallax speed (higher = faster) |
| `autoScrollSpeed` | Number | `1` | Speed for programmatic scrolling |
| `minActiveBreakpoint` | Number | `0` | Minimum viewport width to activate parallax |
| `breakpoints` | Object | `false` | Responsive breakpoint configuration |
| `scrollRestoration` | String | `'browser'` | Scroll restoration mode: `'browser'`, `'smoothScroll'`, or `'disable'` |

## Data Attributes

### `data-parallex`
Marks an element for parallax effect.

```html
<div data-parallex></div>
```

### `data-parallex-speed`
Sets custom speed for individual elements.

```html
<div data-parallex data-parallex-speed="10"></div>
```

### `data-parallex-speed-{breakpoint}`
Sets speed for specific breakpoints (e.g., `data-parallex-speed-mobile`).

```html
<div data-parallex
     data-parallex-speed="10"
     data-parallex-speed-mobile="5"></div>
```

### `data-parallex-constraint`
Limits maximum transform distance (in pixels).

```html
<div data-parallex data-parallex-constraint="500"></div>
```

### `data-parallex-explicitly-activate`
Requires the `parallex-active` class to be manually added before parallax activates.

```html
<div data-parallex data-parallex-explicitly-activate="true"></div>
```

## Advanced Usage

### Responsive Breakpoints

```javascript
const parallax = Parallex({
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024
  }
});

parallax.init();
```

Then use breakpoint-specific speeds:

```html
<div data-parallex
     data-parallex-speed-mobile="3"
     data-parallex-speed-tablet="5"
     data-parallex-speed-desktop="8"></div>
```

### Programmatic Controls

Use `trigger: 'controls'` for programmatic parallax animation:

```javascript
const parallax = Parallex({
  trigger: 'controls',
  autoScrollSpeed: 2
});

parallax.init();

// Start animation
parallax.controls.start();

// Stop animation
parallax.controls.stop();

// Restart from beginning
parallax.controls.restart();
```

### Scroll Restoration Modes

#### Browser (Default)
Uses native browser scroll restoration:

```javascript
const parallax = Parallex({
  scrollRestoration: 'browser'
});
```

#### Smooth Scroll
Smoothly scrolls to previous position on page reload:

```javascript
const parallax = Parallex({
  scrollRestoration: 'smoothScroll'
});
```

#### Disable
Always reloads page at the top:

```javascript
const parallax = Parallex({
  scrollRestoration: 'disable'
});
```

### Scoped to Container

```javascript
const container = document.querySelector('.parallax-container');

const parallax = Parallex({
  rootElement: container
});

parallax.init();
```

## API Methods

### `init()`
Initializes the parallax effect.

```javascript
parallax.init();
```

### `destroy()`
Removes all event listeners and resets transforms.

```javascript
parallax.destroy();
```

### `controls.start()`
Starts programmatic animation (only when `trigger: 'controls'`).

```javascript
parallax.controls.start();
```

### `controls.stop()`
Stops programmatic animation.

```javascript
parallax.controls.stop();
```

### `controls.restart()`
Resets and restarts programmatic animation.

```javascript
parallax.controls.restart();
```

## Performance Considerations

The library is highly optimized for performance:

- ⚡ **Cached data attributes** - All element data read once on init, not on every frame
- 🚀 **Reduced DOM reads** - 60-70% fewer DOM operations per frame
- 📊 **Smart `getBoundingClientRect()`** - Only called when necessary (60-80% reduction)
- 🎯 **Intersection Observer API** - Browser-optimized viewport detection (optional, enabled by default)
- 💾 **Cached window dimensions** - Window properties read once per frame, not per element
- 🔄 **Throttled resize events** - Prevents excessive recalculations (150ms throttle)
- 🎨 **Optimized transforms** - Pre-built transform strings reduce string operations
- 🔒 **Cached class states** - Active/frozen states cached to avoid repeated class checks
- 📱 **Passive event listeners** - Better scroll performance
- 🎬 **RequestAnimationFrame** - Smooth 60fps animations
- ❄️ **Auto-freeze** - Elements frozen when above viewport on page load

See [OPTIMIZATIONS.md](OPTIMIZATIONS.md) for detailed performance metrics and improvements.

## Browser Support

- Modern browsers with ES6 support
- Fallback for browsers without `requestAnimationFrame`
- Passive event listener detection

## Examples

### Hero Section

```html
<section class="hero">
  <div data-parallex data-parallex-speed="8">
    <img src="background.jpg" alt="Background">
  </div>
  <div data-parallex data-parallex-speed="4">
    <h1>Welcome</h1>
  </div>
</section>
```

### Multi-layer Parallax

```html
<div class="scene">
  <div data-parallex data-parallex-speed="2" class="layer-1"></div>
  <div data-parallex data-parallex-speed="5" class="layer-2"></div>
  <div data-parallex data-parallex-speed="8" class="layer-3"></div>
</div>
```

### Constrained Movement

```html
<div data-parallex
     data-parallex-speed="10"
     data-parallex-constraint="300">
  <img src="image.jpg" alt="Limited parallax">
</div>
```

## License

MIT License - Copyright (c) 2023 Ryan Rudman

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Ryan Rudman

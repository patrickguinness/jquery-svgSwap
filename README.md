# svgSwap jQuery plugin

Replace an SVG file path in your markup with SVG code.

- Allows you to embed SVG content within your page without polluting your markup with lengthy SVG code.
- Embedded SVG content can then be styled with CSS.
- Supports both individual SVG images, and SVG sprites.
- SVG sprites used for the development of this plugin were generated using [IcoMoon](https://icomoon.io/).

## Implementation

### Single images

Add an SVG reference within your markup:

```html
<i src="/img/path/to/svg-file.svg" class="svg-swap" width="30" height="30"></i>
```

The **width** and **height** attributes determine the dimensions of the image as it should appear on the rendered page.


### Sprites

If using a sprite file, include a **symbol** attribute that corresponds to a symbol ID in the SVG sprite:

```html
<i src="/img/path/to/svg-sprite.svg" symbol="icon-smiley" class="svg-swap" width="30" height="30"></i>
```

Example from SVG sprite:

```xml
<symbol id="icon-smiley" viewBox="0 0 50 50">
	...
</symbol>
```

### Initialize plugin:

```javascript
(function($){
	$('.svg-swap').svgSwap();
})(jQuery);
```

## Config options

This plugin supports the following configuration options:

- **disableCache** - Boolean _(Default: false)_ - Disables caching features.

Example implementation:

```javascript
(function($){
	$('.svg-swap').svgSwap({
		disableCache: true
	});
})(jQuery);
```


## Development

Before doing any development, make sure you have the following dependencies installed globally on your machine:

- [Node](https://nodejs.org)
- [Yarn](https://yarnpkg.com/) `npm install --global yarn`
- [Gulp](http://gulpjs.com/) `npm install --global gulp-cli`

If this is your first time running the project locally, install all project-specific dependencies using Yarn:

```
yarn
```

Then, to run the project in your browser:

```
gulp serve
```
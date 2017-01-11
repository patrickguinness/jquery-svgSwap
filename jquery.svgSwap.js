(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

  'use strict';

  var CACHE = {};

  /**
   * A library of convenience methods for caching
   */
  var cacheService = {

    checkSessionStorage: function() {
      if (window.sessionStorage) {
        return true;
      }

      return false;
    },

    getValue: function(key) {
      if (!this.checkSessionStorage()) {
        return;
      }

      var value = window.sessionStorage.getItem(key);
      var parsedValue = JSON.parse(value);

      if (!parsedValue) {
        return;
      }

      return parsedValue;
    },

    setValue: function(url, content) {
      if (!this.checkSessionStorage()) {
        return;
      }

      window.sessionStorage.setItem(url, JSON.stringify({
        svgContent: content
      }));
    }
  };
  

	/**
	 * Get attributes from referencing tag in markup
	 * @param  {object} $el jQuery selector of element in markup that will be replaced
	 * @return {array} Returns array of objects with structure {name: 'string', value: 'string'}
	 */
	function getTagAttributes($el) {

		// set the valid attributes that we want to copy from referencing element to SVG
		var attributes = [
			'id',
			'class',
			'width',
			'height'
		];

		var attributesNew = [];

		for (var i=0, numItems = attributes.length; i < numItems; i++) {
			if ($el.attr(attributes[i])) {
				attributesNew.push({
					name: attributes[i],
					value: $el.attr(attributes[i])
				});
			}
		}

		return attributesNew;
	}

  /**
   * Call the appropriate response handler, depending on whether we're parsing
   * and individual SVG image, or an SVG sprite
   * @param  {string} imgUrl     URL to the SVG file
   * @param  {string} content    SVG XML content
   * @param  {string} symbol     Identifier for the symbol within a sprite
   * @param  {array} attributes  Array of attributes that should be added to <svg> tag
   */
  function handleSvgResponse(imgUrl, content, symbol, attributes) {
    var output;

    // if symbol is specified, then we're parsing an image within a sprite

    if (symbol) {
      output = handleSvgSpriteResponse(imgUrl, content, symbol, attributes);
    } else {
      output = handleSvgSingleResponse(imgUrl, content, attributes);
    }

    return output;
  }

	/**
	 * Build and return SVG content from SVG sprite file that will replace referencing element
	 * @param  {object} response   Contains response status and string of SVG XML content
	 * @param  {string} symbol     The symbol identifier from the SVG sprite
	 * @param  {array} attributes Array of attributes that should be added to <svg> tag
	 * @return {object}            SVG XML document object
	 */
	function handleSvgSpriteResponse(imgUrl, content, symbol, attributes) {

		var viewBox;

    // create new SVG element
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('version', '1.1');

    if (!content) {
      console.error("No SVG content was retrieved from source file at: " + imgUrl);
      return;
    }

    var parser = new DOMParser();
    var sprite = parser.parseFromString(content, 'image/svg+xml');
    var spriteSymbol = sprite.querySelector('#' + symbol);

    if (!spriteSymbol) {
      console.error("'sprite-symbol' identifier was not found in source SVG at: " + imgUrl);
      return;
    }
    
    viewBox = spriteSymbol.getAttribute('viewBox');

    // add symbol content to newly created SVG
    svg.insertAdjacentHTML('afterbegin', spriteSymbol.innerHTML);

    // set viewBox attribute from symbol content
    svg.setAttribute('viewBox', viewBox);
    
    // copy over attributes from original element
    for (var i=0, numItems = attributes.length; i < numItems; i++) {
			svg.setAttribute(attributes[i]['name'], attributes[i]['value']);
    }

    return svg;
	}

	/**
	 * Build and return SVG content from single SVG file that will replace referencing element
	 * @param  {object} response   Contains response status and string of SVG XML content
	 * @param  {array} attributes Array of attributes that should be added to <svg> tag
	 * @return {object}            jQuery object of final SVG content
	 */
	function handleSvgSingleResponse(imgUrl, content, attributes) {

    if (!content) {
      console.error("No SVG content was retrieved from source file at: " + imgUrl);
      return;
    }
      
    var $svg = $(content);

    // copy over attributes from original element
    for (var i=0, numItems = attributes.length; i < numItems; i++) {
			$svg = $svg.attr(attributes[i]['name'], attributes[i]['value']);
    }

    // remove any invalid XML tags per http://validator.w3.org
    $svg = $svg.removeAttr('xmlns:a');

    // Check if the viewport is set, if the viewport is not set the SVG won't scale.
    if(!$svg.attr('viewBox') && $svg.attr('height') && $svg.attr('width')) {
      $svg.attr('viewBox', '0 0 ' + $svg.attr('height') + ' ' + $svg.attr('width'));
    }

    return $svg;
	}


	// Initialize plugin
	$.fn.svgSwap = function(options) {

    var settings = $.extend({
      disableCache: false
    }, options);

		return this.each(function(el){

			var $el = $(this);

			// get src attribute
			var imgUrl = $(this).attr('src');

			if (!imgUrl) {
				console.error("'src' attribute is missing");
				return;
			}

			var symbol = $(this).attr('sprite-symbol');
			var attributes = getTagAttributes($(this));
      var output;
      var cachedContent;
      var interval;
      var intervalCount = 0;

      var httpRequestImage = function() {

        if (settings.disableCache === false) {
          // track pending image requests so that we avoid duplicate calls
          CACHE[imgUrl] = true;
        }

        $.get(imgUrl, function(response) {

          if (settings.disableCache === false) {
            cacheService.setValue(imgUrl, response);
          }
          
          output = handleSvgResponse(imgUrl, response, symbol, attributes);
          $el.replaceWith(output);

        }, 'text');
      };

      var cacheRequestImage = function(svgContent) {
        output = handleSvgResponse(imgUrl, svgContent, symbol, attributes);
        $el.replaceWith(output);
      };

      if (settings.disableCache === false) {
        cachedContent = cacheService.getValue(imgUrl);
      }

      if (!cachedContent && !CACHE.hasOwnProperty(imgUrl)) {

        // retrieve new content
        httpRequestImage();

      } else if (!cachedContent && CACHE.hasOwnProperty(imgUrl)) {

        // cache request has been made, but response hasn't been cached yet
        
        interval = setInterval(function(){
          cachedContent = cacheService.getValue(imgUrl);

          if (cachedContent) {
            cacheRequestImage(cachedContent.svgContent);
            clearInterval(interval);
          }

          if (intervalCount > 3) {
            httpRequestImage();
            clearInterval(interval);
          }

          intervalCount++;

        }, 5);

      } else {

        cacheRequestImage(cachedContent.svgContent);
      }
		});
	};
}));

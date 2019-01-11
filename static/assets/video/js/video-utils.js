/**
 * @video-utils
 * Utilities for the video player
 *
 * Author: Juan Tabares
 */
(function (document, root, undefined) {
	'use strict';

	/**
	 * Calculate hashcode from string.
	 *
	 * @return  {String}
	 */
	function getHashCode(str) {
		str = str || {};

		var hash = 0,
			i, chr;

		if (str.length === 0) {
			return hash;
		}

		for (i = 0; i < str.length; i++) {
			chr = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}

		return hash;
	}

	/**
	 * Check if the given value is truthy
	 *
	 * @return  {Boolean}
	 */
	function isTrue(str) {
		if (isNullOrWhiteSpace(str)) {
			return false;
		}

		var value = str.toString().toLowerCase();

		return value === '1' || value === 'true';
	}
	/**
	 * Check if the given value is falsy
	 *
	 * @return  {Boolean}
	 */
	function isFalse(str) {
		if (isNullOrWhiteSpace(str)) {
			return true;
		}

		var value = str.toString().toLowerCase();

		return value === '0' || value === 'false';
	}

	/**
	 * Test if the given parameter is empty or contain white spaces.
	 *
	 * @param   {Object}  element  DOM element
	 * @param   {String}  htmlString  html string
	 *
	 * @return  {Boolean}
	 */
	function isNullOrWhiteSpace(str) {
		return (!str || str.length === 0 || /^\s*$/.test(str));
	}

	var namMediaDomain = /media\.nikkoam\.com/i;

	function isNAMDomain(url) {
		return namMediaDomain.test(url);
	}

	/**
	 * Append html string to given element.
	 *
	 * @param   {Object}  element  DOM element
	 * @param   {String}  htmlString  html string
	 *
	 */
	function appendToElement(element, htmlString) {
		var div = document.createElement('div');

		div.innerHTML = htmlString.trim();

		while (div.children.length > 0) {
			element.appendChild(div.children[0]);
		}
	}

	/**
	 * Insert html before given element
	 *
	 * @param   {Object}  element  DOM element
	 * @param   {String}  htmlString  html string
	 *
	 */
	function insertBefore(element, htmlString) {
		var div = document.createElement('div');
		element.insertAdjacentHTML('beforebegin', htmlString);
	}

	/**
	 * Remove element from the DOM
	 *
	 * @param   {Object}  element  DOM element
	 *
	 */
	function removeElement(element) {
		if (element && element.parentNode) {
			element.parentNode.removeChild(element);
		}
	}

	/**
	 * Remove element from the DOM
	 *
	 * @param   {Object}  element  DOM element
	 *
	 */
	function getElementByClassName(className) {
		if (!className) {
			return null;
		}

		var elements = document.getElementsByClassName(className);

		if (!elements.length) {
			return null;
		}

		return elements[0];
	}

	/**
	 * Add the class name to the given element
	 *
	 * @param   {Object}  element  DOM element
	 * @param   {String}  className  name of the class to be added
	 *
	 */
	function addClass(element, className) {
		if (element.classList) {
			element.classList.add(className);
		} else {
			element.className += ' ' + className;
		}
	}

	/**
	 * Remove the class name from the given element
	 *
	 * @param   {Object}  element  DOM element
	 * @param   {String}  className  name of the class to be removed
	 *
	 */
	function removeClass(element, className) {
		if (element.classList) {
			element.classList.remove(className);
		} else {
			element.className = element.className.replace(className, '').trim();
		}
	}

	/**
	 * To be used in replacement function
	 *
	 * @param   {String}   search  expression to be used in the search
	 * @param   {Expression}  searchValue  The value, or regular expression, that will be replaced by options
	 * @param   {Object}  options  object with collection of keys and values
	 *
	 * @return  {Function}
	 */
	function replaceWithOptions(str, searchValue, options) {
		var f = function(x) {
			var key = x.replace(/\{|\}/g, '');
			if (options.hasOwnProperty(key)) {
				return options[key];
			}
			return x;
		}

		return str.replace(searchValue, f);
	}

	/**
	 * Parse a query string and transform into an object
	 * with keys and values
	 *
	 * @param   {String}  obj1  The receiver object to store
	 *
	 * @return  {Object}
	 */
	function getParamsFromUrl(query) {
		var vars = query.split('&');
		var params = {};

		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');

			var key = pair[0].trim().toLowerCase();
			var value = pair[1].trim();

			// If first entry with this name
			if (typeof params[key] === 'undefined') {
				params[key] = decodeURIComponent(value);
				// If second entry with this name
			} else if (typeof params[key] === 'string') {
				var arr = [params[key], decodeURIComponent(value)];
				params[key] = arr;
				// If third or later entry with this name
			} else {
				params[key].push(decodeURIComponent(value));
			}
		}

		return params;
	}

	/**
	 * Assigns properties of the first of the second object to the
	 * first object
	 *
	 * @param   {Object}  obj1  The receiver object to store
	 * @param   {Object}  obj2  The assigning object
	 *
	 * @return  {Object}
	 */
	function assign(obj1, obj2) {
		if (typeof obj1 !== 'object') {
			return obj1;
		}

		obj2 = obj2 || {};

		var o = {};

		for (var key in obj1) {
			o[key] = obj1[key];
		}

		for (var key in obj2) {
			o[key] = obj2[key];
		}

		return o;
	}

	/**
	 * Get a value from localStorage (or empty object if it doesn't exist)
	 *
	 * @param   {String}  key  The local storage key
	 *
	 * @return  {Object}
	 */
	function getLocalStorage(key) {
		return JSON.parse((window.localStorage && window.localStorage.getItem(key)) || '{}')
	}

	/**
	 * Store an object in localStorage
	 *
	 * @param  {String}  key  The local storage key
	 * @param  {Object}  obj  The object to store
	 */
	function setLocalStorage(key, obj) {
		window.localStorage.setItem(key, JSON.stringify(obj));
	}

	/**
	 * Check if current browser is IE related.
	 */
	function isIE() {
		return !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);
	}

	/**
	 * Store an object in localStorage
	 *
	 * @param  {String}  src  The local storage key
	 * @param  {Object}  label  The object to store
	 */
	function getIdGA(src, label) {
		if (isNullOrWhiteSpace(label)) {
			return src.split('/').slice(-2).shift();
		}
		return label;
	}

	/**
	 * Send the video progress to google analytics if available
	 *
	 * @param  {String}  label	 name or id to associate in GA
	 * @param  {Object}  action  action associated with the event
	 */
	function sendGA(label, action) {
		console.log('[Video] sending to GA...');
		if (typeof root.ga === 'function') {
			// report this event to google analytics
			root.ga('send', {
				hitType: 'event',
				eventCategory: 'video',
				eventAction: action || 'unknown',
				eventLabel: label || 'unknown',
				transport: 'beacon',
				nonInteraction: true,
			});
		}
	}

	var videoTypes = {
		'm3u8': 'application/x-mpegURL',
		'mpd': 'application/dash+xml',
		'ogg': 'video/ogg',
		'webm': 'video/webm',
		'mp4': 'video/mp4',
	};

	/**
	 * Get the video type by inspecting the file name of the video.
	 *
	 * @param  {String}  label	 name or id to associate in GA
	 * @param  {Object}  action  action associated with the event
	 */
	function getVideoType(url) {
		var self = this;

		var extension = (url || '.').toLowerCase().split('.').pop();

		if (videoTypes.hasOwnProperty(extension)) {
			return videoTypes[extension];
		} else {
			return 'video/mp4';
		}
	}

	root['VideoUtils'] = {
		getHashCode: getHashCode,
		isTrue: isTrue,
		isFalse: isFalse,
		isNullOrWhiteSpace: isNullOrWhiteSpace,
		isNAMDomain: isNAMDomain,
		getElementByClassName: getElementByClassName,
		appendToElement: appendToElement,
		insertBefore: insertBefore,
		removeElement: removeElement,
		addClass: addClass,
		removeClass: removeClass,
		replaceWithOptions: replaceWithOptions,
		getParamsFromUrl: getParamsFromUrl,
		assign: assign,
		getLocalStorage: getLocalStorage,
		setLocalStorage: setLocalStorage,
		isIE: isIE,
		getIdGA: getIdGA,
		sendGA: sendGA,
		getVideoType: getVideoType
	};

}(document, window));

export const Parallex = function(options = {}) {

  // Set default options
  options.rootElement = options.rootElement;
  options.selector = options.selector || '[data-parallex]';
  options.trigger = options.trigger || 'scroll';
  options.activeClass = 'parallex-active';
  options.freezeClass = 'parallex-freeze'; // disables updates to element transform styles
  options.cssTransitionStyle = options.cssTransitionStyle || false;
  options.speed = options.speed || 5;
  options.autoScrollSpeed = options.autoScrollSpeed || 1;
  options.minActiveBreakpoint = options.minActiveBreakpoint || 0;
  options.breakpoints = options.breakpoints || false;
  options.scrollRestoration = options.scrollRestoration || 'browser'; // options: browser, smoothScroll, disable

  const _ = undefined;
  let isInitialised = false;
  let parallexElements;
  let cachedScrollPosition = 0;
  let scrollDirection;
  let rootElementResizeObserver;

  const controlledState = {
    playing: false,
    autoScrollOffset: 0
  };

  const TRIGGERS = {
    init: 'init',
    destroy: 'destroy',
    scroll: 'scroll',
    controls: 'controls',
    reset: 'reset',
  };

  // Cache offset and speed
  // speed = the rate at which the parallax effect occurs relative to scroll. Determined via value
  // on data attribute or defaults to 5. 
  const speed = [];
  // offset = the amount the element is in the viewport before the parallax effect starts to run. 
  // This happens when activating parallax only if the element is in the viewport (by adding 
  // 'parallax-active' class at a determined threshold - not handled by parallax code).
  const offset = [];

  let supportsPassiveEvents = false;

  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function() {
        supportsPassiveEvents = true;
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}

  // Check which requestAnimationFrame to use. 
  // If none supported - use the onscroll event
  const tick = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  function(callback) { return window.setTimeout(callback, 1000 / 60); 
  };

  function getBreakpoint() {
    if (!options.breakpoints) return false;
    const keys = Object.keys(options.breakpoints);
    const values = Object.values(options.breakpoints);
    const bpVal = Math.max(...values.filter(val => val < window.innerWidth));
    return keys[values.indexOf(bpVal)];
  };
      
  function getTransformStyle(offsetAmountX=0, offsetAmountY=0) {
    return `translate3d(${offsetAmountX}px, ${offsetAmountY}px ,0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)`;
  };

  function setElementStyles(element) {
    element.style.willChange = 'transform';
    element.style.transformStyle = 'preserve-3d';
    if (options.cssTransitionStyle) {
      element.style.transition = options.cssTransitionStyle;
    }
  };

  function setScrollDirection() {
    scrollDirection = cachedScrollPosition > window.scrollY ? 'up' : 'down';
    cachedScrollPosition = window.scrollY;
  };

  function run(elements, trigger) {
   
    setScrollDirection();

    elements.forEach((element, index) => {

      const rect = element.getBoundingClientRect();
      const isActive = element.classList.contains(options.activeClass);
      let isFrozen = element.classList.contains(options.freezeClass);
      const elementStyle = element.style;
      const constraint = element.dataset.parallexConstraint || 10000;
      const explicitlyActivate = element.dataset.parallexExplicitlyActivate || false;

      if (trigger === TRIGGERS.destroy) {
        element.style.removeProperty('transform');
        return;
      }

      // Performance gain - Cache all parallax speeds on init or reEvaluate
      // so that the dom does not need to be accessed repeatedly 
      if (trigger === TRIGGERS.init || trigger === TRIGGERS.reset) {

        const breakpoint = getBreakpoint();

        if (breakpoint) {

          const breakpointCapitalized = breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1);
      
          if (element.dataset[`parallexSpeed${breakpointCapitalized}`]) {
            speed[index] = options.trigger === TRIGGERS.scroll ? 
              -(element.dataset[`parallexSpeed${breakpointCapitalized}`]/10) : 
              element.dataset.parallexSpeed || options.speed
          } else {
            speed[index] = options.trigger === TRIGGERS.scroll ? 
              -((element.dataset.parallexSpeed || options.speed)/10) :
              element.dataset.parallexSpeed || options.speed
          }
        } else {
          speed[index] = options.trigger === TRIGGERS.scroll ? 
            -((element.dataset.parallexSpeed || options.speed)/10) :
            element.dataset.parallexSpeed || options.speed
        }
      }

      // init only //
      if (trigger === TRIGGERS.init) {

        setElementStyles(element);
        
        if (options.trigger === TRIGGERS.scroll) {

          offset[index] = 0;

          // If page loads with scroll position:
          // Freeze all parallax elements above viewport and then remove freeze when they have passed below the viewport
          if (rect.bottom < 0) {
            isFrozen = true;
            element.classList.add(options.freezeClass)
            elementStyle.transform = getTransformStyle();  
          } 
        }
      }

      ////////// SCROLL ACTIONS ///////////////
      /////////////////////////////////////////
      if (options.trigger === TRIGGERS.scroll) {

        if (!isFrozen) {

          const offsetAmount = window.scrollY * speed[index];

          // If item is active (has active class) or is in the viewport or above the viewport.
          // Dont pause parallax when it is above viewport even if inactive as it needs to 
          // retain its offset in order to renter the viewport at the correct position.
          if ((explicitlyActivate && isActive) || (!explicitlyActivate && rect.top < window.innerHeight)) {
            const transformAmount = offsetAmount - offset[index];

            if (Math.abs(transformAmount) <= constraint) {
              elementStyle.transform = getTransformStyle(undefined, transformAmount); 
            }
          } 
          else {
            // Reset any transfrom that is scrolled out of view below the viewport.
            // Keep track of the offsetAmount when not active.
            offset[index] = offsetAmount;
            elementStyle.transform = getTransformStyle(); 
          }

          // reset when reaches top of window
          if (window.scrollY <= 0) {
            offset[index] = 0;
            elementStyle.transform = getTransformStyle(); 
          }
        }
        else if (isFrozen) { 
          // Remove freeze classes when they have passed below the viewport
          if (scrollDirection === 'up') { 

            if (rect.top > window.innerHeight || window.scrollY <= 0) {
              element.classList.remove(options.freezeClass)
              offset[index] = 0;
              elementStyle.transform = getTransformStyle(); 
            }
          } 
        }
      }

      ////////// CONTROLLED SCROLL ACTIONS ///////////////
      ////////////////////////////////////////////////////
      if (options.trigger === TRIGGERS.controls) {

        if (!isFrozen) {
          const offsetAmount = controlledState.autoScrollOffset * speed[index];

          if (isActive) {
            if (Math.abs(offsetAmount <= constraint)) {
              elementStyle.transform = getTransformStyle(undefined, offsetAmount); 
            }
          } 
        }
      }

    })
  };

  function runInsideRAF(event, trigger) {
    tick(() => { run(parallexElements, trigger) });
  };

  function runRAFLoop() {
    run(parallexElements);
    controlledState.autoScrollOffset = controlledState.autoScrollOffset + options.autoScrollSpeed/100;
    if (controlledState.playing) {
      tick(runRAFLoop);
    }
  };

  function reEvaluate() {
    if (window.innerWidth > options.minActiveBreakpoint) {
      if (!isInitialised) {
        init(true);
      } else {
        runInsideRAF(_, TRIGGERS.reset);
      }
    } else {
      if (isInitialised) {
        destroy(true);
      }
    }
  };
  
  function init(hasResizeEventListener=false) {
    parallexElements = (options.rootElement || document).querySelectorAll(options.selector);

    if (parallexElements?.length) {
      if (window.innerWidth > options.minActiveBreakpoint) {

        run(parallexElements, TRIGGERS.init);

        if (options.trigger === TRIGGERS.scroll) {
          window.addEventListener('scroll', runInsideRAF, supportsPassiveEvents ? { passive: true } : false);
        }
        else if (options.trigger === TRIGGERS.controls) {
          if (controlledState.playing) {
            runRAFLoop();
          }
        }

        isInitialised = true;
      }

      // Watch for resizing on either on window or root element
      if (!hasResizeEventListener) {
        if (options.rootElement) {
          rootElementResizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
              reEvaluate();
            })
          })
          rootElementResizeObserver.observe(options.rootElement);
        } 
        else {
          window.addEventListener('resize', reEvaluate);
        }
      }
 
      // When refreshing a page that has been scrolled, the native browser behaviour is
      // to use the cached scroll position to restore the page scroll position after refresh.
      // However, this can cause some bugginess with the parallax images as their positions
      // cannot be accurately determined when the user has not scrolled them into view. 
      // By default any images above the top of the viewport will be 'frozen' until they
      // are scrolled to below the viewport where there position can be reset and recalculated
      // once the user scrolls them into view. This mostly solves the issues but images that 
      // are in the vewport on load can have some jumpiness as there inital position is most
      // likely not accurate. 
      // Other ways around this are:
      // 1. Disable scrollRestoration by setting scrollRestoration value to 'disable'.
      // This will cause the page to always reload at the top.
      // 2. Set scrollRestoration to smoothScroll. 
      // This will cache the scroll position on unload in seesion storage and read it back when
      // reloaded. It will then smoothly scroll to the page position keeping all parallax images
      // in the correct positions. 
      // scrollRestoration is set by default to native browser behaviour. 

      if (options.scrollRestoration === 'disable') {
        window.onunload = function() { 
          window.scrollTo(0,0);
        }
      } 
      else if (options.scrollRestoration === 'smoothScroll') {
        window.onunload = function() { 
          const scrollPosition = window.scrollY;
          window.sessionStorage.setItem('parallexPreviousScroll', scrollPosition);
          window.scrollTo(0,0);
        }

        let previousScrollPosition = window.sessionStorage.getItem('parallexPreviousScroll');

        if (previousScrollPosition) {

          // If url has hash, override previousSrollPosition with hash location.
          if (window.location.hash) {
            const hash = window.location.hash;

            if (hash?.length) {
              const element = document.getElementById(hash.replace('#', ''));

              if (element) {
                const top = element.getBoundingClientRect().top;
                previousScrollPosition = top;
              }
            }
          }
          setTimeout(() => {
            window.scrollTo({
              top: parseInt(previousScrollPosition),
              behavior: 'smooth'
            });
            window.sessionStorage.removeItem('parallexPreviousScroll');
          }, 0);
        }
      } 
    }
  };

  function destroy(retainResizeEventListener=false) {
    if (parallexElements && parallexElements.length > 0) {
      window.removeEventListener('scroll', runInsideRAF);
      window.removeEventListener('scroll', reEvaluate);

      // if using minActiveBreakpoint option:
      // Retain on resize event listener to reactivate if screen size is increased
      if (!retainResizeEventListener) {
        window.removeEventListener('resize', reEvaluate);

        if (rootElementResizeObserver) {
          rootElementResizeObserver.disconnect();
        }
      }

      if (options.rootElement) {
        options.rootElement.removeEventListener('scroll', reEvaluate);
      }

      run(parallexElements, TRIGGERS.destroy);
      isInitialised = false;
    }
  };

  const controls = {
    start() {
      controlledState.playing = true;
      runRAFLoop();
    },
    stop() {
      controlledState.playing = false;
    },
    restart() {
      controlledState.autoScrollOffset = 0;
      if (!controlledState.playing) {
        controlledState.playing = true;
        runRAFLoop();
      }
    }
   };

  return {
    init,
    destroy,
    controls
  };
};






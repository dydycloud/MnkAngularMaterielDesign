(function () {
  angular.module('angularytics', []).provider('Angularytics', function () {
    var eventHandlersNames = ['Google'];
    this.setEventHandlers = function (handlers) {
      if (angular.isString(handlers)) {
        handlers = [handlers];
      }
      eventHandlersNames = [];
      angular.forEach(handlers, function (handler) {
        eventHandlersNames.push(capitalizeHandler(handler));
      });
    };
    var capitalizeHandler = function (handler) {
      return handler.charAt(0).toUpperCase() + handler.substring(1);
    };
    var pageChangeEvent = '$locationChangeSuccess';
    this.setPageChangeEvent = function (newPageChangeEvent) {
      pageChangeEvent = newPageChangeEvent;
    };
    this.$get = [
      '$injector',
      '$rootScope',
      '$location',
      function ($injector, $rootScope, $location) {
        var eventHandlers = [];
        angular.forEach(eventHandlersNames, function (handler) {
          eventHandlers.push($injector.get('Angularytics' + handler + 'Handler'));
        });
        var forEachHandlerDo = function (action) {
          angular.forEach(eventHandlers, function (handler) {
            action(handler);
          });
        };
        var service = {};
        service.init = function () {
        };
        service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
          forEachHandlerDo(function (handler) {
            if (category && action) {
              handler.trackEvent(category, action, opt_label, opt_value, opt_noninteraction);
            }
          });
        };
        service.trackPageView = function (url) {
          forEachHandlerDo(function (handler) {
            if (url) {
              handler.trackPageView(url);
            }
          });
        };
        $rootScope.$on(pageChangeEvent, function () {
          service.trackPageView($location.url());
        });
        return service;
      }
    ];
  });
}());
(function () {
  angular.module('angularytics').factory('AngularyticsConsoleHandler', [
    '$log',
    function ($log) {
      var service = {};
      service.trackPageView = function (url) {
        $log.log('URL visited', url);
      };
      service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
        $log.log('Event tracked', category, action, opt_label, opt_value, opt_noninteraction);
      };
      return service;
    }
  ]);
}());
(function () {
  angular.module('angularytics').factory('AngularyticsGoogleHandler', [
    '$log',
    function ($log) {
      var service = {};
      service.trackPageView = function (url) {
        _gaq.push([
          '_set',
          'page',
          url
        ]);
        _gaq.push([
          '_trackPageview',
          url
        ]);
      };
      service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
        _gaq.push([
          '_trackEvent',
          category,
          action,
          opt_label,
          opt_value,
          opt_noninteraction
        ]);
      };
      return service;
    }
  ]).factory('AngularyticsGoogleUniversalHandler', function () {
    var service = {};
    service.trackPageView = function (url) {
      ga('set', 'page', url);
      ga('send', 'pageview', url);
    };
    service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
      ga('send', 'event', category, action, opt_label, opt_value, { 'nonInteraction': opt_noninteraction });
    };
    return service;
  });
}());
(function () {
  angular.module('angularytics').filter('trackEvent', [
    'Angularytics',
    function (Angularytics) {
      return function (entry, category, action, opt_label, opt_value, opt_noninteraction) {
        Angularytics.trackEvent(category, action, opt_label, opt_value, opt_noninteraction);
        return entry;
      };
    }
  ]);
}());
angular.module('ngAnimateSequence', ['ngAnimate'])

  .factory('$$animateAll', function() {
    return function all(arr, fn) {
      var count = 0;
      for(var i = 0; i < arr.length; i++) {
        arr[i](onChainDone);
      }

      function onChainDone() {
        if(++count == arr.length) fn();
      }
    };
  })

  .provider('$$animateStyler', ['$provide', function($provide) {
    var register = this.register = function(name, factory) {
      $provide.factory(name + 'Styler', factory);
    };

    this.$get = ['$injector', function($injector) {
      register('default', function() {
        return function(element, pre) {
          element.css(pre);
          return function(post, done) {
            element.css(post);
            done();
          }
        };
      });

      return function(name) {
        return $injector.get(name + 'Styler');
      }
    }];
  }])

  .factory('$animateRunner', ['$$animateReflow', '$animate', '$$animateStyler', '$$animateAll', '$timeout',
    function($$animateReflow,   $animate,   $$animateStyler,   $$animateAll,   $timeout) {
      return function(element, options, queue, duration, completeFn) {
        options = options || {};

        var node = element[0];
        var self;
        var index = 0;
        var paused = false;
        var cancelAnimation = angular.noop;

        var styler = angular.isFunction(options.styler)
          ? options.styler
          : angular.isString(options.styler)
          ? $$animateStyler(options.styler)
          : $$animateStyler('default');

        var style = function(element, duration, cssStyles) {
          cssStyles = cssStyles || {};
          var delay = cssStyles.delay;
          delete cssStyles.delay;
          return styler(element, cssStyles, duration, delay);
        };


        completeFn = completeFn || angular.noop;

        function tick(initialTimeout) {
          if (paused) return;

          var step = queue[index++];
          if(!step || !$animate.enabled()) {
            completeFn();
            queue = null;
            return;
          }

          if(angular.isString(step)) {
            self[step].apply(self);
            tick();
            return;
          }

          var time  = step[0];
          var pre   = step[1];
          var post  = step[2];
          var fn    = step[3];

          if(!initialTimeout && index == 1 && time > 0 && time <= 1 && duration > 0) {
            index--;
            $timeout(function() {
              tick(true);
            }, time * duration, false);
            return;
          }

          var animationDuration = time;
          if(duration > 0 && time <= 1) { //Keyframes
            var nextEntry = queue[index];
            var next = angular.isArray(nextEntry) ? nextEntry[0] : 1;
            if(next <= 1) {
              animationDuration = (next - time) * duration;
            }
          }

          var postStyle = style(element, animationDuration, pre);

          accumulatedStyles = angular.extend(accumulatedStyles, pre);
          accumulatedStyles = angular.extend(accumulatedStyles, post);

          $$animateReflow(function() {
            $$animateAll([
              function(done) { postStyle(post || {}, done); },
              function(done) {
                cancelAnimation = fn(element, animationDuration, done) || angular.noop;
              }
            ], tick);
          });

          return self;
        }

        var startingClassName = node.className;
        var accumulatedStyles = {};

        return self = {
          revertStyles : function() {
            angular.forEach(accumulatedStyles, function(_, prop) {
              node.style.removeProperty(prop);
            });
            accumulatedStyles = {};
            return this;
          },

          revertClasses : function() {
            node.className = startingClassName;
            return this;
          },

          next : function() {
            cancelAnimation();
            return tick();
          },

          redo : function() {
            cancelAnimation();
            index--;
            return tick();
          },

          run : function() {
            if (paused) {
              paused = false;
              cancelAnimation();
            }
            return tick();
          },

          pause : function() {
            paused = true;
            cancelAnimation();
            return self;
          },

          restart : function() {
            cancelAnimation();
            index = 0;

            return tick();
          }

        };
      }
    }])

  .factory('$animateSequence', ['$animate', '$animateRunner', '$sniffer',
    function($animate,   $animateRunner,   $sniffer) {
      return function(options) {
        var self, queue = [];

        return self = {
          run : function(element, duration, completeFn) {
            return $animateRunner(element, options, queue, duration, completeFn).next();
          },

          then : function(fn) {
            return addToChain(0, null, null, fn);
          },

          animate : function(preOptions, postOptions, time ) {
            if (arguments.length < 3) {
              postOptions = preOptions;
              preOptions  = {};
            }
            return addToChain(time || postOptions.duration, preOptions, postOptions, function(_, duration, done) {
              done();
            });
          },

          revertStyles : function() {
            queue.push('revertStyles');
            return self;
          },

          revertClasses : function() {
            queue.push('revertClasses');
            return self;
          },

          revertElement : function() {
            return this.revertStyles().revertClasses();
          },

          enter : function(parent, after, preOptions, postOptions, time ) {
            return addToChain(time, preOptions, postOptions, function(element, duration, done) {
              return $animate.enter(element, parent, after, done);
            });
          },

          move : function(parent, after, preOptions, postOptions, time ) {
            return addToChain(time, preOptions, postOptions, function(element, duration, done) {
              return $animate.move(element, parent, after, done);
            });
          },

          leave : function(preOptions, postOptions, time ) {
            return addToChain(time, preOptions, postOptions, function(element, duration, done) {
              return $animate.leave(element, done);
            });
          },

          addClass : function(className, preOptions, postOptions, time ) {
            return addToChain(time, preOptions, postOptions, function(element, duration, done) {
              return $animate.addClass(element, className, done);
            });
          },

          removeClass : function(className, preOptions, postOptions, time ) {
            return addToChain(time, preOptions, postOptions, function(element, duration, done) {
              return $animate.removeClass(element, className, done);
            });
          },

          setClass : function(add, remove, preOptions, postOptions, time ) {
            return addToChain(time, preOptions, postOptions, function(element, duration, done) {
              return $animate.setClass(element, add, remove, done)
            });
          }

        };

        /**
         * Append chain step into queue
         * @returns {*} this
         */
        function addToChain(time, pre, post, fn) {
          queue.push([time || 0, addSuffix(pre), addSuffix(post), fn]);
          queue = queue.sort(function(a,b) {
            return a[0] > b[0];
          });
          return self;
        };

        /**
         * For any positional fields, ensure that a `px` suffix
         * is provided.
         * @param target
         * @returns {*}
         */
        function addSuffix(target) {
          var styles = 'top left right bottom ' +
            'x y width height ' +
            'border-width border-radius ' +
            'margin margin-top margin-bottom margin-left margin-right ' +
            'padding padding-left padding-right padding-top padding-bottom'.split(' ');

          angular.forEach(target, function(val, key) {
            var isPositional = styles.indexOf(key) > -1;
            var hasPx        = String(val).indexOf('px') > -1;

            if (isPositional && !hasPx) {
              target[key] = val + 'px';
            }
          });

          return target;
        }
      };
    }]);

angular.module('ngAnimateStylers', ['ngAnimateSequence'])

  .config(['$$animateStylerProvider', function($$animateStylerProvider)
  {
    //JQUERY
    $$animateStylerProvider.register('jQuery', function() {
      return function(element, pre, duration, delay) {
        delay = delay || 0;
        element.css(pre);
        return function(post, done) {
          element.animate(post, duration, null, done);
        }
      };
    });

    //NOT WORKING
    $$animateStylerProvider.register('webAnimations', function() {
      return function(element, pre, duration, delay) {
        delay = delay || 0;
        duration = duration || 1000;
        element.css(pre);
        return function(post, done) {
          var animation = element[0].animate({ 'border-width' : '100px'}, 5000);
          //player.onfinish = done;
        }
      };
    });

    // Greensock Animation Platform (GSAP)
    $$animateStylerProvider.register('gsap', function() {
      return function(element, pre, duration, delay) {
        var styler = TweenMax || TweenLite;

        if ( !styler) {
          throw new Error("GSAP TweenMax or TweenLite is not defined for use within $$animationStylerProvider.");
        }


        return function(post, done) {
          styler.fromTo(
            element,
            (duration || 0)/1000,
            pre || { },
            angular.extend( post, {onComplete:done, delay: (delay || 0)/1000} )
          );
        }
      };
    });


  }]);

/*!
 * Angular Material Design
 * WIP Banner
 */
(function(){
angular.module('ngMaterial', [ 'ng', 'ngAnimate', 'material.services', "material.components.button","material.components.card","material.components.checkbox","material.components.content","material.components.dialog","material.components.form","material.components.icon","material.components.list","material.components.radioButton","material.components.scrollHeader","material.components.sidenav","material.components.slider","material.components.tabs","material.components.toast","material.components.toolbar","material.components.whiteframe"]);
angular.module('material.animations', ['ngAnimateStylers', 'ngAnimateSequence', 'ngAnimate'])

  .service('materialEffects', ['$animateSequence', 'canvasRenderer', function ($animateSequence, canvasRenderer) {

    var styler = angular.isDefined( window.TweenMax || window.TweenLite ) ? 'gsap'   :
                angular.isDefined( window.jQuery ) ? 'jQuery' : 'default';

    // Publish API for effects...
    return {
      ripple : rippleWithJS,   // rippleWithCSS,
      ink : animateInk
    }

    // **********************************************************
    // Private API Methods
    // **********************************************************

    /**
     * Use the canvas animator to render the ripple effect(s).
     */
    function rippleWithJS( canvas, options )
    {
      return canvasRenderer.ripple( canvas, options);
    }


    /**
     * Build the `ripple` CSS animation sequence and apply it to the specified
     * target element
     */
    function rippleWithCSS( element, config ) {
      var from = { left: config.x, top: config.y, opacity: config.opacity },
          to   = { 'border-width': config.d, 'margin-top': -config.d, 'margin-left': -config.d };

      var runner = $animateSequence({ styler: styler })
                      .addClass('ripple', from,  to )
                      .animate({ opacity: 0, duration: safeVelocity(config.fadeoutVelocity || 0.75) })
                      .revertElement();

      return runner.run(element, safeDuration(config.duration || 550));
    }

    /**
     * Make instance of a reusable sequence and
     * auto-run the sequence on the element (if defined)
     * @param styles
     * @param element
     * @param duration
     * @returns {*}
     */
    function animateInk(element, styles, duration ) {
      var sequence = $animateSequence({ styler: styler })
        .animate( {}, styles, safeDuration(duration || 350) );

      return angular.isDefined(element) ? sequence.run(element) : sequence;
    }

    // **********************************************************
    // Utility Methods
    // **********************************************************

    /**
     * Support values such as 0.65 secs or 650 msecs
     */
    function safeDuration(value) {
      var duration = isNaN(value) ? 0 : Number(value);
      return (duration < 1.0) ? (duration * 1000) : duration;
    }

    /**
     * Convert all values to decimal;
     * eg 150 msecs -> 0.15sec
     */
    function safeVelocity(value) {
      var duration = isNaN(value) ? 0 : Number(value);
      return (duration > 100) ? (duration / 1000) :
        (duration > 10 ) ? (duration / 100) :
          (duration > 1  ) ? (duration / 10) : duration;
    }

  }])
  .directive('materialRipple', ['materialEffects', '$interpolate', function (materialEffects, $interpolate) {
    return {
      restrict: 'E',
      compile: compileWithCanvas
    };

    /**
     * Use Javascript and Canvas to render ripple effects
     *
     * Note: attribute start="" has two (2) options: `center` || `pointer`; which
     * defines the start of the ripple center.
     *
     * @param element
     * @returns {Function}
     */
    function compileWithCanvas( element, attrs ) {
      var options  = calculateOptions();
      var tag =
        '<canvas ' +
             'class="material-ripple-canvas {{classList}}"' +
             'style="top:{{top}}; left:{{left}}" >' +
        '</canvas>';

      element.replaceWith(
        angular.element( $interpolate(tag)(options) )
      );

      return function( scope, element ){
        var parent = element.parent();
        var rippler = materialEffects.ripple( element[0], options );


        // Configure so ripple wave starts a mouseUp location...
        parent.on('mousedown', onStartRipple);


        // **********************************************************
        // Mouse EventHandlers
        // **********************************************************

        function onStartRipple(e) {

          if ( inkEnabled( element.scope() )) {

            rippler.onMouseDown( options.forceToCenter ? null : localToCanvas(e) );
            parent.on('mouseup', onFinishRipple )
          }
        }

        function onFinishRipple( e ) {
          parent.off('mouseup', onFinishRipple);
          rippler.onMouseUp( e );
        }

        // **********************************************************
        // Utility Methods
        // **********************************************************

        /**
         * Convert the mouse down coordinates from `parent` relative
         * to `canvas` relative; needed since the event listener is on
         * the parent [e.g. tab element]
         */
        function localToCanvas(e)
        {
          var canvas = element[0].getBoundingClientRect();

          return  {
            x : e.clientX - canvas.left,
            y : e.clientY - canvas.top
          };
        }

        /**
         * Check scope chain for `inkEnabled` or `disabled` flags...
         */
        function inkEnabled(scope) {
          return angular.isUndefined(scope) ? true :
              angular.isDefined(scope.disabled) ? !scope.disabled :
              angular.isDefined(scope.inkEnabled) ? scope.inkEnabled : true;
        }

      }

      function calculateOptions()
      {
        return angular.mixin( getBounds(element), {
          forceToCenter : (attrs.start == "center"),
          classList : (attrs.class || ""),
          opacityDecayVelocity : getFloatValue( attrs, "opacityDecayVelocity" ),
          initialOpacity : getFloatValue( attrs, "initialOpacity" )
        });

        function getBounds(element) {
          var node = element[0];
          var styles  =  node.ownerDocument.defaultView.getComputedStyle( node, null ) || { };

          return  {
            left : (styles.left == "auto" || !styles.left) ? "0px" : styles.left,
            top : (styles.top == "auto" || !styles.top) ? "0px" : styles.top,
            width : getValue( styles, "width" ),
            height : getValue( styles, "height" )
          };
        }

        function getFloatValue( map, key, defaultVal )
        {
          return angular.isDefined( map[key] ) ? +map[key] : defaultVal;
        }

        function getValue( map, key, defaultVal )
        {
          var val = map[key];
          return (angular.isDefined( val ) && (val !== ""))  ? map[key] : defaultVal;
        }
      }

    }


    /**
     * Use CSS and Div element to animate a ripple effect
     * @param element
     * @returns {Function}
     */
    function compileWithDiv( element ) {

      element.after(angular.element('<div class="material-ripple-cursor"></div>'));
      element.remove();

      return function( scope, element, attrs ){
        var parent = element.parent();
        var parentNode = parent[0];

        // Configure so ripple wave starts a mouseUp location...
        parent.on('click', function showRipple(e) {
          if ( inkEnabled( element.scope() )) {
            var settings = angular.extend({}, attrs, {
              x: e.offsetX,
              y: e.offsetY,
              d: Math.max(parentNode.offsetWidth - e.offsetX, e.offsetX),
              tl: -Math.max(parentNode.offsetWidth - e.offsetX, e.offsetX),
              opacity: attrs.rippleOpacity || 0.6
            });

            // Perform ripple effect on `elCursor` element
            materialEffects.ripple(element, settings);
          }
        });

        /**
         * Check scope chain for `inkEnabled` or `disabled` flags...
         */
        function inkEnabled( scope ){
          return angular.isUndefined( scope )            ? true             :
            angular.isDefined( scope.inkEnabled )   ? scope.inkEnabled :
              angular.isDefined( scope.disabled     ) ? !scope.disabled  : true;
        }

      }
    }

  }]);

angular.module('material.animations')
    /**
     * Port of the Polymer Paper-Ripple code
     *
     * @group Paper Elements
     * @element paper-ripple
     * @homepage github.io
     */
      .service('canvasRenderer', function() {

           var pow = Math.pow;
           var now = Date.now;
           var Rippler = RipplerClazz();

           if (window.performance && performance.now) {
             now = performance.now.bind(performance);
           }

           angular.mixin = function (dst) {
             angular.forEach(arguments, function(obj) {
               if (obj !== dst) {
                 angular.forEach(obj, function(value, key) {
                   // Only mixin if destination value is undefined
                   if ( angular.isUndefined(dst[key]) )
                   {
                    dst[key] = value;
                   }
                 });
               }
             });
             return dst;
           };



    return {

             /**
              * API to render ripple animations
              */
             ripple : function( canvas, options)
             {
               var animator = new Rippler( canvas,  options );

               // Simple API to start and finish ripples based on mouse/touch events
               return {
                 onMouseDown : angular.bind(animator, animator.onMouseDown),
                 onMouseUp : angular.bind(animator, animator.onMouseUp)
               };
             }

           };

          // **********************************************************
          // Rippler Class
          // **********************************************************

          function RipplerClazz() {

            /**
             *  Rippler creates a `paper-ripple` which is a visual effect that other quantum paper elements can
             *  use to simulate a rippling effect emanating from the point of contact.  The
             *  effect can be visualized as a concentric circle with motion.
             */
            function Rippler( canvas, options ) {


              var defaults = {
                /**
                 * The initial opacity set on the wave.
                 *
                 * @attribute initialOpacity
                 * @type number
                 * @default 0.25
                 */
                initialOpacity : 0.25,

                /**
                 * How fast (opacity per second) the wave fades out.
                 *
                 * @attribute opacityDecayVelocity
                 * @type number
                 * @default 0.8
                 */
                opacityDecayVelocity : 0.8,

                /**
                 *
                 */
                backgroundFill : true,

                /**
                 *
                 */
                pixelDensity : 1
              };



              this.canvas = canvas;
              this.waves  = [];

              return angular.extend(this, angular.mixin(options, defaults));
            };

            /**
             *
             */
            Rippler.prototype.onMouseDown = function ( startAt ) {

              var canvas = this.setupCanvas( this.canvas );
              var wave = createWave(this.canvas);

              var width = canvas.width / this.pixelDensity; // Retina canvas
              var height = canvas.height / this.pixelDensity;

              // Auto center ripple if startAt is not defined...
              startAt = startAt || { x : Math.round(width/2), y:Math.round(height/2) };

              wave.isMouseDown = true;
              wave.tDown = 0.0;
              wave.tUp = 0.0;
              wave.mouseUpStart = 0.0;
              wave.mouseDownStart = now();
              wave.startPosition = startAt;
              wave.containerSize = Math.max(width, height);
              wave.maxRadius = distanceFromPointToFurthestCorner(wave.startPosition, {w: width, h: height});

              if (this.canvas.classList.contains("recenteringTouch")) {
                  wave.endPosition = {x: width / 2,  y: height / 2};
                  wave.slideDistance = dist(wave.startPosition, wave.endPosition);
              }

              this.waves.push(wave);

              this.cancelled = false;

              requestAnimationFrame(this._loop);
            };

            /**
             *
             */
            Rippler.prototype.onMouseUp = function () {
              for (var i = 0; i < this.waves.length; i++) {
                // Declare the next wave that has mouse down to be mouse'ed up.
                var wave = this.waves[i];
                if (wave.isMouseDown) {
                  wave.isMouseDown = false
                  wave.mouseUpStart = now();
                  wave.mouseDownStart = 0;
                  wave.tUp = 0.0;
                  break;
                }
              }
              this._loop && requestAnimationFrame(this._loop);
            };

            /**
             *
             */
            Rippler.prototype.cancel = function () {
              this.cancelled = true;
              return this;
            };

            /**
             *
             */
            Rippler.prototype.animate = function (ctx) {
              // Clear the canvas
              ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

              var deleteTheseWaves = [];
              // The oldest wave's touch down duration
              var longestTouchDownDuration = 0;
              var longestTouchUpDuration = 0;
              // Save the last known wave color
              var lastWaveColor = null;
              // wave animation values
              var anim = {
                initialOpacity: this.initialOpacity,
                opacityDecayVelocity: this.opacityDecayVelocity,
                height: ctx.canvas.height,
                width: ctx.canvas.width
              }

              for (var i = 0; i < this.waves.length; i++) {
                var wave = this.waves[i];

                if (wave.mouseDownStart > 0) {
                  wave.tDown = now() - wave.mouseDownStart;
                }
                if (wave.mouseUpStart > 0) {
                  wave.tUp = now() - wave.mouseUpStart;
                }

                // Determine how long the touch has been up or down.
                var tUp = wave.tUp;
                var tDown = wave.tDown;
                longestTouchDownDuration = Math.max(longestTouchDownDuration, tDown);
                longestTouchUpDuration = Math.max(longestTouchUpDuration, tUp);

                // Obtain the instantenous size and alpha of the ripple.
                var radius = waveRadiusFn(tDown, tUp, anim);
                var waveAlpha =  waveOpacityFn(tDown, tUp, anim);
                var waveColor = cssColorWithAlpha(wave.waveColor, waveAlpha);
                lastWaveColor = wave.waveColor;

                // Position of the ripple.
                var x = wave.startPosition.x;
                var y = wave.startPosition.y;

                // Ripple gravitational pull to the center of the canvas.
                if (wave.endPosition) {

                  var translateFraction = waveGravityToCenterPercentageFn(tDown, tUp, wave.maxRadius);

                  // This translates from the origin to the center of the view  based on the max dimension of
                  var translateFraction = Math.min(1, radius / wave.containerSize * 2 / Math.sqrt(2) );

                  x += translateFraction * (wave.endPosition.x - wave.startPosition.x);
                  y += translateFraction * (wave.endPosition.y - wave.startPosition.y);
                }

                // If we do a background fill fade too, work out the correct color.
                var bgFillColor = null;
                if (this.backgroundFill) {
                  var bgFillAlpha = waveOuterOpacityFn(tDown, tUp, anim);
                  bgFillColor = cssColorWithAlpha(wave.waveColor, bgFillAlpha);
                }

                // Draw the ripple.
                drawRipple(ctx, x, y, radius, waveColor, bgFillColor);

                // Determine whether there is any more rendering to be done.
                var maximumWave = waveAtMaximum(wave, radius, anim);
                var waveDissipated = waveDidFinish(wave, radius, anim);
                var shouldKeepWave = !waveDissipated || maximumWave;
                var shouldRenderWaveAgain = !waveDissipated && !maximumWave;

                if (!shouldKeepWave || this.cancelled) {
                  deleteTheseWaves.push(wave);
                }
              }

              if (shouldRenderWaveAgain) {
                requestAnimationFrame(this._loop);
              }

              for (var i = 0; i < deleteTheseWaves.length; ++i) {
                var wave = deleteTheseWaves[i];
                removeWaveFromScope(this, wave);
              }

              if (!this.waves.length) {
                // If there is nothing to draw, clear any drawn waves now because
                // we're not going to get another requestAnimationFrame any more.
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                this._loop = null;
              }

              return this;
            };


            Rippler.prototype.adjustBounds = function( canvas )
            {
              // Default to parent container to define bounds
              var self = this,
                src = canvas.parentNode.getBoundingClientRect(),  // read-only
                bounds = { width : src.width, height: src.height };

              angular.forEach("width height".split(" "), function( style ) {
                var value = (self[style] != "auto") ? self[style] : undefined;

                // Allow CSS to explicitly define bounds (instead of parent container
                if ( angular.isDefined(value ) ) {
                  bounds[style] = sanitizePosition( value );
                  canvas.setAttribute(style, bounds[style] * self.pixelDensity + "px");
                }

              });

              // NOTE: Modified from polymer implementation
              canvas.setAttribute('width', bounds.width * this.pixelDensity + "px");
              canvas.setAttribute('height', bounds.height * this.pixelDensity + "px");


                function sanitizePosition( style )
                {
                  var val = style.replace('px','');
                  return val;
                }

              return canvas;
            }


            /**
             * Resize the canvas to fill the parent's dimensions...
             */
            Rippler.prototype.setupCanvas = function ( canvas ) {

              var ctx = this.adjustBounds(canvas).getContext('2d');
              ctx.scale(this.pixelDensity, this.pixelDensity);
              
              if (!this._loop) {
                this._loop = this.animate.bind(this, ctx);
              }
              return canvas;
            };


            return Rippler;

          };




          // **********************************************************
          // Private Wave Methods
          // **********************************************************



          /**
           *
           */
          function waveRadiusFn(touchDownMs, touchUpMs, anim) {
            // Convert from ms to s.
            var waveMaxRadius = 150;
            var touchDown = touchDownMs / 1000;
            var touchUp = touchUpMs / 1000;
            var totalElapsed = touchDown + touchUp;
            var ww = anim.width, hh = anim.height;
            // use diagonal size of container to avoid floating point math sadness
            var waveRadius = Math.min(Math.sqrt(ww * ww + hh * hh), waveMaxRadius) * 1.1 + 5;
            var duration = 1.1 - .2 * (waveRadius / waveMaxRadius);
            var tt = (totalElapsed / duration);

            var size = waveRadius * (1 - Math.pow(80, -tt));
            return Math.abs(size);
          }

          /**
           *
           */
          function waveOpacityFn(td, tu, anim) {
            // Convert from ms to s.
            var touchDown = td / 1000;
            var touchUp = tu / 1000;
            var totalElapsed = touchDown + touchUp;

            if (tu <= 0) {  // before touch up
              return anim.initialOpacity;
            }
            return Math.max(0, anim.initialOpacity - touchUp * anim.opacityDecayVelocity);
          }

          /**
           *
           */
          function waveOuterOpacityFn(td, tu, anim) {
            // Convert from ms to s.
            var touchDown = td / 1000;
            var touchUp = tu / 1000;

            // Linear increase in background opacity, capped at the opacity
            // of the wavefront (waveOpacity).
            var outerOpacity = touchDown * 0.3;
            var waveOpacity = waveOpacityFn(td, tu, anim);
            return Math.max(0, Math.min(outerOpacity, waveOpacity));
          }

          /**
           *
           */
          function waveGravityToCenterPercentageFn(td, tu, r) {
            // Convert from ms to s.
            var touchDown = td / 1000;
            var touchUp = tu / 1000;
            var totalElapsed = touchDown + touchUp;

            return Math.min(1.0, touchUp * 6);
          }

          /**
           * Determines whether the wave should be completely removed.
           */
          function waveDidFinish(wave, radius, anim) {
            var waveMaxRadius = 150;
            var waveOpacity = waveOpacityFn(wave.tDown, wave.tUp, anim);
            // If the wave opacity is 0 and the radius exceeds the bounds
            // of the element, then this is finished.
            if (waveOpacity < 0.01 && radius >= Math.min(wave.maxRadius, waveMaxRadius)) {
              return true;
            }
            return false;
          };

          /**
           *
           */
          function waveAtMaximum(wave, radius, anim) {
            var waveMaxRadius = 150;
            var waveOpacity = waveOpacityFn(wave.tDown, wave.tUp, anim);
            if (waveOpacity >= anim.initialOpacity && radius >= Math.min(wave.maxRadius, waveMaxRadius)) {
              return true;
            }
            return false;
          }

          /**
           *
           */
          function createWave(elem) {
            var elementStyle = window.getComputedStyle(elem);

            var wave = {
              waveColor: elementStyle.color,
              maxRadius: 0,
              isMouseDown: false,
              mouseDownStart: 0.0,
              mouseUpStart: 0.0,
              tDown: 0,
              tUp: 0
            };
            return wave;
          }

          /**
           *
           */
          function removeWaveFromScope(scope, wave) {
            if (scope.waves) {
              var pos = scope.waves.indexOf(wave);
              scope.waves.splice(pos, 1);
            }
          };

          /**
           *
           */
          function drawRipple(ctx, x, y, radius, innerColor, outerColor) {
            if (outerColor) {
              ctx.fillStyle = outerColor || 'rgba(252, 252, 158, 1.0)';
              ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
            }
            ctx.beginPath();

            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = innerColor || 'rgba(252, 252, 158, 1.0)';
            ctx.fill();

            //ctx.closePath();
          }


          /**
           *
           */
          function cssColorWithAlpha(cssColor, alpha) {
            var parts = cssColor ? cssColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/) : null;
            if (typeof alpha == 'undefined') {
              alpha = 1;
            }
            if (!parts) {
              return 'rgba(255, 255, 255, ' + alpha + ')';
            }
            return 'rgba(' + parts[1] + ', ' + parts[2] + ', ' + parts[3] + ', ' + alpha + ')';
          }

          /**
           *
           */
          function dist(p1, p2) {
            return Math.sqrt(pow(p1.x - p2.x, 2) + pow(p1.y - p2.y, 2));
          }

          /**
           *
           */
          function distanceFromPointToFurthestCorner(point, size) {
            var tl_d = dist(point, {x: 0, y: 0});
            var tr_d = dist(point, {x: size.w, y: 0});
            var bl_d = dist(point, {x: 0, y: size.h});
            var br_d = dist(point, {x: size.w, y: size.h});
            return Math.max(tl_d, tr_d, bl_d, br_d);
          }

        });






/**
 * @ngdoc overview
 * @name material.components.button
 *
 * @description
 * Button components.
 */
angular.module('material.components.button', []);

/**
 * @ngdoc overview
 * @name material.components.card
 *
 * @description
 * Card components.
 */
angular.module('material.components.card', [])
  .directive('materialCard', [ materialCardDirective ]);

function materialCardDirective() {
  return {
    restrict: 'E',
    link: function($scope, $element, $attr) {
    }
  }
}

/**
 * @ngdoc module
 * @name material.components.checkbox
 * @description Checkbox module!
 */
angular.module('material.components.checkbox', [])
  .directive('materialCheckbox', [ materialCheckboxDirective ]);

/**
 * @ngdoc directive
 * @name materialCheckbox
 * @module material.components.checkbox
 * @restrict E
 *
 * @description
 * Checkbox directive!
 *
 * @param {expression=} ngModel An expression to bind this checkbox to.
 */
function materialCheckboxDirective() {

  var CHECKED_CSS = 'material-checked';

  return {
    restrict: 'E',
    scope: true,
    transclude: true,
    template: '<div class="material-container">' +
                '<div class="material-icon"></div>' +
                '<material-ripple start="center" class="circle" material-checked="{{ checked }}"></material-ripple>' +
              '</div>' +
              '<div ng-transclude class="material-label"></div>',
    link: link
  };

  // **********************************************************
  // Private Methods
  // **********************************************************

  function link(scope, element, attr) {
    var input = element.find('input');
    var ngModelCtrl = angular.element(input).controller('ngModel');
    scope.checked = false;

    if(!ngModelCtrl || input[0].type !== 'checkbox') return;

    // watch the ng-model $viewValue
    scope.$watch(
      function () { return ngModelCtrl.$viewValue; },
      function () {
        scope.checked = input[0].checked;

        element.attr('aria-checked', scope.checked);
        if(scope.checked) {
          element.addClass(CHECKED_CSS);
        } else {
          element.removeClass(CHECKED_CSS);
        }
      }
    );

    // add click listener to directive element to manually
    // check the inner input[checkbox] and set $viewValue
    var listener = function(ev) {
      scope.$apply(function() {
        input[0].checked = !input[0].checked;
        ngModelCtrl.$setViewValue(input[0].checked, ev && ev.type);
      });
    };
    element.on('click', listener);

  }

}



/**
 * @ngdoc overview
 * @name material.components.content
 *
 * @description
 * Scrollable content
 */
angular.module('material.components.content', [
  'material.services.registry'
])

.controller('$materialContentController', ['$scope', '$element', '$attrs', '$materialComponentRegistry', materialContentController])
.factory('$materialContent', ['$materialComponentRegistry', materialContentService])
.directive('materialContent', [materialContentDirective])

function materialContentController($scope, $element, $attrs, $materialComponentRegistry) {
  $materialComponentRegistry.register(this, $attrs.componentId || 'content');

  this.getElement = function() {
    return $element;
  };
}

function materialContentService($materialComponentRegistry) {
  return function(handle) {
    var instance = $materialComponentRegistry.get(handle);
    if(!instance) {
      $materialComponentRegistry.notFoundError(handle);
    }
    return instance;
  };
}


function materialContentDirective() {
  return {
    restrict: 'E',
    transclude: true,
    template: '<div class="material-content" ng-transclude></div>',
    controller: '$materialContentController',
    link: function($scope, $element, $attr) {
    }
  }
}

angular.module('material.components.dialog', ['material.services.popup'])
  /**
   * @ngdoc service
   * @name $materialDialog
   * @module material.components.dialog
   */
  .factory('$materialDialog', [
    '$timeout',
    '$materialPopup',
    '$rootElement',
    NgmDialogService
  ]);

function NgmDialogService($timeout, $materialPopup, $rootElement) {
  var recentDialog;

  return showDialog;

  /**
   * TODO fully document this
   * Supports all options from $materialPopup, in addition to `duration` and `position`
   */
  function showDialog(options) {
    options = angular.extend({
      // How long to keep the dialog up, milliseconds
      duration: 3000,
      appendTo: $rootElement,
      clickOutsideToClose: true,
      // Supports any combination of these class names: 'bottom top left right fit'. 
      // Also supports all options from $materialPopup
      transformTemplate: function(template) {
        return '<material-dialog>' + template + '</material-dialog>';
      }
    }, options || {});

    recentDialog && recentDialog.then(function(destroyDialog) {
      destroyDialog();
    });

    recentDialog = $materialPopup(options).then(function(dialog) {
      // Controller will be passed a `$hideDialog` function
      dialog.locals.$hideDialog = destroyDialog;
      dialog.enter(function() {
        dialog.element.on('click', onElementClick);
        $rootElement.on('keyup', onRootElementKeyup);
      });

      return destroyDialog;

      function destroyDialog() {
        dialog.element.off('click', onElementClick);
        $rootElement.off('keyup', onRootElementKeyup);
        dialog.destroy();
      }
      function onRootElementKeyup(e) {
        if (e.keyCode == 27) {
          $timeout(destroyDialog);
        }
      }
      function onElementClick(e) {
        //Close the dialog if click was outside the container
        if (e.target === dialog.element[0]) {
          $timeout(destroyDialog);
        }
      }
    });

    return recentDialog;
  }
}

angular.module('material.components.form', [])

.directive('materialInputGroup', [materialInputGroupDirective]);

function materialInputGroupDirective() {
  return {
    restrict: 'C',
    link: function($scope, $element, $attr) {
      // Grab the input child, and just do nothing if there is no child
      var input = $element[0].querySelector('input');
      if(!input) { return; }

      input = angular.element(input);
      var ngModelCtrl = input.controller('ngModel');

      // When the input value changes, check if it "has" a value, and 
      // set the appropriate class on the input group
      if (ngModelCtrl) {
        $scope.$watch(
          function() { return ngModelCtrl.$viewValue; },
          onInputChange
        );
      }
      input.on('input', onInputChange);

      // When the input focuses, add the focused class to the group
      input.on('focus', function(e) {
        $element.addClass('material-input-focused');
      });
      // When the input blurs, remove the focused class from the group
      input.on('blur', function(e) {
        $element.removeClass('material-input-focused');
      });

      function onInputChange() {
        $element.toggleClass('material-input-has-value', !!input.val());
      }
    }
  };
}

angular.module('material.components.icon', [])
  .directive('materialIcon', [ materialIconDirective ]);

function materialIconDirective() {
  return {
    restrict: 'E',
    template: '<object class="material-icon"></object>',
    compile: function(element, attr) {
      var object = angular.element(element[0].children[0]);
      if(angular.isDefined(attr.icon)) {
        object.attr('data', attr.icon);
      }
    }
  };
}

angular.module('material.components.list', [])

.directive('materialList', [materialListDirective])
.directive('materialItem', [materialItemDirective]);

/**
 * @ngdoc directive
 * @name material.components.list.directive:material-list
 * @restrict E
 *
 * @description
 * materialList is a list container for material-items
 * @example
 * <material-list>
    <material-item>
      <div class="material-tile-left">
      </div>
      <div class="material-tile-content">
        <h2>Title</h2>
        <h3>Subtitle</h3>
        <p>
          Content
        </p>
      </div>
      <div class="material-tile-right">
      </div>
    </material-item>
 * </material-list>
 */
function materialListDirective() {
  return {
    restrict: 'E',
    link: function($scope, $element, $attr) {
    }
  }
}

/**
 * @ngdoc directive
 * @name material.components.list.directive:material-item
 * @restrict E
 *
 * @description
 * materialItem is a list item
 */
function materialItemDirective() {
  return {
    restrict: 'E',
    link: function($scope, $element, $attr) {
    }
  }
}


/**
 * @ngdoc module
 * @name material.components.radioButton
 * @description radioButton module!
 */
angular.module('material.components.radioButton', [])
  .directive('materialRadioButton', [ materialRadioButtonDirective ])
  .directive('materialRadioGroup', [ materialRadioGroupDirective ]);


/**
 * @ngdoc directive
 * @name materialRadioButton
 * @module material.components.radioButton
 * @restrict E
 *
 * @description
 * radioButton directive!
 *
 * @param {expression=} ngModel An expression to bind this radioButton to.
 */
function materialRadioButtonDirective() {

  var CHECKED_CSS = 'material-checked';

  return {
    restrict: 'E',
    require: '^materialRadioGroup',
    scope: true,
    transclude: true,
    template: '<div class="material-container">' +
                '<material-ripple start="center" class="circle" material-checked="{{ checked }}"></material-ripple>' +
                '<div class="material-off"></div>' +
                '<div class="material-on"></div>' +
              '</div>' +
              '<div ng-transclude class="material-label"></div>',
    link: link
  };

  // **********************************************************
  // Private Methods
  // **********************************************************

  function link(scope, element, attr, rgCtrl) {
    var input = element.find('input');
    var ngModelCtrl = angular.element(input).controller('ngModel');
    scope.checked = false;

    if(!ngModelCtrl || input[0].type !== 'radio') return;

    // the radio group controller decides if this
    // radio button should be checked or not
    scope.check = function(val) {
      // update the directive's DOM/design
      scope.checked = !!val;
      element.attr('aria-checked', scope.checked);
      if(scope.checked) {
        element.addClass(CHECKED_CSS);
      } else {
        element.removeClass(CHECKED_CSS);
      }
    };

    // watch the ng-model $viewValue
    scope.$watch(
      function () { return ngModelCtrl.$viewValue; },
      function (val) {
        // tell the radio group controller that this
        // radio button should be the checked one
        if(input[0].checked) {
          rgCtrl.check(scope);
        }
      }
    );

    // add click listener to directive element to manually
    // check the inner input[radio] and set $viewValue
    var listener = function(ev) {
      scope.$apply(function() {
        ngModelCtrl.$setViewValue(input.val(), ev && ev.type);
        input[0].checked = true;
      });
    };
    element.on('click', listener);

    // register this radio button in its radio group
    rgCtrl.add(scope);

    // on destroy, remove this radio button from its radio group
    scope.$on('$destroy', function(){
      if(input[0].checked) {
        ngModelCtrl.$setViewValue(null);
      }
      rgCtrl.remove(scope);
    });
  }

}


/**
 * @ngdoc directive
 * @name radioGroup
 * @module material.components.radioGroup
 * @restrict E
 *
 * @description
 * radioGroup directive!
 */
function materialRadioGroupDirective() {

  return {
    restrict: 'E',
    controller: controller
  };

  function controller($scope) {
    var radioButtons = [];
    var checkedRadioButton = null;

    this.add = addRadioButton;
    this.remove = removeRadioButton;
    this.check = checkRadioButton;

    function addRadioButton(rbScope) {
      return radioButtons.push(rbScope);
    }

    function removeRadioButton(rbScope) {
      for(var i=0; i<radioButtons.length; i++) {
        if(radioButtons[i] === rbScope) {
          if(rbScope === checkedRadioButton) {
            checkedRadioButton = null;
          }
          return radioButtons.splice(i, 1);
        }
      }
    }

    function checkRadioButton(rbScope) {
      if(checkedRadioButton === rbScope) return;

      checkedRadioButton = rbScope;

      angular.forEach(radioButtons, function(rb) {
        rb.check(rb === checkedRadioButton);
      });
    }

  }

}

/**
 * @ngdoc overview
 * @name material.components.scrollHeader
 *
 * @description
 * Scrollable content
 */
angular.module('material.components.scrollHeader', [
  'material.services.registry'
])

.directive('scrollHeader', [ '$materialContent', '$timeout', materialScrollHeader ]);

function materialScrollHeader($materialContent, $timeout) {

  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      var target = $element[0],

        // Full height of the target
        height = target.offsetHeight,

        // Condensed height is set through condensedHeight or defaults to 1/3 the 
        // height of the target
        condensedHeight = $attr.condensedHeight || (height / 3),

        // Calculate the difference between the full height and the condensed height
        margin = height - condensedHeight,

        // Current "y" position of scroll
        y = 0,
      
        // Store the last scroll top position
        prevScrollTop = 0;

      // Perform a simple Y translate
      var translate = function(y) {
        target.style.webkitTransform = target.style.transform = 'translate3d(0, ' + y + 'px, 0)';
      }


      // Transform the header as we scroll
      var transform = function(y) {
        translate(-y);
      }

      // Shrink the given target element based on the scrolling
      // of the scroller element.
      var shrink = function(scroller) {
        var scrollTop = scroller.scrollTop;

        y = Math.min(height, Math.max(0, y + scrollTop - prevScrollTop));

        // If we are scrolling back "up", show the header condensed again
        if (prevScrollTop > scrollTop && scrollTop > margin) {
          y = Math.max(y, margin);
        }

        window.requestAnimationFrame(transform.bind(this, y));
      };

      // Wait for next digest to ensure content has loaded
      $timeout(function() {
        var element = $materialContent('content').getElement();

        element.on('scroll', function(e) {
          shrink(e.target);

          prevScrollTop = e.target.scrollTop;
        });
      });
    }
  }
}

/**
 * @ngdoc overview
 * @name material.components.sidenav
 *
 * @description
 * A Sidenav QP component.
 */
angular.module('material.components.sidenav', [
  'material.services.registry'
])
  .factory('$materialSidenav', [ '$materialComponentRegistry', materialSidenavService ])
  .controller('$materialSidenavController', [
      '$scope',
      '$element',
      '$attrs',
      '$materialSidenav',
      '$materialComponentRegistry',
    materialSidenavController ])
  .directive('materialSidenav', [ materialSidenavDirective ]);
  
/**
 * @ngdoc controller
 * @name material.components.sidenav.controller:$materialSidenavController
 *
 * @description
 * The controller for materialSidenav components.
 */
function materialSidenavController($scope, $element, $attrs, $materialSidenav, $materialComponentRegistry) {
  $materialComponentRegistry.register(this, $attrs.componentId);

  this.isOpen = function() {
    return !!$scope.isOpen;
  };

  /**
   * Toggle the side menu to open or close depending on its current state.
   */
  this.toggle = function() {
    $scope.isOpen = !$scope.isOpen;
  }

  /**
   * Open the side menu
   */
  this.open = function() {
    $scope.isOpen = true;
  }

  /**
   * Close the side menu
   */
  this.close = function() {
    $scope.isOpen = false;
  }
}

/**
 * @ngdoc service
 * @name material.components.sidenav:$materialSidenav
 *
 * @description
 * $materialSidenav makes it easy to interact with multiple sidenavs
 * in an app.
 *
 * @usage
 *
 * ```javascript
 * // Toggle the given sidenav
 * $materialSidenav.toggle(componentId);
 * // Open the given sidenav
 * $materialSidenav.open(componentId);
 * // Close the given sidenav
 * $materialSidenav.close(componentId);
 * ```
 */
function materialSidenavService($materialComponentRegistry) {
  return function(handle) {
    var instance = $materialComponentRegistry.get(handle);
    if(!instance) {
      $materialComponentRegistry.notFoundError(handle);
    }

    return {
      isOpen: function() {
        if (!instance) { return; }
        return instance.isOpen();
      },
      /**
       * Toggle the given sidenav
       * @param handle the specific sidenav to toggle
       */
      toggle: function() {
        if(!instance) { return; }
        instance.toggle();
      },
      /**
       * Open the given sidenav
       * @param handle the specific sidenav to open
       */
      open: function(handle) {
        if(!instance) { return; }
        instance.open();
      },
      /**
       * Close the given sidenav
       * @param handle the specific sidenav to close
       */
      close: function(handle) {
        if(!instance) { return; }
        instance.close();
      }
    }
  }
}

/**
 * @ngdoc directive
 * @name materialSidenav
 * @restrict E
 *
 * @description
 *
 * A Sidenav component that can be opened and closed programatically.
 *
 * @example
 * <material-sidenav>
 * </material-sidenav>
 */
function materialSidenavDirective() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {},
    template: '<div class="material-sidenav-inner" ng-transclude></div>',
    controller: '$materialSidenavController',
    link: function($scope, $element, $attr) {
      $scope.$watch('isOpen', function(v) {
        if(v) {
          $element.addClass('open');
        } else {
          $element.removeClass('open');
        }
      });
    }
  };
}

/**
 * @ngdoc module
 * @name material.components.slider
 * @description Slider module!
 */
angular.module('material.components.slider', [])
  .directive('materialSlider', [ '$window', materialSliderDirective ]);

/**
 * @ngdoc directive
 * @name materialSlider
 * @module material.components.slider
 * @restrict E
 *
 * @description
 * Slider directive!
 *
 */
function materialSliderDirective($window) {

  var MIN_VALUE_CSS = 'material-slider-min';
  var ACTIVE_CSS = 'material-active';

  function rangeSettings(rangeEle) {
    return {
      min: parseInt( rangeEle.min !== "" ? rangeEle.min : 0, 10 ),
      max: parseInt( rangeEle.max !== "" ? rangeEle.max : 100, 10 ),
      step: parseInt( rangeEle.step !== "" ? rangeEle.step : 1, 10 )
    }
  }

  return {
    restrict: 'E',
    scope: true,
    transclude: true,
    template: '<div class="material-track" ng-transclude></div>',
    link: link
  };

  // **********************************************************
  // Private Methods
  // **********************************************************

  function link(scope, element, attr) {
    var input = element.find('input');
    var ngModelCtrl = angular.element(input).controller('ngModel');

    if(!ngModelCtrl || input[0].type !== 'range') return;

    var rangeEle = input[0];
    var trackEle = angular.element( element[0].querySelector('.material-track') );

    trackEle.append('<div class="material-fill"><div class="material-thumb"></div></div>');
    var fillEle = trackEle[0].querySelector('.material-fill');

    if(input.attr('step')) {
      var settings = rangeSettings(rangeEle);
      var tickCount = (settings.max - settings.min) / settings.step;
      var tickMarkersEle = angular.element('<div class="material-tick-markers material-display-flex"></div>');
      for(var i=0; i<tickCount; i++) {
        tickMarkersEle.append('<div class="material-tick material-flex"></div>');
      }
      trackEle.append(tickMarkersEle);
    }

    input.on('mousedown touchstart', function(e){
      trackEle.addClass(ACTIVE_CSS);
    });

    input.on('mouseup touchend', function(e){
      trackEle.removeClass(ACTIVE_CSS);
    });


    function render() {
      var settings = rangeSettings(rangeEle);
      var adjustedValue = parseInt(ngModelCtrl.$viewValue, 10) - settings.min;
      var fillRatio = (adjustedValue / (settings.max - settings.min));

      fillEle.style.width = (fillRatio * 100) + '%';

      if(fillRatio <= 0) {
        element.addClass(MIN_VALUE_CSS);
      } else {
        element.removeClass(MIN_VALUE_CSS);
      }

    }

    scope.$watch( function () { return ngModelCtrl.$viewValue; }, render );

  }

}


angular.module('material.components.tabs', ['material.utils', 'material.animations'])
  .controller('materialTabsController', [ '$iterator', '$scope', NgmTabsController])
  .directive('materialTabs', [ '$compile', 'materialEffects', NgmTabsDirective ])
  .directive('materialTab', [ '$attrBind', NgmTabDirective  ]);

/**
 * @ngdoc directive
 * @name materialTabs
 * @module material.components.tabs
 *
 * @restrict E
 *
 * @description
 * materialTabs is the outer container for the tabs directive
 *
 * @param {integer=} selected Index of the active/selected tab
 * @param {boolean}  noink Flag indicates use of Material ink effects
 * @param {boolean}  nobar Flag indicates use of Material StretchBar effects
 * @param {boolean}  nostretch Flag indicates use of animations for stretchBar width and position changes
 *
 * @example
 <example module="material.components.tabs">
 <file name="index.html">
 <h3>Static Tabs: </h3>
 <p>No ink effect and no sliding bar. Tab #1 is active and #2 is disabled.</p>
 <material-tabs selected="0" noink nobar nostretch>
 <material-tab>ITEM ONE</material-tab>
 <material-tab disabled="true" title="ITEM TWO"></material-tab>
 <material-tab>ITEM THREE</material-tab>
 </material-tabs>
 </file>
 </example>
 *
 */

function NgmTabsDirective($compile, materialEffects) {

  return {
    restrict: 'E',
    replace: false,
    transclude: 'true',

    scope: {
      $selIndex: '=?selected'
    },

    compile: compileTabsFn,
    controller: [ '$iterator', '$scope', '$timeout', NgmTabsController ],

    template:
      '<div class="tabs-header">' +
      '  <div class="tabs-header-items"></div>' +
      '  <shadow></shadow>' +
      '  <material-ink></material-ink>'  +
      '<div class="tabs-content ng-hide"></div>'

  };

  /**
   * Use prelink to configure inherited scope attributes: noink, nostretch, and nobar;
   * do this before the child elements are linked.
   *
   * @param element
   * @param attr
   * @returns {{pre: materialTabsLink}}
   */
  function compileTabsFn() {

    return {
      pre: function tabsPreLink(scope, element, attrs, tabsController) {

        // These attributes do not have values; but their presence defaults to value == true.
        scope.noink = angular.isDefined(attrs.noink);
        scope.nostretch = angular.isDefined(attrs.nostretch);
        scope.nobar = angular.isDefined(attrs.nobar);

        // Publish for access by nested `<material-tab>` elements
        tabsController.noink = scope.noink;

        // Watch for external changes `selected` & auto-select the specified tab
        // Stop watching when the <material-tabs> directive is released
        scope.$on("$destroy", scope.$watch('$selIndex', function (index) {
          tabsController.selectAt(index);
        }));

        // Remove the `stretchBar` element if `nobar` is defined
        var elBar = findNode(".selection-bar",element);
        if ( elBar && scope.nobar ) {
          elBar.remove();
        }

      },
      post: function tabsPostLink(scope, element, attrs, tabsController, $transclude) {

        transcludeHeaderItems();
        transcludeContentItems();

        configureInk();

        // **********************************************************
        // Private Methods
        // **********************************************************

        /**
         * Conditionally configure ink bar animations when the
         * tab selection changes. If `nobar` then do not show the
         * bar nor animate.
         */
        function configureInk() {
          if ( scope.nobar ) return;

          var inkElement = findNode("material-ink", element);

          tabsController.onTabChange = applyStyles;
          angular.element(window).on('resize', function() {
            applyStyles(tabsController.selectedElement(), true);
          });

          // Immediately place the ink bar
          applyStyles(tabsController.selectedElement(), true );

          /**
           * Update the position and size of the ink bar based on the
           * specified tab DOM element
           * @param tab
           * @param skipAnimation
           */
          function applyStyles(tab, skipAnimation) {
            if ( angular.isDefined(tab) && angular.isDefined(inkElement) ) {

              var tabNode = tab[0];
              var width = ( tabsController.$$tabs().length > 1 ) ? tabNode.offsetWidth : 0;
              var styles = {
                left : tabNode.offsetLeft +'px',
                width : width +'px' ,
                display : width > 0 ? 'block' : 'none'
              };

              if( !!skipAnimation ) {
                inkElement.css(styles);
              } else {
                materialEffects.ink(inkElement, styles);
              }
            }

          }

        }

        /**
         * Transclude the materialTab items into the tabsHeaderItems container
         *
         */
        function transcludeHeaderItems() {
          $transclude(function (content) {
            var header = findNode('.tabs-header-items', element);
            var parent = angular.element(element[0]);

            angular.forEach(content, function (node) {
              var intoHeader = isNodeType(node, 'material-tab') || isNgRepeat(node);

              if (intoHeader) {
                header.append(node);
              }
              else {
                parent.prepend(node);
              }
            });
          });
        }

        /**
         * Transclude the materialTab view/body contents into materialView containers; which
         * are stored in the tabsContent area...
         */
        function transcludeContentItems() {
          var cache = {
              length: 0,
              contains: function (tab) {
                return !angular.isUndefined(cache[tab.$id]);
              }
            },
            cntr = findNode('.tabs-content', element),
            materialViewTmpl = '<div class="material-view" ng-show="active"></div>';

          scope.$watch(getTabsHash, function buildContentItems() {
            var tabs = tabsController.$$tabs(notInCache),
              views = tabs.map(extractViews);

            // At least 1 tab must have valid content to build; otherwise
            // we hide/remove the tabs-content container...

            if (views.some(notEmpty)) {
              angular.forEach(views, function (elements, j) {

                var tab = tabs[j++],
                  materialView = $compile(materialViewTmpl)(tab);

                if (elements) {
                  // If transcluded content is not undefined then add all nodes to the materialView
                  angular.forEach(elements, function (node) {
                    materialView.append(node);
                  });
                }

                cntr.append(materialView);
                addToCache(cache, { scope: tab, element: materialView });

              });
            }

            // Hide or Show the container for the materialView(s)
            angular.bind(cntr, cache.length ? cntr.removeClass : cntr.addClass)('ng-hide');

          });

          /**
           * Add tab scope/DOM node to the cache and configure
           * to auto-remove when the scope is destroyed.
           * @param cache
           * @param item
           */
          function addToCache(cache, item) {

            cache[ item.scope.$id ] = item;
            cache.length = cache.length + 1;

            // When the tab is removed, remove its associated material-view Node...
            item.scope.$on("$destroy", function () {
              angular.element(item.element).remove();

              delete cache[ item.scope.$id];
              cache.length = cache.length - 1;
            });
          }

          function getTabsHash() {
            return tabsController.$$hash;
          }

          function extractViews(tab) {
            return hasContent(tab) ? tab.content : undefined;
          }

          function hasContent(tab) {
            return tab.content && tab.content.length;
          }

          function notEmpty(view) {
            return angular.isDefined(view);
          }

          function notInCache(tab) {
            return !cache.contains(tab);
          }
        }

      }
    };

    function findNode(selector, element) {
      var container = element[0];
      return angular.element(container.querySelector(selector));
    }

  }

}

/**
 /**
 * @ngdoc directive
 * @name materialTab
 * @module material.components.tabs
 *
 * @restrict E
 *
 * @param {string=} onSelect A function expression to call when the tab is selected.
 * @param {string=} onDeselect A function expression to call when the tab is deselected.
 * @param {boolean=} active A binding, telling whether or not this tab is selected.
 * @param {boolean=} disabled A binding, telling whether or not this tab is disabled.
 * @param {string=} title The visible heading, or title, of the tab. Set HTML headings with {@link ui.bootstrap.tabs.directive:tabHeading tabHeading}.
 *
 * @description
 * Creates a tab with a heading and (optional) content. Must be placed within a {@link material.components.tabs.directive:materialTabs materialTabs}.
 *
 * @example
 *
 */
function NgmTabDirective($attrBind) {
  var noop = angular.noop;

  return {
    restrict: 'E',
    replace: false,
    require: "^materialTabs",
    transclude: 'true',
    scope: true,
    link: linkTab,
    template:
      '<material-ripple initial-opacity="0.95" opacity-decay-velocity="0.89"> </material-ripple> ' +
      '<material-tab-label ' +
        'ng-class="{ disabled : disabled, active : active }"  >' +
      '</material-tab-label>'

  };

  function linkTab(scope, element, attrs, tabsController, $transclude) {
    var defaults = { active: false, disabled: false, deselected: noop, selected: noop };

    // Since using scope=true for inherited new scope,
    // then manually scan element attributes for forced local mappings...

    $attrBind(scope, attrs, {
      label: '@?',
      active: '=?',
      disabled: '=?',
      deselected: '&onDeselect',
      selected: '&onSelect'
    }, defaults);

    configureEffects();
    configureWatchers();
    updateTabContent(scope);

    // Click support for entire <material-tab /> element
    element.on('click', function onRequestSelect() {
      if (!scope.disabled) {
        scope.$apply(function () {
          tabsController.select(scope);
        })
      }
    });

    tabsController.add(scope, element);

    // **********************************************************
    // Private Methods
    // **********************************************************

    /**
     * If materialTabs `noInk` is true, then remove the materialInk feature
     * By default, the materialInk directive is auto injected; @see line 255
     */
    function configureEffects() {
      if (tabsController.noink) {
        // Note; material-ink directive replaces `<material-ink />` element with `div.material-ripple-cursor` element
        var elRipple = angular.element(element[0].querySelector('.material-ripple-cursor'));
        if (elRipple) {
          elRipple.remove();
        }
      }
    }

    /**
     * Auto select the next tab if the current tab is active and
     * has been disabled.
     */
    function configureWatchers() {
      var unwatch = scope.$watch('disabled', function (isDisabled) {
        if (scope.active && isDisabled) {
          tabsController.next(scope);
        }
      });

      scope.$on("$destroy", function () {
        unwatch();
        tabsController.remove(scope);
      });
    }

    /**
     * Transpose the optional `label` attribute value or materialTabHeader or `content` body
     * into the body of the materialTabButton... all other content is saved in scope.content
     * and used by NgmTabsController to inject into the `tabs-content` container.
     */
    function updateTabContent(scope) {
      var cntr = angular.element(element[0].querySelector('material-tab-label'));

      // Check to override label attribute with the content of the <material-tab-header> node,
      // If a materialTabHeader is not specified, then the node will be considered
      // a <material-view> content element...

      $transclude(function (contents) {
        scope.content = [ ];

        angular.forEach(contents, function (node) {
          if (!isNodeEmpty(node)) {
            if (isNodeType(node, 'material-tab-label')) {
              // Simulate use of `label` attribute
              scope.label = node.childNodes;

            } else {

              // Attach to scope for future transclusion into materialView(s)
              scope.content.push(node);
            }
          }
        });

      });

      // Prepare to assign the materialTabButton content
      // Use the label attribute or fallback to TabHeader content

      if (angular.isDefined(scope.label)) {
        // The `label` attribute is the default source

        cntr.append(scope.label);

      } else {

        // NOTE: If not specified, all markup and content is assumed
        // to be used for the tab label.

        angular.forEach(scope.content, function (node) {
          cntr.append(node);
        });

        delete scope.content;
      }
    }

  }
}

/**
 * @ngdoc controller
 * @name materialTabsController
 * @module material.components.tabs
 *
 * @private
 *
 */
function NgmTabsController($iterator, $scope, $timeout) {

  var list = $iterator([], true),
    elements = { },
    selected = null,
    self = this;

  // Methods used by <material-tab> and children

  this.add = addTab;
  this.remove = removeTab;
  this.select = selectTab;
  this.selectAt = selectTabAt;
  this.next = selectNext;
  this.previous = selectPrevious;

  // Property for child access
  this.noink = !!$scope.noink;
  this.scope = $scope;

  // Special internal accessor to access scopes and tab `content`
  // Used by NgmTabsDirective::buildContentItems()

  this.$$tabs = $onGetTabs;
  this.$$hash = "";

  // used within the link-Phase of materialTabs
  this.onTabChange = angular.noop;
  this.selectedElement = function() {
    return findElementFor( selected );
  }

  /**
   * Find the DOM element associated with the tab/scope
   * @param tab
   * @returns {*}
   */
  function findElementFor(tab) {
    if ( angular.isUndefined(tab) ) {
      tab = selected;
    }
    return tab ? elements[ tab.$id ] : undefined;
  }

  /**
   * Publish array of tab scope items
   * NOTE: Tabs are not required to have `contents` and the
   *       node may be undefined.
   * @returns {*} Array
   */
  function $onGetTabs(filterBy) {
    return list.items().filter(filterBy || angular.identity);
  }

  /**
   * Create unique hashKey representing all available
   * tabs.
   */
  function updateHash() {
    self.$$hash = list.items()
      .map(function (it) {
        return it.$id;
      })
      .join(',');
  }

  /**
   * Select specified tab; deselect all others (if any selected)
   * @param tab
   */
  function selectTab(tab) {
    var activate = makeActivator(true),
      deactivate = makeActivator(false);

    // Turn off all tabs (if current active)
    angular.forEach(list.items(), deactivate);

    // Activate the specified tab (or next available)
    selected = activate(tab.disabled ? list.next(tab) : tab);

    // update external models and trigger databinding watchers
    $scope.$selIndex = String(selected.$index || list.indexOf(selected));

    // update the tabs ink to indicate the selected tab
    self.onTabChange( findElementFor(selected) );

    return selected;
  }

  /**
   * Select tab based on its index position
   * @param index
   */
  function selectTabAt(index) {
    if (list.inRange(index)) {
      var matches = list.findBy("$index", index),
        it = matches ? matches[0] : null;

      if (it != selected) {
        selectTab(it);
      }
    }
  }

  /**
   * If not specified (in parent scope; as part of ng-repeat), create
   * `$index` property as part of current scope.
   * NOTE: This prevents scope variable shadowing...
   * @param tab
   * @param index
   */
  function updateIndex(tab, index) {
    if (angular.isUndefined(tab.$index)) {
      tab.$index = index;
    }
  }

  /**
   * Add tab to list and auto-select; default adds item to end of list
   * @param tab
   */
  function addTab(tab, element) {

    updateIndex(tab, list.count());

    // cache materialTab DOM element; these are not materialView elements
    elements[ tab.$id ] = element;

    if (!list.contains(tab)) {
      var pos = list.add(tab, tab.$index);

      // Should we auto-select it?
      if ($scope.$selIndex == pos) {
        selectTab(tab);
      }
    }


    updateHash();

    return tab.$index;
  }

  /**
   * Remove the specified tab from the list
   * Auto select the next tab or the previous tab (if last)
   * @param tab
   */
  function removeTab(tab) {
    if (list.contains(tab)) {

      selectTab(selected = list.next(tab, isEnabled));
      list.remove(tab);

      // another tab was removed, make sure to update ink bar
      $timeout(function(){
        self.onTabChange( findElementFor(selected), true );
        delete elements[tab.$id];
      },300);

    }

    updateHash();
  }

  /**
   * Select the next tab in the list
   * @returns {*} Tab
   */
  function selectNext() {
    return selectTab(selected = list.next(selected, isEnabled));
  }

  /**
   * Select the previous tab
   * @returns {*} Tab
   */
  function selectPrevious() {
    return selectTab(selected = list.previous(selected, isEnabled));
  }

  /**
   * Validation criteria for list iterator when List::next() or List::previous() is used..:
   * In this case, the list iterator should skip items that are disabled.
   * @param tab
   * @returns {boolean}
   */
  function isEnabled(tab) {
    return tab && !tab.disabled;
  }

  /**
   * Partial application to build function that will
   * mark the specified tab as active or not. This also
   * allows the `updateStatus` function to be used as an iterator.
   *
   * @param active
   */
  function makeActivator(active) {
    return function updateState(tab) {
      if (tab && (active != tab.active)) {
        tab.active = active;

//        Disable ripples when tab is active/selected
//        tab.inkEnabled = !active;

        tab.inkEnabled = true;

        if (active) {
          selected = tab;
          tab.selected();
        } else {
          if (selected == tab) {
            selected = null;
          }
          tab.deselected();
        }
        return tab;
      }
      return null;

    }
  }

}

var trim = (function () {
  function isString(value) {
    return typeof value === 'string';
  }

  // native trim is way faster: http://jsperf.com/angular-trim-test
  // but IE doesn't have it... :-(
  // TODO: we should move this into IE/ES5 polyfill
  if (!String.prototype.trim) {
    return function (value) {
      return isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
    };
  }
  return function (value) {
    return isString(value) ? value.trim() : value;
  };
})();

/**
 * Determine if the DOM element is of a certain tag type
 * or has the specified attribute type
 *
 * @param node
 * @returns {*|boolean}
 */
var isNodeType = function (node, type) {
  return node.tagName && (
    node.hasAttribute(type) ||
    node.hasAttribute('data-' + type) ||
    node.tagName.toLowerCase() === type ||
    node.tagName.toLowerCase() === 'data-' + type
    );
};

var isNgRepeat = function (node) {
  var COMMENT_NODE = 8;
  return (node.nodeType == COMMENT_NODE) && (node.nodeValue.indexOf('ngRepeat') > -1);
};

/**
 * Is the an empty text string
 * @param node
 * @returns {boolean}
 */
var isNodeEmpty = function (node) {
  var TEXT_NODE = 3;
  return (node.nodeType == TEXT_NODE) && (trim(node.nodeValue) == "");
};


angular.module('material.components.toast', ['material.services.popup'])
  .directive('materialToast', [
    QpToastDirective
  ])
  /**
   * @ngdoc service
   * @name $materialToast
   * @module material.components.toast
   */
  .factory('$materialToast', [
    '$timeout',
    '$materialPopup',
    QpToastService
  ]);

function QpToastDirective() {
  return {
    restrict: 'E',
    transclude: true,
    template: 
      '<div class="toast-container" ng-transclude>' +
      '</div>'
  };
}

function QpToastService($timeout, $materialPopup) {
  var recentToast;

  return showToast;

  /**
   * TODO fully document this
   * Supports all options from $materialPopup, in addition to `duration` and `position`
   */
  function showToast(options) {
    options = angular.extend({
      // How long to keep the toast up, milliseconds
      duration: 3000,
      // [unimplemented] Whether to disable swiping
      swipeDisabled: false,
      // Supports any combination of these class names: 'bottom top left right fit'. 
      // Default: 'bottom left'
      position: 'bottom left',

      // Also supports all options from $materialPopup
      transformTemplate: function(template) {
        return '<material-toast>' + template + '</material-toast>';
      }
    }, options || {});

    recentToast && recentToast.then(function(destroyToast) {
      destroyToast();
    });

    recentToast = $materialPopup(options).then(function(toast) {
      function destroy() {
        $timeout.cancel(toast.delay);
        toast.destroy();
      }

      // Controller will be passed a `$hideToast` function
      toast.locals.$hideToast = destroy;

      toast.element.addClass(options.position);
      toast.enter(function() {
        options.duration && $timeout(destroy, options.duration);
      });

      return destroy;
    });

    return recentToast;
  }
}

angular.module('material.components.toolbar', [
  'material.components.content'
])
  .directive('materialToolbar', [materialToolbarDirective]);

function materialToolbarDirective() {

  return {
    restrict: 'E',
    transclude: true,
    template: '<div class="material-toolbar-inner" ng-transclude></div>'
  }

}

angular.module('material.components.whiteframe', []);

angular.module('material.services', [
  'material.services.registry'
]);

/**
 * @ngdoc overview
 * @name material.services.registry
 *
 * @description
 * A component registry system for accessing various component instances in an app.
 */
angular.module('material.services.registry', [])
  .factory('$materialComponentRegistry', [ '$log', materialComponentRegistry ]);

/**
 * @ngdoc service
 * @name material.services.registry.service:$materialComponentRegistry
 *
 * @description
 * $materialComponentRegistry enables the user to interact with multiple instances of
 * certain complex components in a running app.
 */
function materialComponentRegistry($log) {
  var instances = [];

  return {
    /**
     * Used to print an error when an instance for a handle isn't found.
     */
    notFoundError: function(handle) {
      $log.error('No instance found for handle', handle);
    },
    /**
     * Return all registered instances as an array.
     */
    getInstances: function() {
      return instances;
    },

    /**
     * Get a registered instance.
     * @param handle the String handle to look up for a registered instance.
     */
    get: function(handle) {
      var i, j, instance;
      for(i = 0, j = instances.length; i < j; i++) {
        instance = instances[i];
        if(instance.$$materialHandle === handle) {
          return instance;
        }
      }
      return null;
    },

    /**
     * Register an instance.
     * @param instance the instance to register
     * @param handle the handle to identify the instance under.
     */
    register: function(instance, handle) {
      instance.$$materialHandle = handle;
      instances.push(instance);

      return function deregister() {
        var index = instances.indexOf(instance);
        if (index !== -1) {
          instances.splice(index, 1);
        }
      };
    },
  }
}


angular.module('material.services.compiler', [])
  .service('$materialCompiler', [
    '$q',
    '$http',
    '$injector',
    '$compile',
    '$controller',
    '$templateCache',
    materialCompilerService
  ]);

function materialCompilerService($q, $http, $injector, $compile, $controller, $templateCache) {

  /**
   * @ngdoc service
   * @name $materialCompiler
   * @module material.services.compiler
   *
   * @description
   * The $materialCompiler service is an abstraction of angular's compiler, that allows the developer
   * to easily compile an element with a templateUrl, controller, and locals.
   */

   /**
    * @ngdoc method
    * @name $materialCompiler#compile
    * @param {object} options An options object, with the following properties:
    *
    *    - `controller` â€“ `{(string=|function()=}` â€“ Controller fn that should be associated with
    *      newly created scope or the name of a {@link angular.Module#controller registered
    *      controller} if passed as a string.
    *    - `controllerAs` â€“ `{string=}` â€“ A controller alias name. If present the controller will be
    *      published to scope under the `controllerAs` name.
    *    - `template` â€“ `{string=}` â€“ html template as a string or a function that
    *      returns an html template as a string which should be used by {@link
    *      ngRoute.directive:ngView ngView} or {@link ng.directive:ngInclude ngInclude} directives.
    *      This property takes precedence over `templateUrl`.
    *
    *    - `templateUrl` â€“ `{string=}` â€“ path or function that returns a path to an html
    *      template that should be used by {@link ngRoute.directive:ngView ngView}.
    *
    *    - `transformTemplate` â€“ `{function=} â€“ a function which can be used to transform
    *      the templateUrl or template provided after it is fetched.  It will be given one
    *      parameter, the template, and should return a transformed template.
    *
    *    - `resolve` - `{Object.<string, function>=}` - An optional map of dependencies which should
    *      be injected into the controller. If any of these dependencies are promises, the compiler
    *      will wait for them all to be resolved or one to be rejected before the controller is
    *      instantiated.
    *
    *      - `key` â€“ `{string}`: a name of a dependency to be injected into the controller.
    *      - `factory` - `{string|function}`: If `string` then it is an alias for a service.
    *        Otherwise if function, then it is {@link api/AUTO.$injector#invoke injected}
    *        and the return value is treated as the dependency. If the result is a promise, it is
    *        resolved before its value is injected into the controller.
    *
    * @returns {object=} promise A promsie which will be resolved with a `compileData` object,
    * with the following properties:
    *
    *   - `{element}` â€“ `element` â€“ an uncompiled angular element compiled using the provided template.
    *   
    *   - `{function(scope)}`  â€“ `link` â€“ A link function, which, when called, will compile
    *     the elmeent and instantiate options.controller.
    *
    *   - `{object}` â€“ `locals` â€“ The locals which will be passed into the controller once `link` is
    *     called.
    *
    * @usage
    * $materialCompiler.compile({
    *   templateUrl: 'modal.html',
    *   controller: 'ModalCtrl',
    *   locals: {
    *     modal: myModalInstance;
    *   }
    * }).then(function(compileData) {
    *   compileData.element; // modal.html's template in an element
    *   compileData.link(myScope); //attach controller & scope to element
    * });
    */
  this.compile = function(options) {
    var templateUrl = options.templateUrl;
    var template = options.template || '';
    var controller = options.controller;
    var controllerAs = options.controllerAs;
    var resolve = options.resolve || {};
    var locals = options.locals || {};
    var transformTemplate = options.transformTemplate || angular.identity;

    // Take resolve values and invoke them.  
    // Resolves can either be a string (value: 'MyRegisteredAngularConst'),
    // or an invokable 'factory' of sorts: (value: function ValueGetter($dependency) {})
    angular.forEach(resolve, function(value, key) {
      if (angular.isString(value)) {
        resolve[key] = $injector.get(value);
      } else {
        resolve[key] = $injector.invoke(value);
      }
    });
    //Add the locals, which are just straight values to inject
    //eg locals: { three: 3 }, will inject three into the controller
    angular.extend(resolve, locals);

    if (templateUrl) {
      resolve.$template = $http.get(templateUrl, {cache: $templateCache})
        .then(function(response) {
          return response.data;
        });
    } else {
      resolve.$template = $q.when(template);
    }

    // Wait for all the resolves to finish if they are promises
    return $q.all(resolve).then(function(locals) {

      var template = transformTemplate(locals.$template);
      var element = angular.element('<div>').html(template).contents();
      var linkFn = $compile(element);

      //Return a linking function that can be used later whne the element is ready
      return {
        locals: locals,
        element: element,
        link: function link(scope) {
          locals.$scope = scope;

          //Instantiate controller if it exists, because we have scope
          if (controller) {
            var ctrl = $controller(controller, locals);
            //See angular-route source for this logic
            element.data('$ngControllerController', ctrl);
            element.children().data('$ngControllerController', ctrl);

            if (controllerAs) {
              scope[controllerAs] = ctrl;
            }
          }

          return linkFn(scope);
        }
      };
    });
  };
}

angular.module('material.services.popup', ['material.services.compiler'])

  .factory('$materialPopup', [
    '$materialCompiler',
    '$timeout',
    '$document',
    '$animate',
    '$rootScope',
    '$rootElement',
    QpPopupFactory
  ]);

function QpPopupFactory($materialCompiler, $timeout, $document, $animate, $rootScope, $rootElement) {

  return createPopup;

  function createPopup(options) {
    var appendTo = options.appendTo || $rootElement;
    var scope = (options.scope || $rootScope).$new();

    return $materialCompiler.compile(options).then(function(compileData) {
      var self;

      return self = angular.extend({
        enter: enter,
        leave: leave,
        destroy: destroy,
        scope: scope
      }, compileData);

      function enter(done) {
        if (scope.$$destroyed || self.entered) return (done || angular.noop)();

        self.entered = true;
        var after = appendTo[0].lastElementChild;
        $animate.enter(self.element, appendTo, after && angular.element(after), done);

        //On the first enter, compile the element
        if (!self.compiled) {
          compileData.link(scope);
          self.compiled = true;
        }
      }
      function leave(done) {
        self.entered = false;
        $animate.leave(self.element, done);
      }
      function destroy(done) {
        if (scope.$$destroyed) return (done || angular.noop)();
        self.leave(function() {
          scope.$destroy();
          (done || angular.noop)();
        });
      }
    });
  }
}

angular.module('material.utils', [ ])
  .factory('$attrBind', [ '$parse', '$interpolate', AttrsBinder ]);

/**
 *  This service allows directives to easily databind attributes to private scope properties.
 *
 * @private
 */
function AttrsBinder($parse, $interpolate) {
  var LOCAL_REGEXP = /^\s*([@=&])(\??)\s*(\w*)\s*$/;

  return function (scope, attrs, bindDefinition, bindDefaults) {
    angular.forEach(bindDefinition || {}, function (definition, scopeName) {
      //Adapted from angular.js $compile
      var match = definition.match(LOCAL_REGEXP) || [],
        attrName = match[3] || scopeName,
        mode = match[1], // @, =, or &
        parentGet,
        unWatchFn;

      switch (mode) {
        case '@':   // One-way binding from attribute into scope

          attrs.$observe(attrName, function (value) {
            scope[scopeName] = value;
          });
          attrs.$$observers[attrName].$$scope = scope;

          if (!bypassWithDefaults(attrName, scopeName)) {
            // we trigger an interpolation to ensure
            // the value is there for use immediately
            scope[scopeName] = $interpolate(attrs[attrName])(scope);
          }
          break;

        case '=':   // Two-way binding...

          if (!bypassWithDefaults(attrName, scopeName)) {
            // Immediate evaluation
            scope[scopeName] = scope.$eval(attrs[attrName]);

            // Data-bind attribute to scope (incoming) and
            // auto-release watcher when scope is destroyed

            unWatchFn = scope.$watch(attrs[attrName], function (value) {
              scope[scopeName] = value;
            });
            scope.$on('$destroy', unWatchFn);
          }

          break;

        case '&':   // execute an attribute-defined expression in the context of the parent scope

          if (!bypassWithDefaults(attrName, scopeName, angular.noop)) {
            /* jshint -W044 */
            if (attrs[attrName] && attrs[attrName].match(RegExp(scopeName + '\(.*?\)'))) {
              throw new Error('& expression binding "' + scopeName + '" looks like it will recursively call "' +
                attrs[attrName] + '" and cause a stack overflow! Please choose a different scopeName.');
            }

            parentGet = $parse(attrs[attrName]);
            scope[scopeName] = function (locals) {
              return parentGet(scope, locals);
            };
          }

          break;
      }
    });

    /**
     * Optional fallback value if attribute is not specified on element
     * @param scopeName
     */
    function bypassWithDefaults(attrName, scopeName, defaultVal) {
      if (!angular.isDefined(attrs[attrName])) {
        var hasDefault = bindDefaults && bindDefaults.hasOwnProperty(scopeName);
        scope[scopeName] = hasDefault ? bindDefaults[scopeName] : defaultVal;
        return true;
      }
      return false;
    }

  };
}

angular.module('material.utils')
  .service('$iterator', IteratorFactory);

/**
 * $iterator Service Class
 */

function IteratorFactory() {

  return function (items, loop) {
    return new List(items, loop);
  };

  /**
   * List facade to easily support iteration and accessors
   * @param items Array list which this iterator will enumerate
   * @param loop Boolean enables iterator to consider the list as an endless loop
   * @constructor
   */
  function List(items, loop) {
    loop = !!loop;

    var _items = items || [ ];

    // Published API

    return {

      items: getItems,
      count: count,

      hasNext: hasNext,
      inRange: inRange,
      contains: contains,
      indexOf: indexOf,
      itemAt: itemAt,
      findBy: findBy,

      add: add,
      remove: remove,

      first: first,
      last: last,
      next: next,
      previous: previous

    };

    /**
     * Publish copy of the enumerable set
     * @returns {Array|*}
     */
    function getItems() {
      return [].concat(_items);
    }

    /**
     * Determine length of the list
     * @returns {Array.length|*|number}
     */
    function count() {
      return _items.length;
    }

    /**
     * Is the index specified valid
     * @param index
     * @returns {Array.length|*|number|boolean}
     */
    function inRange(index) {
      return _items.length && ( index > -1 ) && (index < _items.length );
    }

    /**
     * Can the iterator proceed to the next item in the list; relative to
     * the specified item.
     *
     * @param tab
     * @returns {Array.length|*|number|boolean}
     */
    function hasNext(tab) {
      return tab ? inRange(indexOf(tab) + 1) : false;
    }

    /**
     * Get item at specified index/position
     * @param index
     * @returns {*}
     */
    function itemAt(index) {
      return inRange(index) ? _items[index] : null;
    }

    /**
     * Find all elements matching the key/value pair
     * otherwise return null
     *
     * @param val
     * @param key
     *
     * @return array
     */
    function findBy(key, val) {

      /**
       * Implement of e6 Array::find()
       * @param list
       * @param callback
       * @returns {*}
       */
      function find(list, callback) {
        var results = [ ];

        angular.forEach(list, function (it, index) {
          var val = callback.apply(null, [it, index, list]);
          if (val) {
            results.push(val);
          }
        });

        return results.length ? results : undefined;
      }

      // Use iterator callback to matches element key value
      // NOTE: searches full prototype chain

      return find(_items, function (el) {
        return ( el[key] == val ) ? el : null;
      });

    }

    /**
     * Add item to list
     * @param it
     * @param index
     * @returns {*}
     */
    function add(it, index) {
      if (!angular.isDefined(index)) {
        index = _items.length;
      }

      _items.splice(index, 0, it);

      return indexOf(it);
    }

    /**
     * Remove it from list...
     * @param it
     */
    function remove(it) {
      _items.splice(indexOf(it), 1);
    }

    /**
     * Get the zero-based index of the target tab
     * @param it
     * @returns {*}
     */
    function indexOf(it) {
      return _items.indexOf(it);
    }

    /**
     * Boolean existence check
     * @param it
     * @returns {boolean}
     */
    function contains(it) {
      return it && (indexOf(it) > -1);
    }

    /**
     * Find the next item
     * @param tab
     * @returns {*}
     */
    function next(it, validate) {

      if (contains(it)) {
        var index = indexOf(it) + 1,
          found = inRange(index) ? _items[ index ] :
            loop ? first() : null,
          skip = found && validate && !validate(found);

        return skip ? next(found) : found;
      }

      return null;
    }

    /**
     * Find the previous item
     * @param tab
     * @returns {*}
     */
    function previous(it, validate) {

      if (contains(it)) {
        var index = indexOf(it) - 1,
          found = inRange(index) ? _items[ index ] :
            loop ? last() : null,
          skip = found && validate && !validate(found);

        return skip ? previous(found) : found;
      }

      return null;
    }

    /**
     * Return first item in the list
     * @returns {*}
     */
    function first() {
      return _items.length ? _items[0] : null;
    }

    /**
     * Return last item in the list...
     * @returns {*}
     */
    function last() {
      return _items.length ? _items[_items.length - 1] : null;
    }

  }

}




/**
 * @author      Thomas Burleson
 * @date        November, 2013
 * @description
 *
 *  String supplant global utility (similar to but more powerful than sprintf() ).
 *
 *  Usages:
 *
 *      var user = {
 *              first : "Thomas",
 *              last  : "Burleson",
 *              address : {
 *                  city : "West Des Moines",
 *                  state: "Iowa"
 *              },
 *              contact : {
 *                  email : "ThomasBurleson@Gmail.com"
 *                  url   : "http://www.solutionOptimist.com"
 *              }
 *          },
 *          message = "Hello Mr. {first} {last}. How's life in {address.city}, {address.state} ?";
 *
 *     return supplant( message, user );
 *
 */
(function( window ) {
    "use strict";
        var INVALID_DATA = "Undefined template provided";

        // supplant() method from Crockfords `Remedial Javascript`

        var supplant =  function( template, values, pattern ) {
            if(!template)
            {
              throw(new Error(INVALID_DATA));
            }

            pattern = pattern || /\{([^\{\}]*)\}/g;

            return template.replace(pattern, function(a, b) {
                var p = b.split('.'),
                    r = values;

                try {
                    for (var s in p) { r = r[p[s]];  }
                } catch(e){
                    r = a;
                }

                return (typeof r === 'string' || typeof r === 'number' || typeof r === 'boolean') ? r : a;
            });
        };


        // supplant() method from Crockfords `Remedial Javascript`
        Function.prototype.method = function (name, func) {
            this.prototype[name] = func;
            return this;
        };

        String.method("supplant", function( values, pattern ) {
            var self = this;
            return supplant(self, values, pattern);
        });


        // Publish this global function...
        window.supplant = String.supplant = supplant;

}( window ));

})();
var DocsApp = angular.module('docsApp', ['ngMaterial', 'ngRoute', 'angularytics'])

.config([
  'COMPONENTS',
  '$routeProvider',
function(COMPONENTS, $routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'template/home.tmpl.html'
  });

  angular.forEach(COMPONENTS, function(component) {
    component.url = '/component/' + component.id;
    $routeProvider.when(component.url, {
      templateUrl: component.outputPath,
      resolve: {
        component: function() { return component; }
      },
      controller: 'DocPageCtrl'
    });
  });

  $routeProvider.otherwise('/');

}])

.config(['AngularyticsProvider',
function(AngularyticsProvider) {
  AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);
}])

.run([
  'Angularytics',
  '$rootScope',
function(Angularytics, $rootScope) {
  Angularytics.init();
}])

.controller('DocsCtrl', [
  '$scope',
  'COMPONENTS',
  '$materialSidenav',
  '$timeout',
  '$location',
  '$rootScope',
  '$materialDialog',
function($scope, COMPONENTS, $materialSidenav, $timeout, $location, $rootScope, $materialDialog) {
  $scope.COMPONENTS = COMPONENTS;

  document.querySelector('.sidenav-content')
  .addEventListener('click', function(e) {
    if ($materialSidenav('left').isOpen()) {
      e.preventDefault();
      e.stopPropagation();
      $timeout(function() {
        $materialSidenav('left').close();
      });
    }
  });

  $scope.setCurrentComponent = function(component) {
    $scope.currentComponent = component;
  };

  $scope.toggleMenu = function() {
    $timeout(function() {
      $materialSidenav('left').toggle();
    });
  };

  $scope.goHome = function($event) {
    $location.path( '/' );
  };

  $scope.goToComponent = function(component) {
    if (component) {
      $location.path( component.url );
      $materialSidenav('left').close();
    }
  };
  $scope.componentIsCurrent = function(component) {
    return component && $location.path() === component.url;
  };

  $scope.viewSource = function(component) {
    $materialDialog({
      controller: 'ViewSourceCtrl',
      locals: {
        demo: component.$selectedDemo
      },
      templateUrl: 'template/view-source.tmpl.html'
    });
  };
}])

.controller('HomeCtrl', [
  '$scope',
  '$rootScope',
function($scope, $rootScope) {
  $rootScope.appTitle = 'Material Design';
  $scope.setCurrentComponent(null);
}])

.controller('DocPageCtrl', [
  '$scope',
  'component',
  '$rootScope',
function($scope, component, $rootScope) {
  $rootScope.appTitle = 'Material: ' + component.name;

  $scope.setCurrentComponent(component);
  component.$selectedDemo = component.$selectedDemo || 
    component.demos[ Object.keys(component.demos)[0] ];
}])

.controller('ViewSourceCtrl', [
  '$scope',
  'demo',
  '$hideDialog',
function($scope, demo, $hideDialog) {
  $scope.files = [demo.indexFile].concat(demo.files.sort(sortByJs));
  $scope.$hideDialog = $hideDialog;

  $scope.data = {
    selectedFile: demo.indexFile
  };

  function sortByJs(file) {
    return file.fileType == 'js' ? -1 : 1;
  }
}])

;

DocsApp.directive('highlight', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      scope.$watch(attrs.highlight, highlight);
      scope.$watch(attrs.highlightLanguage, highlight);

      function highlight() {
        //Always add a newline at the start - stops a weird spacing bug
        var code = '\n' + (''+scope.$eval(attrs.highlight)).trim();
        var language = scope.$eval(attrs.highlightLanguage);
        if (code && language) {
          var highlightedCode = hljs.highlight(language, code);
          element.html(highlightedCode.value);
        }
      }
    }
  };
});

var hljs=new function(){function k(v){return v.replace(/&/gm,"&amp;").replace(/</gm,"&lt;").replace(/>/gm,"&gt;")}function t(v){return v.nodeName.toLowerCase()}function i(w,x){var v=w&&w.exec(x);return v&&v.index==0}function d(v){return Array.prototype.map.call(v.childNodes,function(w){if(w.nodeType==3){return b.useBR?w.nodeValue.replace(/\n/g,""):w.nodeValue}if(t(w)=="br"){return"\n"}return d(w)}).join("")}function r(w){var v=(w.className+" "+(w.parentNode?w.parentNode.className:"")).split(/\s+/);v=v.map(function(x){return x.replace(/^language-/,"")});return v.filter(function(x){return j(x)||x=="no-highlight"})[0]}function o(x,y){var v={};for(var w in x){v[w]=x[w]}if(y){for(var w in y){v[w]=y[w]}}return v}function u(x){var v=[];(function w(y,z){for(var A=y.firstChild;A;A=A.nextSibling){if(A.nodeType==3){z+=A.nodeValue.length}else{if(t(A)=="br"){z+=1}else{if(A.nodeType==1){v.push({event:"start",offset:z,node:A});z=w(A,z);v.push({event:"stop",offset:z,node:A})}}}}return z})(x,0);return v}function q(w,y,C){var x=0;var F="";var z=[];function B(){if(!w.length||!y.length){return w.length?w:y}if(w[0].offset!=y[0].offset){return(w[0].offset<y[0].offset)?w:y}return y[0].event=="start"?w:y}function A(H){function G(I){return" "+I.nodeName+'="'+k(I.value)+'"'}F+="<"+t(H)+Array.prototype.map.call(H.attributes,G).join("")+">"}function E(G){F+="</"+t(G)+">"}function v(G){(G.event=="start"?A:E)(G.node)}while(w.length||y.length){var D=B();F+=k(C.substr(x,D[0].offset-x));x=D[0].offset;if(D==w){z.reverse().forEach(E);do{v(D.splice(0,1)[0]);D=B()}while(D==w&&D.length&&D[0].offset==x);z.reverse().forEach(A)}else{if(D[0].event=="start"){z.push(D[0].node)}else{z.pop()}v(D.splice(0,1)[0])}}return F+k(C.substr(x))}function m(y){function v(z){return(z&&z.source)||z}function w(A,z){return RegExp(v(A),"m"+(y.cI?"i":"")+(z?"g":""))}function x(D,C){if(D.compiled){return}D.compiled=true;D.k=D.k||D.bK;if(D.k){var z={};function E(G,F){if(y.cI){F=F.toLowerCase()}F.split(" ").forEach(function(H){var I=H.split("|");z[I[0]]=[G,I[1]?Number(I[1]):1]})}if(typeof D.k=="string"){E("keyword",D.k)}else{Object.keys(D.k).forEach(function(F){E(F,D.k[F])})}D.k=z}D.lR=w(D.l||/\b[A-Za-z0-9_]+\b/,true);if(C){if(D.bK){D.b=D.bK.split(" ").join("|")}if(!D.b){D.b=/\B|\b/}D.bR=w(D.b);if(!D.e&&!D.eW){D.e=/\B|\b/}if(D.e){D.eR=w(D.e)}D.tE=v(D.e)||"";if(D.eW&&C.tE){D.tE+=(D.e?"|":"")+C.tE}}if(D.i){D.iR=w(D.i)}if(D.r===undefined){D.r=1}if(!D.c){D.c=[]}var B=[];D.c.forEach(function(F){if(F.v){F.v.forEach(function(G){B.push(o(F,G))})}else{B.push(F=="self"?D:F)}});D.c=B;D.c.forEach(function(F){x(F,D)});if(D.starts){x(D.starts,C)}var A=D.c.map(function(F){return F.bK?"\\.?\\b("+F.b+")\\b\\.?":F.b}).concat([D.tE]).concat([D.i]).map(v).filter(Boolean);D.t=A.length?w(A.join("|"),true):{exec:function(F){return null}};D.continuation={}}x(y)}function c(S,L,J,R){function v(U,V){for(var T=0;T<V.c.length;T++){if(i(V.c[T].bR,U)){return V.c[T]}}}function z(U,T){if(i(U.eR,T)){return U}if(U.eW){return z(U.parent,T)}}function A(T,U){return !J&&i(U.iR,T)}function E(V,T){var U=M.cI?T[0].toLowerCase():T[0];return V.k.hasOwnProperty(U)&&V.k[U]}function w(Z,X,W,V){var T=V?"":b.classPrefix,U='<span class="'+T,Y=W?"":"</span>";U+=Z+'">';return U+X+Y}function N(){var U=k(C);if(!I.k){return U}var T="";var X=0;I.lR.lastIndex=0;var V=I.lR.exec(U);while(V){T+=U.substr(X,V.index-X);var W=E(I,V);if(W){H+=W[1];T+=w(W[0],V[0])}else{T+=V[0]}X=I.lR.lastIndex;V=I.lR.exec(U)}return T+U.substr(X)}function F(){if(I.sL&&!f[I.sL]){return k(C)}var T=I.sL?c(I.sL,C,true,I.continuation.top):g(C);if(I.r>0){H+=T.r}if(I.subLanguageMode=="continuous"){I.continuation.top=T.top}return w(T.language,T.value,false,true)}function Q(){return I.sL!==undefined?F():N()}function P(V,U){var T=V.cN?w(V.cN,"",true):"";if(V.rB){D+=T;C=""}else{if(V.eB){D+=k(U)+T;C=""}else{D+=T;C=U}}I=Object.create(V,{parent:{value:I}})}function G(T,X){C+=T;if(X===undefined){D+=Q();return 0}var V=v(X,I);if(V){D+=Q();P(V,X);return V.rB?0:X.length}var W=z(I,X);if(W){var U=I;if(!(U.rE||U.eE)){C+=X}D+=Q();do{if(I.cN){D+="</span>"}H+=I.r;I=I.parent}while(I!=W.parent);if(U.eE){D+=k(X)}C="";if(W.starts){P(W.starts,"")}return U.rE?0:X.length}if(A(X,I)){throw new Error('Illegal lexeme "'+X+'" for mode "'+(I.cN||"<unnamed>")+'"')}C+=X;return X.length||1}var M=j(S);if(!M){throw new Error('Unknown language: "'+S+'"')}m(M);var I=R||M;var D="";for(var K=I;K!=M;K=K.parent){if(K.cN){D=w(K.cN,D,true)}}var C="";var H=0;try{var B,y,x=0;while(true){I.t.lastIndex=x;B=I.t.exec(L);if(!B){break}y=G(L.substr(x,B.index-x),B[0]);x=B.index+y}G(L.substr(x));for(var K=I;K.parent;K=K.parent){if(K.cN){D+="</span>"}}return{r:H,value:D,language:S,top:I}}catch(O){if(O.message.indexOf("Illegal")!=-1){return{r:0,value:k(L)}}else{throw O}}}function g(y,x){x=x||b.languages||Object.keys(f);var v={r:0,value:k(y)};var w=v;x.forEach(function(z){if(!j(z)){return}var A=c(z,y,false);A.language=z;if(A.r>w.r){w=A}if(A.r>v.r){w=v;v=A}});if(w.language){v.second_best=w}return v}function h(v){if(b.tabReplace){v=v.replace(/^((<[^>]+>|\t)+)/gm,function(w,z,y,x){return z.replace(/\t/g,b.tabReplace)})}if(b.useBR){v=v.replace(/\n/g,"<br>")}return v}function p(z){var y=d(z);var A=r(z);if(A=="no-highlight"){return}var v=A?c(A,y,true):g(y);var w=u(z);if(w.length){var x=document.createElementNS("http://www.w3.org/1999/xhtml","pre");x.innerHTML=v.value;v.value=q(w,u(x),y)}v.value=h(v.value);z.innerHTML=v.value;z.className+=" hljs "+(!A&&v.language||"");z.result={language:v.language,re:v.r};if(v.second_best){z.second_best={language:v.second_best.language,re:v.second_best.r}}}var b={classPrefix:"hljs-",tabReplace:null,useBR:false,languages:undefined};function s(v){b=o(b,v)}function l(){if(l.called){return}l.called=true;var v=document.querySelectorAll("pre code");Array.prototype.forEach.call(v,p)}function a(){addEventListener("DOMContentLoaded",l,false);addEventListener("load",l,false)}var f={};var n={};function e(v,x){var w=f[v]=x(this);if(w.aliases){w.aliases.forEach(function(y){n[y]=v})}}function j(v){return f[v]||f[n[v]]}this.highlight=c;this.highlightAuto=g;this.fixMarkup=h;this.highlightBlock=p;this.configure=s;this.initHighlighting=l;this.initHighlightingOnLoad=a;this.registerLanguage=e;this.getLanguage=j;this.inherit=o;this.IR="[a-zA-Z][a-zA-Z0-9_]*";this.UIR="[a-zA-Z_][a-zA-Z0-9_]*";this.NR="\\b\\d+(\\.\\d+)?";this.CNR="(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";this.BNR="\\b(0b[01]+)";this.RSR="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";this.BE={b:"\\\\[\\s\\S]",r:0};this.ASM={cN:"string",b:"'",e:"'",i:"\\n",c:[this.BE]};this.QSM={cN:"string",b:'"',e:'"',i:"\\n",c:[this.BE]};this.CLCM={cN:"comment",b:"//",e:"$"};this.CBLCLM={cN:"comment",b:"/\\*",e:"\\*/"};this.HCM={cN:"comment",b:"#",e:"$"};this.NM={cN:"number",b:this.NR,r:0};this.CNM={cN:"number",b:this.CNR,r:0};this.BNM={cN:"number",b:this.BNR,r:0};this.REGEXP_MODE={cN:"regexp",b:/\//,e:/\/[gim]*/,i:/\n/,c:[this.BE,{b:/\[/,e:/\]/,r:0,c:[this.BE]}]};this.TM={cN:"title",b:this.IR,r:0};this.UTM={cN:"title",b:this.UIR,r:0}}();hljs.registerLanguage("javascript",function(a){return{aliases:["js"],k:{keyword:"in if for while finally var new function do return void else break catch instanceof with throw case default try this switch continue typeof delete let yield const class",literal:"true false null undefined NaN Infinity",built_in:"eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Error EvalError InternalError RangeError ReferenceError StopIteration SyntaxError TypeError URIError Number Math Date String RegExp Array Float32Array Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require"},c:[{cN:"pi",b:/^\s*('|")use strict('|")/,r:10},a.ASM,a.QSM,a.CLCM,a.CBLCLM,a.CNM,{b:"("+a.RSR+"|\\b(case|return|throw)\\b)\\s*",k:"return throw case",c:[a.CLCM,a.CBLCLM,a.REGEXP_MODE,{b:/</,e:/>;/,r:0,sL:"xml"}],r:0},{cN:"function",bK:"function",e:/\{/,c:[a.inherit(a.TM,{b:/[A-Za-z$_][0-9A-Za-z$_]*/}),{cN:"params",b:/\(/,e:/\)/,c:[a.CLCM,a.CBLCLM],i:/["'\(]/}],i:/\[|%/},{b:/\$[(.]/},{b:"\\."+a.IR,r:0}]}});hljs.registerLanguage("css",function(a){var b="[a-zA-Z-][a-zA-Z0-9_-]*";var c={cN:"function",b:b+"\\(",e:"\\)",c:["self",a.NM,a.ASM,a.QSM]};return{cI:true,i:"[=/|']",c:[a.CBLCLM,{cN:"id",b:"\\#[A-Za-z0-9_-]+"},{cN:"class",b:"\\.[A-Za-z0-9_-]+",r:0},{cN:"attr_selector",b:"\\[",e:"\\]",i:"$"},{cN:"pseudo",b:":(:)?[a-zA-Z0-9\\_\\-\\+\\(\\)\\\"\\']+"},{cN:"at_rule",b:"@(font-face|page)",l:"[a-z-]+",k:"font-face page"},{cN:"at_rule",b:"@",e:"[{;]",c:[{cN:"keyword",b:/\S+/},{b:/\s/,eW:true,eE:true,r:0,c:[c,a.ASM,a.QSM,a.NM]}]},{cN:"tag",b:b,r:0},{cN:"rules",b:"{",e:"}",i:"[^\\s]",r:0,c:[a.CBLCLM,{cN:"rule",b:"[^\\s]",rB:true,e:";",eW:true,c:[{cN:"attribute",b:"[A-Z\\_\\.\\-]+",e:":",eE:true,i:"[^\\s]",starts:{cN:"value",eW:true,eE:true,c:[c,a.NM,a.QSM,a.ASM,a.CBLCLM,{cN:"hexcolor",b:"#[0-9A-Fa-f]+"},{cN:"important",b:"!important"}]}}]}]}]}});hljs.registerLanguage("xml",function(a){var c="[A-Za-z0-9\\._:-]+";var d={b:/<\?(php)?(?!\w)/,e:/\?>/,sL:"php",subLanguageMode:"continuous"};var b={eW:true,i:/</,r:0,c:[d,{cN:"attribute",b:c,r:0},{b:"=",r:0,c:[{cN:"value",v:[{b:/"/,e:/"/},{b:/'/,e:/'/},{b:/[^\s\/>]+/}]}]}]};return{aliases:["html"],cI:true,c:[{cN:"doctype",b:"<!DOCTYPE",e:">",r:10,c:[{b:"\\[",e:"\\]"}]},{cN:"comment",b:"<!--",e:"-->",r:10},{cN:"cdata",b:"<\\!\\[CDATA\\[",e:"\\]\\]>",r:10},{cN:"tag",b:"<style(?=\\s|>|$)",e:">",k:{title:"style"},c:[b],starts:{e:"</style>",rE:true,sL:"css"}},{cN:"tag",b:"<script(?=\\s|>|$)",e:">",k:{title:"script"},c:[b],starts:{e:"<\/script>",rE:true,sL:"javascript"}},{b:"<%",e:"%>",sL:"vbscript"},d,{cN:"pi",b:/<\?\w+/,e:/\?>/,r:10},{cN:"tag",b:"</?",e:"/?>",c:[{cN:"title",b:"[^ /><]+",r:0},b]}]}});
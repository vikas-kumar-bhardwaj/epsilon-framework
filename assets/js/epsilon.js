/**
 * File epsilon.js.
 *
 *
 * Epsilon Framework
 */
/*jshint -W065 */
(function( $ ) {
  var EpsilonFramework = {};

  EpsilonFramework.rangeSliders = function( selector ) {
    var context = $( selector ),
        sliders = context.find( '.slider-container' ),
        slider, input, inputId, id, min, max, step;

    $.each( sliders, function() {
      var slider = $( this ).find( '.ss-slider' ),
          input = $( this ).find( '.rl-slider' ),
          inputId = input.attr( 'id' ),
          id = slider.attr( 'id' ),
          min = $( '#' + id ).attr( 'data-attr-min' ),
          max = $( '#' + id ).attr( 'data-attr-max' ),
          step = $( '#' + id ).attr( 'data-attr-step' );

      $( '#' + id ).slider( {
        value: $( '#' + inputId ).attr( 'value' ),
        range: 'min',
        min: parseFloat( min ),
        max: parseFloat( max ),
        step: parseFloat( step ),
        slide: function( event, ui ) {
          $( '#' + inputId ).attr( 'value', ui.value ).change();
        }
      } );

      $( input ).on( 'focus', function() {
        $( this ).blur();
      } );

      $( '#' + inputId ).attr( 'value', ( $( '#' + id ).slider( 'value' ) ) );
      $( '#' + inputId ).change( function() {
        $( '#' + id ).slider( {
          value: $( this ).val()
        } );
      } );
    } );
  };

  EpsilonFramework.typography = {
    /**
     * Selectize instance
     */
    _selectize: null,

    /**
     * K/V Pair
     */
    _linkedFonts: {},

    /**
     * Initiate function
     * @private
     */
    _init: function() {
      var selector = $( '.epsilon-typography-container' ),
          self = this;

      if ( selector.length ) {
        $.each( selector, function() {
          var container = $( this ),
              uniqueId = container.attr( 'data-unique-id' ),
              selects = container.find( 'select' ),
              inputs = container.find( '.epsilon-typography-input' );

          /**
           * Instantiate the selectize javascript plugin
           * and the input type number
           */
          try {
            self._selectize = selects.selectize();

            $.each( selects, function() {
              self._linkedFonts[ $( selects[ 0 ] ).attr( 'id' ) ] = $(
                  selects[ 1 ] ).attr( 'id' );
            } );

          }
          catch ( err ) {
            /**
             * In case the selectize plugin is not loaded, raise an error
             */
            console.warn( 'selectize not yet loaded' );
          }
          /**
           * On triggering the change event, create a json with the values and
           * send it to the preview window
           */
          inputs.on( 'change', function() {
            var val = EpsilonFramework.typography._parseJson( inputs,
                uniqueId );
            $( '#hidden_input_' + uniqueId ).val( val ).trigger( 'change' );
          } );
        } );

        $.each( $( '.epsilon-number-field' ), function() {
          EpsilonFramework.typography._number( $( this ) );
        } );
        /**
         * Add/subtract from the input type number fields
         */
        $( '.incrementor' ).on( 'click', function( e ) {
          e.preventDefault();
          EpsilonFramework.typography._calcValue( $( this ) );
        } );

        /**
         * Don't allow a value smaller than 0 in number fields
         */
        $( '.epsilon-number-field' ).find( 'input' ).on( 'change', function() {
          if ( $( this ).val() < 0 ) {
            $( this ).val( 0 ).trigger( 'change' );
          }
        } );

        $.each( self._linkedFonts, function( $id, $target ) {
          $( '#' + $id ).on( 'change', function() {
            if ( 'Select font' === $( this ).val() ||
                'default_font' === $( this ).val() ) {
              EpsilonFramework.typography._setSelects( $( this ).val(), $target,
                  true );
            }

            EpsilonFramework.typography._setSelects( $( this ).val(), $target,
                false );
          } );
        } );

        /**
         * Reset button
         */
        $( '.epsilon-typography-default' ).on( 'click', function( e ) {
          e.preventDefault();
          EpsilonFramework.typography._resetDefault( $( this ) );
        } );
      }
    },

    /**
     *
     * @param value
     * @param target
     * @param reset
     * @private
     */
    _setSelects: function( value, target, reset ) {
      var data = {
            'action': 'epsilon_retrieve_font_weights',
            'class': 'Epsilon_Typography',
            'args': value
          },
          selectize = $( '#' + target ),
          instance = selectize[ 0 ].selectize;

      if ( reset ) {
        instance.clear();
        instance.clearOptions();
        instance.load( function( callback ) {
          var obj = { 'text': 'Theme default', 'value': 'initial' };
          callback( obj );
        } );
        instance.setValue( 'initial' );

        return;
      }

      jQuery.ajax( {
        dataType: 'json',
        type: 'POST',
        url: WPUrls.ajaxurl,
        data: data,
        complete: function( json ) {
          var jsonResponse = $.parseJSON( json.responseText );
          instance.clear();
          instance.clearOptions();
          instance.load( function( callback ) {
            callback( jsonResponse );
          } );
          instance.setValue( 'initial' );
        }
      } );
    },

    /**
     * Reset defaults
     *
     * @param element
     * @private
     */
    _resetDefault: function( element ) {
      var container = $( element ).parent(),
          uniqueId = container.attr( 'data-unique-id' ),
          selects = container.find( 'select' ),
          inputs = container.find( 'inputs' );

      var fontFamily = selects[ 0 ].selectize,
          fontWeight = selects[ 1 ].selectize,
          fontStyle = selects[ 2 ].selectize;

      var object = {
            'action': 'epsilon_generate_typography_css',
            'class': 'Epsilon_Typography',
            'id': uniqueId,
            'data': {
              'selectors': $( '#selectors_' + uniqueId ).val(),
              'json': {}
            }
          },
          api = wp.customize;

      fontFamily.setValue( 'default_font' );
      fontStyle.setValue( 'initial' );

      if ( $( '#' + uniqueId + '-font-size' ).length ) {
        $( '#' + uniqueId + '-font-size' ).val( '15' ).trigger( 'blur' );
        object.data.json[ 'font-size' ] = '15';
      }

      if ( $( '#' + uniqueId + '-line-height' ).length ) {
        $( '#' + uniqueId + '-line-height' ).
            val( '22' ).
            trigger( 'change' ).
            trigger( 'blur' );
        object.data.json[ 'line-height' ] = '22';
      }

      object.data.json[ 'font-family' ] = 'default_font';
      object.data.json[ 'font-weight' ] = 'initial';
      object.data.json[ 'font-style' ] = 'initial';

      api.previewer.send( 'update-inline-css', object );
    },

    /**
     * Parse/create the json and send it to the preview window
     *
     * @param inputs
     * @param id
     * @private
     */
    _parseJson: function( inputs, id ) {
      var object = {
            'action': 'epsilon_generate_typography_css',
            'class': 'Epsilon_Typography',
            'id': id,
            'data': {
              'selectors': $( '#selectors_' + id ).val(),
              'json': {}
            }
          },
          api = wp.customize;

      $.each( inputs, function( index, value ) {
        var key = $( value ).attr( 'id' ),
            replace = id + '-';
        key = key.replace( replace, '' );

        object.data.json[ key ] = $( value ).val();
      } );

      api.previewer.send( 'update-inline-css', object );
      return JSON.stringify( object.data );
    },

    /**
     * Initiate the Number fields
     *
     * @param el
     * @private
     */
    _number: function( el ) {
      var input = el.find( 'input' );
      input.on( 'blur keypress keyup change', function() {
        var unit = $( this ).siblings( 'span' );
        if ( $( this ).val() > 99 ) {
          unit.animate( { 'left': 35 }, 0 );
        } else {
          unit.animate( { 'left': 25 }, 0 );
        }
      } );

      el.append(
          '<a href="#" class="arrow-up incrementor"  data-increment="up"><span class="dashicons dashicons-arrow-up"></span></a>' +
          '<a href="#" class="arrow-down incrementor" data-increment="down"><span class="dashicons dashicons-arrow-down"></span></a>' );
    },

    /**
     * Calculate the value of the input number fields
     *
     * @param el
     * @private
     */
    _calcValue: function( el ) {
      var input = $( el.siblings( 'input' ) ),
          unit = input.siblings( 'span' );

      switch ( $( el ).attr( 'data-increment' ) ) {
        case 'up':
          if ( 99 === parseInt( input.val() ) ) {
            unit.animate( { 'left': 35 }, 10 );
          }
          input.val( parseInt( input.val() ) + 1 ).trigger( 'change' );
          break;
        case 'down':
          if ( 0 === parseInt( input.val() ) ) {
            return;
          }
          if ( 100 === parseInt( input.val() ) ) {
            unit.animate( { 'left': 25 }, 10 );
          }
          input.val( parseInt( input.val() ) - 1 ).trigger( 'change' );
          break;
      }
    }
  };

  /**
   * Recommended action section scripting
   *
   * @type {{_init: _init, dismissActions: dismissActions, dismissPlugins:
   *     dismissPlugins}}
   */
  EpsilonFramework.recommendedActions = {
    /**
     * Initiate the click actions
     *
     * @private
     */
    _init: function() {
      var context = $( '.control-section-epsilon-section-recommended-actions' ),
          dismissPlugin = context.find( '.epsilon-recommended-plugin-button' ),
          dismissAction = context.find( '.epsilon-dismiss-required-action' );

      /**
       * Dismiss actions
       */
      this.dismissActions( dismissAction );
      /**
       * Dismiss plugins
       */
      this.dismissPlugins( dismissPlugin );
    },

    /**
     * Dismiss actions function, hides the container and shows the next one
     * while changing the INDEX in the title
     * @param selectors
     */
    dismissActions: function( selectors ) {
      selectors.on( 'click', function() {
        /**
         * During ajax, we lose scope - so declare "self"
         * @type {*}
         */
        var self = $( this ),
            /**
             * Get the container
             */
            container = self.parents(
                '.epsilon-recommended-actions-container' ),
            /**
             * Get the current index
             *
             * @type {Number}
             */
            index = parseInt( container.attr( 'data-index' ) ),
            /**
             * Get the title
             *
             * @type {*}
             */
            title = container.parents(
                '.control-section-epsilon-section-recommended-actions' ).
                find( 'h3' ),
            /**
             * Get the indew from the notice
             *
             * @type {*}
             */
            notice = title.find( '.epsilon-actions-count > .current-index' ),
            /**
             * Get the total
             *
             * @type {Number}
             */
            total = parseInt( notice.attr( 'data-total' ) ),
            /**
             * Get the next element ( this will be shown next )
             */
            next = container.next(),
            /**
             * Create the args object for the AJAX call
             *
             * action [ Class, Method Name ]
             * args [ parameters to be sent to method ]
             *
             * @type {{action: [*], args: {id: *, option: *}}}
             */
            args = {
              'action': [ 'Epsilon_Framework', 'dismiss_required_action' ],
              'args': {
                'id': $( this ).attr( 'id' ),
                'option': $( this ).attr( 'data-option' )
              }
            },
            replace, plugins, replaceText;

        /**
         * Initiate the AJAX function
         *
         * Note that the Epsilon_Framework class, has the following method :
         *
         * public function epsilon_framework_ajax_action(){};
         *
         * which is used as a proxy to gather $_POST data, verify it
         * and call the needed function, in this case :
         * Epsilon_Framework::dismiss_required_action()
         *
         */
        $.ajax( {
          type: 'POST',
          data: { action: 'epsilon_framework_ajax_action', args: args },
          dataType: 'json',
          url: WPUrls.ajaxurl,
          success: function( data ) {
            /**
             * In case everything is ok, we start changing things
             */
            if ( data.status && 'ok' === data.message ) {
              /**
               * If it's the last element, show plugins
               */

              if ( total <= index ) {
                replace = title.find( '.section-title' );
                plugins = $( '.epsilon-recommended-plugins' );
                replaceText = replace.attr( 'data-social' );

                if ( plugins.length ) {
                  replaceText = replace.attr( 'data-plugin_text' );
                }

                title.find( '.epsilon-actions-count' ).remove();
                replace.text( replaceText );

              }
              /**
               * Else, just change the index
               */
              else {
                notice.text( index + 1 );
              }

              /**
               * Fade the current element and show the next one.
               * We don't need to remove it at this time. Leave it to for
               * server side
               */
              container.fadeOut( '200', function() {
                next.css( { opacity: 1, height: 'initial' } ).fadeIn( '200' );
              } );
            }
          },

          /**
           * Throw errors
           *
           * @param jqXHR
           * @param textStatus
           * @param errorThrown
           */
          error: function( jqXHR, textStatus, errorThrown ) {
            console.log( jqXHR + ' :: ' + textStatus + ' :: ' + errorThrown );
          }
        } );
      } );
    },

    /**
     * Dismiss plugins function, hides the container and shows the next one
     * while changing the INDEX in the title
     * @param selectors
     */
    dismissPlugins: function( selectors ) {
      selectors.on( 'click', function() {
        /**
         * During ajax, we lose scope - so declare "self"
         * @type {*}
         */
        var self = $( this ),
            /**
             * Get the container
             */
            container = self.parents( '.epsilon-recommended-plugins' ),
            /**
             * Get the next element (this will be shown next)
             */
            next = container.next(),
            /**
             * Get the title
             *
             * @type {*}
             */
            title = container.parents(
                '.control-section-epsilon-section-recommended-actions' ).
                find( 'h3' ),
            /**
             * Create the args object for the AJAX call
             *
             * action [ Class, Method Name ]
             * args [ parameters to be sent to method ]
             *
             * @type {{action: [*], args: {id: *, option: *}}}
             */
            args = {
              'action': [ 'Epsilon_Framework', 'dismiss_required_action' ],
              'args': {
                'id': $( this ).attr( 'id' ),
                'option': $( this ).attr( 'data-option' )
              }
            },
            replace, replaceText;

        $.ajax( {
          type: 'POST',
          data: { action: 'epsilon_framework_ajax_action', args: args },
          dataType: 'json',
          url: WPUrls.ajaxurl,
          success: function( data ) {
            /**
             * In case everything is ok, we start changing things
             */
            if ( data.status && 'ok' === data.message ) {
              /**
               * Fade the current element and show the next one.
               * We don't need to remove it at this time. Leave it to for
               * server side
               */
              container.fadeOut( '200', function() {
                if ( next.is( 'p' ) ) {
                  replace = title.find( '.section-title' );
                  replaceText = replace.attr( 'data-social' );

                  replace.text( replaceText );
                }
                next.css( { opacity: 1, height: 'initial' } ).fadeIn( '200' );
              } );
            }
          },

          /**
           * Throw errors
           *
           * @param jqXHR
           * @param textStatus
           * @param errorThrown
           */
          error: function( jqXHR, textStatus, errorThrown ) {
            console.log( jqXHR + ' :: ' + textStatus + ' :: ' + errorThrown );
          }
        } );
      } );
    }
  };

  /**
   * Color scheme generator
   *
   */
  EpsilonFramework.colorSchemes = function() {
    /**
     * Set variables
     */
    var context = $( '.epsilon-color-scheme' ), options, input, json, api,
        colorSettings = [], css = {};

    if ( ! context.length ) {
      return;
    }

    options = context.find( '.epsilon-color-scheme-option' );
    input = context.parent().find( '.epsilon-color-scheme-input' );
    json = $.parseJSON( options.first().find( 'input' ).val() );
    api = wp.customize;
    colorSettings = [];
    css = {
      'action': 'epsilon_generate_color_scheme_css',
      'class': 'Epsilon_Color_Scheme',
      'id': '',
      'data': {}
    };

    $.each( json, function( index, value ) {
      colorSettings.push( index );
    } );

    function updateCSS() {
      _.each( colorSettings, function( setting ) {
        css.data[ setting ] = api( setting )();
      } );
      api.previewer.send( 'update-inline-css', css );
    }

    _.each( colorSettings, function( setting ) {
      api( setting, function( setting ) {
        setting.bind( updateCSS );
      } );
    } );

    /**
     * On clicking a color scheme, update the color pickers
     */
    $( '.epsilon-color-scheme-option' ).on( 'click', function() {
      var val = $( this ).attr( 'data-color-id' ),
          json = $.parseJSON( $( this ).find( 'input' ).val() );

      /**
       * Find the customizer options
       */
      $.each( json, function( index, value ) {
        colorSettings.push( index );
        /**
         * Set values
         */
        wp.customize( index ).set( value );
      } );

      /**
       * Remove the selected class from siblings
       */
      $( this ).
          siblings( '.epsilon-color-scheme-option' ).
          removeClass( 'selected' );
      /**
       * Make active the current selection
       */
      $( this ).addClass( 'selected' );
      /**
       * Trigger change
       */
      input.val( val ).change();

      _.each( colorSettings, function( setting ) {
        api( setting, function( setting ) {
          setting.bind( updateCSS() );
        } );
      } );
    } );
  };

  /**
   * Load the range sliders for the widget updates
   */
  $( document ).on( 'widget-updated widget-added', function( a, selector ) {
    if ( jQuery().slider ) {
      EpsilonFramework.rangeSliders( selector );
    }
  } );

  if ( 'undefined' !== typeof( wp ) ) {
    if ( 'undefined' !== typeof( wp.customize ) ) {
      wp.customize.bind( 'ready', function() {
        EpsilonFramework.typography._init();
        EpsilonFramework.colorSchemes();
        EpsilonFramework.recommendedActions._init();
      } );

      wp.customize.sectionConstructor[ 'epsilon-section-pro' ] = wp.customize.Section.extend(
          {
            attachEvents: function() {
            },
            isContextuallyActive: function() {
              return true;
            }
          } );

      wp.customize.sectionConstructor[ 'epsilon-section-recommended-actions' ] = wp.customize.Section.extend(
          {
            attachEvents: function() {
            },
            isContextuallyActive: function() {
              return true;
            }
          } );
    }
  }

})( jQuery );

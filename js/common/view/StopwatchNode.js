// Copyright 2018, University of Colorado Boulder

/**
 * A digital stopwatch
 * 
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const Circle = require( 'SCENERY/nodes/Circle' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const Text = require( 'SCENERY/nodes/Text' );
  const TimerNode = require( 'SCENERY_PHET/TimerNode' );
  const TimerReadoutNode = require( 'SCENERY_PHET/TimerReadoutNode' );

  // strings
  const picosecondsString = require( 'string!GAS_PROPERTIES/picoseconds' );

  class StopwatchNode extends TimerNode {

    /**
     * @param {Stopwatch} stopwatch
     * @param {Object} [options]
     */
    constructor( stopwatch, options ) {

      options = _.extend( {
        maxValue: 999.99,
        unitsNode: new Text( picosecondsString, {
          font: TimerReadoutNode.DEFAULT_SMALL_FONT
        } )
      }, options );

      super( stopwatch.timeProperty, stopwatch.isRunningProperty, options );

      // Put a red dot at the origin, for debugging layout.
      if ( phet.chipper.queryParameters.dev ) {
        this.addChild( new Circle( 3, { fill: 'red' } ) );
      }

      // move the stopwatch
      stopwatch.locationProperty.linkAttribute( this, 'translation' );

      // show/hide the stopwatch
      stopwatch.visibleProperty.link( visible => {
        this.visible = visible;
        if ( !visible ) {
          this.interruptSubtreeInput(); // interrupt user interactions
        }
      } );
    }
  }

  return gasProperties.register( 'StopwatchNode', StopwatchNode );
} );
 
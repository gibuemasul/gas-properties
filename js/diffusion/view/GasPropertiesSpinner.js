// Copyright 2019, University of Colorado Boulder

/**
 * Specialization of NumberSpinner for this sim. It has the correct options and color profiling for this sim.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const NumberSpinner = require( 'SUN/NumberSpinner' );
  const Property = require( 'AXON/Property' );

  class GasPropertiesSpinner extends NumberSpinner {

    /**
     * @param {NumberProperty} numberProperty
     * @param {Object} [options]
     */
    constructor( numberProperty, options ) {
      assert && assert( numberProperty instanceof NumberProperty, `invalid numberProperty: ${numberProperty}` );
      assert && assert( numberProperty.range, 'numberProperty is missing range' );

      options = _.extend( {
        font: GasPropertiesConstants.CONTROL_FONT,
        xMargin: 8,
        yMargin: 6,
        valueAlign: 'right',
        touchAreaXDilation: 15,
        touchAreaYDilation: 15
      }, options );

      super( numberProperty, new Property( numberProperty.range ), options );
    }
  }

  return gasProperties.register( 'GasPropertiesSpinner', GasPropertiesSpinner );
} );
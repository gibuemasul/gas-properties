// Copyright 2018-2019, University of Colorado Boulder

/**
 * Controls for selecting what should be held constant.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const AquaRadioButton = require( 'SUN/AquaRadioButton' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesColorProfile = require( 'GAS_PROPERTIES/common/GasPropertiesColorProfile' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const HoldConstantEnum = require( 'GAS_PROPERTIES/common/model/HoldConstantEnum' );
  const Text = require( 'SCENERY/nodes/Text' );
  const VBox = require( 'SCENERY/nodes/VBox' );

  // strings
  const holdConstantNothingString = require( 'string!GAS_PROPERTIES/holdConstant.nothing' );
  const holdConstantPressureTString = require( 'string!GAS_PROPERTIES/holdConstant.pressureT' );
  const holdConstantPressureVString = require( 'string!GAS_PROPERTIES/holdConstant.pressureV' );
  const holdConstantString = require( 'string!GAS_PROPERTIES/holdConstant' );
  const holdConstantTemperatureString = require( 'string!GAS_PROPERTIES/holdConstant.temperature' );
  const holdConstantVolumeString = require( 'string!GAS_PROPERTIES/holdConstant.volume' );

  // constants
  const RADIO_BUTTON_OPTIONS = {
    radius: 10,
    xSpacing: 10
  };
  const TEXT_OPTIONS = {
    font: GasPropertiesConstants.CONTROL_FONT,
    fill: GasPropertiesColorProfile.textFillProperty
  };
  
  class HoldConstantControls extends VBox {

    /**
     * @param {StringProperty} holdConstantProperty
     * @param {Object} [options]
     */
    constructor( holdConstantProperty, options ) {

      options = _.extend( {
        align: 'left',
        spacing: 12
      }, options );

      const titleNode = new Text( holdConstantString, {
        font: GasPropertiesConstants.TITLE_FONT,
        fill: GasPropertiesColorProfile.textFillProperty
      } );

      const nothingRadioButton = new AquaRadioButton( holdConstantProperty, HoldConstantEnum.NOTHING,
        new Text( holdConstantNothingString, TEXT_OPTIONS ),
        RADIO_BUTTON_OPTIONS );

      const volumeRadioButton = new AquaRadioButton( holdConstantProperty, HoldConstantEnum.VOLUME,
        new Text( holdConstantVolumeString, TEXT_OPTIONS ),
        RADIO_BUTTON_OPTIONS );

      const temperatureRadioButton = new AquaRadioButton( holdConstantProperty, HoldConstantEnum.TEMPERATURE,
        new Text( holdConstantTemperatureString, TEXT_OPTIONS ),
        RADIO_BUTTON_OPTIONS );

      const pressureVRadioButton = new AquaRadioButton( holdConstantProperty, HoldConstantEnum.PRESSURE_V,
        new Text( holdConstantPressureVString, TEXT_OPTIONS ),
        RADIO_BUTTON_OPTIONS );

      const pressureTRadioButton = new AquaRadioButton( holdConstantProperty, HoldConstantEnum.PRESSURE_T,
        new Text( holdConstantPressureTString, TEXT_OPTIONS ),
        RADIO_BUTTON_OPTIONS );

      assert && assert( !options.hasOwnProperty( 'children' ), 'HoldConstantControls sets children' );
      options = _.extend( {
        children: [
          titleNode,
          nothingRadioButton,
          volumeRadioButton,
          temperatureRadioButton,
          pressureVRadioButton,
          pressureTRadioButton
        ]
      }, options );

      super( options );
    }
  }

  return gasProperties.register( 'HoldConstantControls', HoldConstantControls );
} );
// Copyright 2018, University of Colorado Boulder

/**
 * The view for the 'Intro' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var BooleanProperty = require( 'AXON/BooleanProperty' );
  var gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  var GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  var HoldConstantPanel = require( 'GAS_PROPERTIES/intro/view/HoldConstantPanel' );
  var inherit = require( 'PHET_CORE/inherit' );
  var ParticleCountsAccordionBox = require( 'GAS_PROPERTIES/intro/view/ParticleCountsAccordionBox' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var ScreenView = require( 'JOIST/ScreenView' );

  /**
   * @param {IntroModel} model
   * @constructor
   */
  function IntroScreenView( model ) {

    ScreenView.call( this );

    // view-specific Properties
    var particleCountsExpandedProperty = new BooleanProperty( false );

    var holdConstantPanel = new HoldConstantPanel( model.holdConstantProperty, {
      right: this.layoutBounds.right - GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
      top: this.layoutBounds.top + GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
    } );
    this.addChild( holdConstantPanel );

    var particleCountsAccordionBox = new ParticleCountsAccordionBox(
      model.numberOfHeavyParticlesProperty, model.numberOfLightParticlesProperty, {
        expandedProperty: particleCountsExpandedProperty,
        right: holdConstantPanel.right,
        top: holdConstantPanel.bottom + 15
      } );
    this.addChild( particleCountsAccordionBox );

    // Reset All button
    var resetAllButton = new ResetAllButton( {
      listener: function() {
        model.reset();
        particleCountsExpandedProperty.reset();
      },
      right: this.layoutBounds.maxX - GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
      bottom: this.layoutBounds.maxY - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
    } );
    this.addChild( resetAllButton );
  }

  gasProperties.register( 'IntroScreenView', IntroScreenView );

  return inherit( ScreenView, IntroScreenView );
} );
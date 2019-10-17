// Copyright 2019, University of Colorado Boulder

/**
 * EraseParticlesButton is the button for erasing (deleting) all particles from the container.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const EraserButton = require( 'SCENERY_PHET/buttons/EraserButton' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesColorProfile = require( 'GAS_PROPERTIES/common/GasPropertiesColorProfile' );
  const merge = require( 'PHET_CORE/merge' );
  const ParticleSystem = require( 'GAS_PROPERTIES/common/model/ParticleSystem' );

  class EraseParticlesButton extends EraserButton {

    /**
     * @param {ParticleSystem} particleSystem
     * @param {Object} [options]
     */
    constructor( particleSystem, options ) {
      assert && assert( particleSystem instanceof ParticleSystem, `invalid particleSystem: ${particleSystem}` );

      options = merge( {

        // superclass options
        baseColor: GasPropertiesColorProfile.eraserButtonColorProperty
      }, options );

      // Deletes all particles when the button fires.
      assert && assert( !options.listener, 'EraseParticlesButton sets listener' );
      options.listener = () => {
        particleSystem.removeAllParticles();
      };

      super( options );

      // Disables the button when the container is empty.
      particleSystem.numberOfParticlesProperty.link( numberOfParticles => {
        this.enabled = ( numberOfParticles !== 0 );
      } );
    }
  }

  return gasProperties.register( 'EraseParticlesButton', EraseParticlesButton );
} );
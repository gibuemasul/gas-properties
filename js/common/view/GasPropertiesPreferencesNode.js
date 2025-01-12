// Copyright 2022, University of Colorado Boulder

/**
 * GasPropertiesPreferencesNode is the user interface for sim-specific preferences, accessed via the Preferences dialog.
 * These preferences are global, and affect all screens.
 *
 * The Preferences dialog is created on demand by joist, using a PhetioCapsule. So GasPropertiesPreferencesNode must
 * implement dispose, and all elements of GasPropertiesPreferencesNode that have tandems must be disposed.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import merge from '../../../../phet-core/js/merge.js';
import { VBox } from '../../../../scenery/js/imports.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import gasProperties from '../../gasProperties.js';
import GasPropertiesPreferences from '../model/GasPropertiesPreferences.js';
import { PressureNoiseCheckbox } from './PressureNoiseCheckbox.js';

export default class GasPropertiesPreferencesNode extends VBox {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {

    options = merge( {

      // phet-io
      tandem: Tandem.REQUIRED
    }, options );

    const children = [];

    // Pressure Noise checkbox
    const pressureNoiseCheckbox = new PressureNoiseCheckbox( GasPropertiesPreferences.pressureNoiseProperty, {
      tandem: options.tandem.createTandem( 'pressureNoiseCheckbox' )
    } );
    children.push( pressureNoiseCheckbox );

    assert && assert( !options.children, 'GasPropertiesPreferencesNode sets children' );
    options.children = children;

    super( options );

    // @private
    this.disposeGasPropertiesPreferencesNode = () => {
      children.forEach( child => child.dispose() );
    };
  }

  /**
   * @public
   * @override
   */
  dispose() {
    this.disposeGasPropertiesPreferencesNode();
    super.dispose();
  }
}

gasProperties.register( 'GasPropertiesPreferencesNode', GasPropertiesPreferencesNode );
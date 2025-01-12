// Copyright 2019-2022, University of Colorado Boulder

/**
 * CenterOfMassCheckbox is the checkbox used to show/hide the center-of-mass indicators on the container.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import merge from '../../../../phet-core/js/merge.js';
import GasPropertiesCheckbox from '../../common/view/GasPropertiesCheckbox.js';
import GasPropertiesIconFactory from '../../common/view/GasPropertiesIconFactory.js';
import gasProperties from '../../gasProperties.js';
import GasPropertiesStrings from '../../GasPropertiesStrings.js';

class CenterOfMassCheckbox extends GasPropertiesCheckbox {

  /**
   * @param {BooleanProperty} centerOfMassVisibleProperty
   * @param {Object} [options]
   */
  constructor( centerOfMassVisibleProperty, options ) {
    assert && assert( centerOfMassVisibleProperty instanceof BooleanProperty,
      `invalid centerOfMassVisibleProperty: ${centerOfMassVisibleProperty}` );

    options = merge( {

      // superclass options
      textIconSpacing: 12
    }, options );

    assert && assert( !options.text, 'CenterOfMassCheckbox sets text' );
    assert && assert( !options.icon, 'CenterOfMassCheckbox sets icon' );
    options = merge( {
      text: GasPropertiesStrings.centerOfMass,
      icon: GasPropertiesIconFactory.createCenterOfMassIcon()
    }, options );

    super( centerOfMassVisibleProperty, options );
  }
}

gasProperties.register( 'CenterOfMassCheckbox', CenterOfMassCheckbox );
export default CenterOfMassCheckbox;
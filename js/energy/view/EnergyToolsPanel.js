// Copyright 2018-2021, University of Colorado Boulder

/**
 * EnergyToolsPanel is the panel that appears in the upper-right corner of the 'Energy' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import merge from '../../../../phet-core/js/merge.js';
import { VBox } from '../../../../scenery/js/imports.js';
import Panel from '../../../../sun/js/Panel.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import GasPropertiesConstants from '../../common/GasPropertiesConstants.js';
import FixedWidthNode from '../../common/view/FixedWidthNode.js';
import StopwatchCheckbox from '../../common/view/StopwatchCheckbox.js';
import WidthCheckbox from '../../common/view/WidthCheckbox.js';
import gasProperties from '../../gasProperties.js';

class EnergyToolsPanel extends Panel {

  /**
   * @param {BooleanProperty} widthVisibleProperty
   * @param {BooleanProperty} stopwatchVisibleProperty
   * @param {Object} [options]
   */
  constructor( widthVisibleProperty, stopwatchVisibleProperty, options ) {
    assert && assert( widthVisibleProperty instanceof BooleanProperty,
      `invalid widthVisibleProperty: ${widthVisibleProperty}` );
    assert && assert( stopwatchVisibleProperty instanceof BooleanProperty,
      `invalid stopwatchVisibleProperty: ${stopwatchVisibleProperty}` );

    options = merge( {
      fixedWidth: 100,
      xMargin: 0,

      // phet-io
      tandem: Tandem.REQUIRED
    }, GasPropertiesConstants.PANEL_OPTIONS, options );

    const contentWidth = options.fixedWidth - ( 2 * options.xMargin );

    const checkboxOptions = {
      textMaxWidth: 110 // determined empirically
    };

    const content = new FixedWidthNode( contentWidth, new VBox( {
      align: 'left',
      spacing: 12,
      children: [
        new WidthCheckbox( widthVisibleProperty, merge( {}, checkboxOptions, {
          tandem: options.tandem.createTandem( 'widthCheckbox' )
        } ) ),
        new StopwatchCheckbox( stopwatchVisibleProperty, merge( {}, checkboxOptions, {
          tandem: options.tandem.createTandem( 'stopwatchCheckbox' )
        } ) )
      ]
    } ) );

    super( content, options );
  }
}

gasProperties.register( 'EnergyToolsPanel', EnergyToolsPanel );
export default EnergyToolsPanel;
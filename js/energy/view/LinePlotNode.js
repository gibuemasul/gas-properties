// Copyright 2019, University of Colorado Boulder

/**
 * Plots histogram data as a set of connected line segments. Used for the specifies-specific histogram data.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const ColorDef = require( 'SCENERY/util/ColorDef' );
  const Dimension2 = require( 'DOT/Dimension2' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const Path = require( 'SCENERY/nodes/Path' );
  const Shape = require( 'KITE/Shape' );

  class LinePlotNode extends Path {

    /**
     * @param {ColorDef} color
     * @param {number} lineWidth
     * @param {Dimension2} chartSize
     * @param {NumberProperty} yScaleProperty
     */
    constructor( color, lineWidth, chartSize, yScaleProperty ) {
      assert && assert( color !== null && ColorDef.isColorDef( color ), `invalid color: ${color}` );
      assert && assert( typeof lineWidth === 'number' && lineWidth > 0, `invalid lineWidth: ${lineWidth}` );
      assert && assert( chartSize instanceof Dimension2, `invalid chartSize: ${chartSize}` );
      assert && assert( yScaleProperty instanceof NumberProperty, `invalid yScaleProperty: ${yScaleProperty}` );

      super( new Shape(), {
        fill: null,
        stroke: color, // to hide seams
        lineWidth: lineWidth
      } );

      // @private
      this.chartSize = chartSize;
      this.yScaleProperty = yScaleProperty;
    }

    /**
     * Draws the data as a set of line segments.
     * @param {number[]} binCounts - the count for each bin
     * @public
     */
    plot( binCounts ) {
      assert && assert( Array.isArray( binCounts ) && binCounts.length > 0, `invalid binCounts: ${binCounts}` );

      const binWidth = this.chartSize.width / binCounts.length;

      const shape = new Shape().moveTo( 0, this.chartSize.height );
      let previousCount = 0;
      for ( let i = 0; i < binCounts.length; i++ ) {
        const binCount = binCounts[ i ];
        const lineHeight = ( binCount / this.yScaleProperty.value ) * this.chartSize.height;
        const y = this.chartSize.height - lineHeight;
        if ( binCount !== previousCount ) {
          shape.lineTo( i * binWidth, y );
        }
        shape.lineTo( ( i + 1 ) * binWidth, y );
        previousCount = binCount;
      }
      this.shape = shape;
    }
  }

  return gasProperties.register( 'LinePlotNode', LinePlotNode );
} );
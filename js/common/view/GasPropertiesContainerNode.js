// Copyright 2018-2019, University of Colorado Boulder

/**
 * View of the container in for the 'Ideal', 'Explorer', and 'Energy' screens.
 * This container has mutable width, and a lid that can be moved/removed.
 * Do not transform this Node! It's origin must be at the origin of the view coordinate frame.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const DragListener = require( 'SCENERY/listeners/DragListener' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesColorProfile = require( 'GAS_PROPERTIES/common/GasPropertiesColorProfile' );
  const GasPropertiesQueryParameters = require( 'GAS_PROPERTIES/common/GasPropertiesQueryParameters' );
  const HandleNode = require( 'SCENERY_PHET/HandleNode' );
  const HoldConstantEnum = require( 'GAS_PROPERTIES/common/model/HoldConstantEnum' );
  const LidNode = require( 'GAS_PROPERTIES/common/view/LidNode' );
  const Node = require( 'SCENERY/nodes/Node' );
  const Path = require( 'SCENERY/nodes/Path' );
  const Rectangle = require( 'SCENERY/nodes/Rectangle' );
  const Shape = require( 'KITE/Shape' );
  const Util = require( 'DOT/Util' );

  // constants
  const LID_X_SPEED = GasPropertiesQueryParameters.lidSpeedX; // pixels/second
  const LID_Y_SPEED = GasPropertiesQueryParameters.lidSpeedY; // pixels/second
  const LID_ROTATION_SPEED = GasPropertiesQueryParameters.lidSpeedTheta; // degrees/second

  class GasPropertiesContainerNode extends Node {

    /**
     * @param {GasPropertiesContainer} container
     * @param {ModelViewTransform2} modelViewTransform
     * @param {EnumerationProperty} holdConstantProperty
     * @param {Property.<Bounds2>} visibleBoundsProperty
     * @param {Object} [options]
     * @constructor
     */
    constructor( container, modelViewTransform, holdConstantProperty, visibleBoundsProperty, options ) {

      options = _.extend( {
        resizeGripColor: GasPropertiesColorProfile.resizeGripColorProperty, // {ColorDef} color of resize handle's grip
        lidGripColor: GasPropertiesColorProfile.lidGripColorProperty, // {ColorDef} color of the lid handle's grip
        resizeHandleIsPressedListener: isPressed => {} // function(isPressed: boolean)
      }, options );

      // Constant aspects of the container, in view coordinates
      const viewWallThickness = modelViewTransform.modelToViewDeltaX( container.wallThickness );
      const viewOpeningLeftInset = modelViewTransform.modelToViewDeltaX( container.openingLeftInset );
      const viewOpeningRightInset = modelViewTransform.modelToViewDeltaX( container.openingRightInset );

      // Displays the walls of the container
      const wallsNode = new Path( null, {
        stroke: GasPropertiesColorProfile.containerBoundsStrokeProperty,
        lineWidth: viewWallThickness
      } );

      // Displays the previous bounds of the container, visible while dragging.
      // This is a simple rectangle, and does not need to show the previous opening in the top.
      const previousBoundsNode = new Rectangle( 0, 0, 1, 1, {
        stroke: GasPropertiesColorProfile.containerPreviousBoundsStrokeProperty,
        lineWidth: viewWallThickness,
        visible: false
      } );

      const resizeHandleNode = new HandleNode( {
        cursor: 'pointer',
        gripBaseColor: options.resizeGripColor,
        attachmentLineWidth: 1,
        rotation: -Math.PI / 2,
        scale: 0.4
      } );

      const lidNode = new LidNode( {
        cursor: 'pointer',
        baseWidth: modelViewTransform.modelToViewDeltaX( container.lidWidthProperty.value ),
        baseHeight: modelViewTransform.modelToViewDeltaX( container.lidThickness ),
        handleColor: options.lidGripColor
      } );

      assert && assert( !options.children, 'GasPropertiesContainerNode sets children' );
      options = _.extend( {
        children: [ previousBoundsNode, resizeHandleNode, wallsNode, lidNode ]
      }, options );

      super( options );

      // reposition the bottom-left corner of the lid's base, handle may extend past this to the left
      function updateLidPosition() {
        lidNode.x = wallsNode.left;
        lidNode.y = wallsNode.top + viewWallThickness;
      }

      // Update the container when its bounds change.
      container.boundsProperty.link( bounds => {

        // Account for wall thickness, so that container walls are drawn around the container's model bounds.
        const viewBounds = modelViewTransform.modelToViewBounds( bounds )
          .dilated( modelViewTransform.modelToViewDeltaX( container.wallThickness / 2 ) );

        // Update the walls, start at top-left, origin at bottom-right. Shape looks like:
        //  __               ___
        // |                    |
        // |                    |
        // |                    |
        // |____________________|
        //
        wallsNode.shape = new Shape()
          .moveTo( viewBounds.minX + viewOpeningLeftInset, viewBounds.minY )
          .lineTo( viewBounds.minX, viewBounds.minY )
          .lineTo( viewBounds.minX, viewBounds.maxY )
          .lineTo( viewBounds.maxX, viewBounds.maxY )
          .lineTo( viewBounds.maxX, viewBounds.minY )
          .lineTo( viewBounds.maxX - viewOpeningRightInset, viewBounds.minY );

        // reposition the resize handle
        resizeHandleNode.right = wallsNode.left + 1; // hide the overlap
        resizeHandleNode.centerY = wallsNode.centerY;

        // reposition the lid
        updateLidPosition();
      } );

      // Update the lid width
      container.lidWidthProperty.link( lidWidth => {

        // resize the lid's base
        lidNode.setBaseWidth( modelViewTransform.modelToViewDeltaX( lidWidth ) + 1 );  // +1 to cover seam

        // reposition the lid
        updateLidPosition();
      } );

      // Hide the resize handle when volume is held constant
      holdConstantProperty.link( holdConstant => {
        resizeHandleNode.visible = ( holdConstant !== HoldConstantEnum.VOLUME &&
                                     holdConstant !== HoldConstantEnum.PRESSURE_V );
      } );

      // Cancel interaction when visibility of the resize handle changes.
      resizeHandleNode.on( 'visibility', () => resizeHandleNode.interruptSubtreeInput() );

      // Dragging the resize handle horizontally changes the container's width
      const resizeHandleDragListener = new ResizeHandleDragListener( container, modelViewTransform, this );
      resizeHandleNode.addInputListener( resizeHandleDragListener );

      // While interacting with the resize handle...
      resizeHandleDragListener.isPressedProperty.lazyLink( isPressed => {

        // disable interaction with the lid, to simplify implementation
        lidNode.interruptSubtreeInput();
        lidNode.pickable = !isPressed;

        // display the previous bounds of the container if the wall doesn't do work
        previousBoundsNode.visible = isPressed && !container.leftWallDoesWork;
        previousBoundsNode.setRect( wallsNode.shape.bounds.minX, wallsNode.shape.bounds.minY,
          wallsNode.shape.bounds.width, wallsNode.shape.bounds.height );
        options.resizeHandleIsPressedListener( isPressed );

        // when the handle is released, log the opening
        if ( container.isLidOpen() ) {
          !isPressed && phet.log && phet.log( `Container opening from ${container.getOpeningLeft()} to ${container.openingRight} pm` );
        }
      } );

      // Dragging the lid horizontally changes the size of the opening in the top of the container
      lidNode.addInputListener( new LidDragListener( container, modelViewTransform, this ) );

      container.lidIsOnProperty.link( lidIsOn => {
        if ( lidIsOn ) {

          // restore the lid in the fully-closed position
          container.lidWidthProperty.value = container.getMaxLidWidth();
          lidNode.visible = true;
          lidNode.setRotation( 0 );
          updateLidPosition();
          lidNode.visible = true;
        }
      } );

      // @private
      this.container = container;
      this.lidNode = lidNode;
      this.modelViewTransform = modelViewTransform;
      this.visibleBoundsProperty = visibleBoundsProperty;
    }

    /**
     * @param {number} dt - delta time, in seconds
     * @public
     */
    step( dt ) {

      // Blow off the lid
      if ( !this.container.lidIsOnProperty.value && this.lidNode.visible ) {
        if ( this.visibleBoundsProperty.value.intersectsBounds( this.lidNode.bounds ) ) {

          // Lid is inside the visible bounds, animate it.
          const dx = LID_X_SPEED * dt;
          const dy = LID_Y_SPEED * dt;
          this.lidNode.centerX += dx;
          this.lidNode.centerY += dy;
          const dr = Util.toRadians( LID_ROTATION_SPEED) * dt;
          this.lidNode.rotateAround( this.lidNode.center, dr );
        }
        else {

          // Lid has left the visible bounds, hide it.
          this.lidNode.visible = false;
        }
      }
    }
  }

  gasProperties.register( 'GasPropertiesContainerNode', GasPropertiesContainerNode );

  /**
   * Drag listener for the container's resize handle, changes the container's width.
   * Maintains a constant opening size in the top of the container, if possible.
   */
  class ResizeHandleDragListener extends DragListener {

    /**
     * @param {GasPropertiesContainer} container
     * @param {ModelViewTransform2} modelViewTransform
     * @param {Node} parentNode
     */
    constructor( container, modelViewTransform, parentNode ) {

      // pointer's x offset from the left edge of the container, when a drag starts
      let startXOffset = 0;

      super( {

        start: ( event, listener ) => {
          const viewWidth = modelViewTransform.modelToViewX( container.left );
          startXOffset = viewWidth - parentNode.globalToParentPoint( event.pointer.point ).x;
        },

        drag: ( event, listener ) => {

          const viewX = parentNode.globalToParentPoint( event.pointer.point ).x;
          const modelX = modelViewTransform.viewToModelX( viewX + startXOffset );
          const containerWidth = container.widthRange.constrainValue( container.right - modelX );
          container.resize( containerWidth );
        }
      } );
    }
  }

  /**
   * Drag listener for the container's lid, determines the size of the opening in the top of the container.
   */
  class LidDragListener extends DragListener {

    /**
     * @param {GasPropertiesContainer} container
     * @param {ModelViewTransform2} modelViewTransform
     * @param {Node} parentNode
     */
    constructor( container, modelViewTransform, parentNode ) {

      // pointer's x offset from container.getOpeningLeft(), when a drag starts
      let startXOffset = 0;

      super( {

        start: ( event, listener ) => {
          startXOffset = modelViewTransform.modelToViewX( container.getOpeningLeft() ) -
                         parentNode.globalToParentPoint( event.pointer.point ).x;
        },

        drag: ( event, listener ) => {
          const viewX = parentNode.globalToParentPoint( event.pointer.point ).x;
          const modelX = modelViewTransform.viewToModelX( viewX + startXOffset );
          if ( modelX >= container.openingRight ) {

            // the lid is fully closed
            container.lidWidthProperty.value = container.getMaxLidWidth();
          }
          else {

            // the lid is open
            const openingWidth = container.openingRight - modelX;
            container.lidWidthProperty.value =
              Math.max( container.getMaxLidWidth() - openingWidth, container.getMinLidWidth() );
          }
        },

        // when the lid handle is released, log the opening
        end: ( listener ) => {
          phet.log && phet.log( container.isLidOpen() ?
                                `Container is open: ${container.getOpeningLeft()} to ${container.openingRight} pm` :
                                'Container is closed'
          );
        }
      } );
    }
  }

  return GasPropertiesContainerNode;
} );
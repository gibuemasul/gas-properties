// Copyright 2018-2022, University of Colorado Boulder

/**
 * IdealGasLawScreenView is the ScreenView base class for screens that are based on the Ideal Gas Law.
 *
 * Contains these UI components:
 *
 *   Particles
 *   Container
 *   Thermometer
 *   Pressure Gauge
 *   HeaterCooler
 *   Bicycle Pump + radio buttons
 *   Time controls (play/pause, step buttons)
 *   Reset All button
 *
 * Contains these debugging UI components:
 *
 *   Visualization of collision detection regions
 *   Model coordinate frame grid
 *   Pointer coordinates
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import Property from '../../../../axon/js/Property.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import merge from '../../../../phet-core/js/merge.js';
import PointerCoordinatesNode from '../../../../scenery-phet/js/PointerCoordinatesNode.js';
import { Node } from '../../../../scenery/js/imports.js';
import ToggleNode from '../../../../sun/js/ToggleNode.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import gasProperties from '../../gasProperties.js';
import GasPropertiesStrings from '../../GasPropertiesStrings.js';
import GasPropertiesColors from '../GasPropertiesColors.js';
import GasPropertiesConstants from '../GasPropertiesConstants.js';
import GasPropertiesQueryParameters from '../GasPropertiesQueryParameters.js';
import IdealGasLawModel from '../model/IdealGasLawModel.js';
import ParticleType from '../model/ParticleType.js';
import BaseScreenView from './BaseScreenView.js';
import CollisionCounterNode from './CollisionCounterNode.js';
import ContainerWidthNode from './ContainerWidthNode.js';
import EraseParticlesButton from './EraseParticlesButton.js';
import GasPropertiesBicyclePumpNode from './GasPropertiesBicyclePumpNode.js';
import GasPropertiesHeaterCoolerNode from './GasPropertiesHeaterCoolerNode.js';
import GasPropertiesOopsDialog from './GasPropertiesOopsDialog.js';
import GasPropertiesStopwatchNode from './GasPropertiesStopwatchNode.js';
import GasPropertiesThermometerNode from './GasPropertiesThermometerNode.js';
import IdealGasLawContainerNode from './IdealGasLawContainerNode.js';
import IdealGasLawParticleSystemNode from './IdealGasLawParticleSystemNode.js';
import ParticleTypeRadioButtonGroup from './ParticleTypeRadioButtonGroup.js';
import PressureGaugeNode from './PressureGaugeNode.js';
import RegionsNode from './RegionsNode.js';
import ReturnLidButton from './ReturnLidButton.js';

class IdealGasLawScreenView extends BaseScreenView {

  /**
   * @param {IdealGasLawModel} model
   * @param {Property.<ParticleType>} particleTypeProperty
   * @param {BooleanProperty} widthVisibleProperty
   * @param {Tandem} tandem
   * @param {Object} [options]
   */
  constructor( model, particleTypeProperty, widthVisibleProperty, tandem, options ) {
    assert && assert( model instanceof IdealGasLawModel, `invalid model: ${model}` );
    assert && assert( particleTypeProperty instanceof Property,
      `invalid particleTypeProperty: ${particleTypeProperty}` );
    assert && assert( widthVisibleProperty instanceof BooleanProperty,
      `invalid widthVisibleProperty: ${widthVisibleProperty}` );
    assert && assert( tandem instanceof Tandem, `invalid tandem: ${tandem}` );

    options = merge( {
      resizeGripColor: GasPropertiesColors.resizeGripColorProperty
    }, options );

    super( model, tandem, options );

    const containerViewPosition = model.modelViewTransform.modelToViewPosition( model.container.position );

    // Whether the sim was playing before it was programmatically paused.
    let wasPlaying = model.isPlayingProperty.value;

    // Width of the container when interaction with resize handle started, used to compute how to
    // redistribute particles in the new container width.
    let startContainerWidth = model.container.widthProperty.value;

    // Listener for when the container's resize handle is pressed or released.
    let resizeHandleIsPressedListener = null;
    if ( model.container.leftWallDoesWork ) {

      // Resizing the container un-pauses the sim, and the left wall will do work on particles that collide with it.
      resizeHandleIsPressedListener = isPressed => {
        if ( isPressed && !model.isPlayingProperty.value ) {
          model.isPlayingProperty.value = true;
        }
      };
    }
    else {

      // Resizing the container pauses the sim and grays out the particles. The moving wall will have
      // no affect on the velocity of the particles.  The particles will be redistributed in the new volume
      // when the resize handle is released.
      resizeHandleIsPressedListener = isPressed => {
        if ( isPressed ) {

          // save playing state, pause the sim, and disable time controls
          wasPlaying = model.isPlayingProperty.value;
          model.isPlayingProperty.value = false;
          this.timeControlNode.enabledProperty.value = false;

          // gray out the particles
          particleSystemNode.opacity = 0.6;

          // remember width of container
          startContainerWidth = model.container.widthProperty.value;
        }
        else {

          // enable time controls and restore playing state
          this.timeControlNode.enabledProperty.value = true;
          model.isPlayingProperty.value = wasPlaying;

          // make particles opaque
          particleSystemNode.opacity = 1;

          // redistribute the particle
          model.particleSystem.redistributeParticles( model.container.widthProperty.value / startContainerWidth );
        }

        // Interacting with the container's resize handle stops the collision counter.
        if ( model.collisionCounter ) {
          model.collisionCounter.isRunningProperty.value = false;
        }
      };
    }

    // Container
    const containerNode = new IdealGasLawContainerNode( model.container, model.modelViewTransform,
      model.holdConstantProperty, this.visibleBoundsProperty, {
        resizeGripColor: options.resizeGripColor,
        resizeHandleIsPressedListener: resizeHandleIsPressedListener,
        tandem: tandem.createTandem( 'containerNode' )
      } );

    // Return Lid button
    const returnLidButton = new ReturnLidButton( model.container, {
      right: model.modelViewTransform.modelToViewX( model.container.right - model.container.openingRightInset ) - 30,
      bottom: model.modelViewTransform.modelToViewY( model.container.top ) - 15,
      tandem: tandem.createTandem( 'returnLidButton' )
    } );

    // Dimensional arrows that indicate container size
    const containerWidthNode = new ContainerWidthNode( model.container.position, model.container.widthProperty,
      model.modelViewTransform, {
        visibleProperty: widthVisibleProperty,
        tandem: tandem.createTandem( 'containerWidthNode' )
      } );

    // Radio buttons for selecting particle type
    const particleTypeRadioButtonGroup = new ParticleTypeRadioButtonGroup( particleTypeProperty,
      model.modelViewTransform, {
        left: containerNode.right + 20,
        bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN,
        tandem: tandem.createTandem( 'particleTypeRadioButtonGroup' )
      } );

    // Bicycle pump is centered above the radio buttons.
    const bicyclePumpPosition =
      new Vector2( particleTypeRadioButtonGroup.centerX, particleTypeRadioButtonGroup.top - 15 );

    // Bicycle pump hose attaches to the container.
    const hosePosition = model.modelViewTransform.modelToViewPosition( model.container.hosePosition );

    const bicyclePumpOptions = {
      translation: bicyclePumpPosition,
      hoseAttachmentOffset: hosePosition.minus( bicyclePumpPosition ),
      handleTouchAreaXDilation: 35,
      handleTouchAreaYDilation: 35
    };

    // Bicycle pump for heavy particles
    const heavyBicyclePumpNode = new GasPropertiesBicyclePumpNode( model.particleSystem.numberOfHeavyParticlesProperty,
      merge( {}, bicyclePumpOptions, {
        bodyFill: GasPropertiesColors.heavyParticleColorProperty,
        tandem: tandem.createTandem( 'heavyBicyclePumpNode' )
      } ) );

    // Bicycle pump for light particles
    const lightBicyclePumpNode = new GasPropertiesBicyclePumpNode( model.particleSystem.numberOfLightParticlesProperty,
      merge( {}, bicyclePumpOptions, {
        bodyFill: GasPropertiesColors.lightParticleColorProperty,
        tandem: tandem.createTandem( 'lightBicyclePumpNode' )
      } ) );

    // Toggle button for switching between heavy and light bicycle pumps
    const bicyclePumpsToggleNode = new ToggleNode( particleTypeProperty, [
      { value: ParticleType.HEAVY, createNode: tandem => heavyBicyclePumpNode },
      { value: ParticleType.LIGHT, createNode: tandem => lightBicyclePumpNode }
    ] );

    // Cancel interaction with the pump when particle type changes.
    particleTypeProperty.link( () => {
      bicyclePumpsToggleNode.interruptSubtreeInput();
    } );

    // Parent for the thermometer's listbox
    const thermometerListboxParent = new Node();

    // Thermometer
    const thermometerNode = new GasPropertiesThermometerNode( model.temperatureModel.thermometer, thermometerListboxParent, {
      right: containerNode.right,
      top: this.layoutBounds.top + GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN,
      tandem: tandem.createTandem( 'thermometerNode' )
    } );

    // Parent for the pressure gauge's listbox
    const pressureGaugeListboxParent = new Node();

    // Pressure Gauge
    const pressureGaugeNode = new PressureGaugeNode( model.pressureModel.pressureGauge, pressureGaugeListboxParent, {
      left: containerNode.right - 2,
      centerY: model.modelViewTransform.modelToViewY( model.container.top ) + 30,
      tandem: tandem.createTandem( 'pressureGaugeNode' )
    } );

    // The complete system of particles, inside and outside the container
    const particleSystemNode = new IdealGasLawParticleSystemNode( model.particleSystem, model.modelViewTransform,
      model.modelBoundsProperty, model.container.maxBounds );

    // If the number of particles changes while the sim is paused, redraw the particle system.
    model.particleSystem.numberOfParticlesProperty.link( () => {
      if ( !this.model.isPlayingProperty.value ) {
        particleSystemNode.update();
      }
    } );

    // Device to heat/cool the contents of the container
    const heaterCoolerNodeLeft = containerViewPosition.x -
                                 model.modelViewTransform.modelToViewDeltaX( model.container.widthRange.min );
    const heaterCoolerNode = new GasPropertiesHeaterCoolerNode(
      model.heatCoolFactorProperty,
      model.holdConstantProperty,
      model.isPlayingProperty,
      model.particleSystem.numberOfParticlesProperty,
      model.temperatureModel.temperatureProperty, {
        left: heaterCoolerNodeLeft,
        bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN,
        tandem: tandem.createTandem( 'heaterCoolerNode' )
      } );

    // Button to erase all particles from container
    const eraseParticlesButton = new EraseParticlesButton( model.particleSystem, {
      right: containerNode.right,
      top: containerWidthNode.bottom + 5,
      tandem: tandem.createTandem( 'eraseParticlesButton' )
    } );

    // Common parent for all tools, so we can move the selected tool to the front without affecting other things.
    const toolsParent = new Node();

    // Collision Counter
    if ( model.collisionCounter ) {
      const collisionCounterListboxParent = new Node();
      toolsParent.addChild( new CollisionCounterNode( model.collisionCounter, collisionCounterListboxParent, this.visibleBoundsProperty, {
        tandem: tandem.createTandem( 'collisionCounterNode' )
      } ) );
      toolsParent.addChild( collisionCounterListboxParent );
    }

    // Stopwatch
    toolsParent.addChild( new GasPropertiesStopwatchNode( model.stopwatch, {
      dragBoundsProperty: this.visibleBoundsProperty,
      tandem: tandem.createTandem( 'stopwatchNode' )
    } ) );

    // Show how the collision detection space is partitioned into regions
    let regionsNode = null;
    if ( GasPropertiesQueryParameters.regions ) {
      regionsNode = new RegionsNode( model.collisionDetector.regions, model.modelViewTransform );
    }

    // model and view coordinates for pointer position
    let pointerCoordinatesNode = null;
    if ( GasPropertiesQueryParameters.pointerCoordinates ) {
      pointerCoordinatesNode = new PointerCoordinatesNode( model.modelViewTransform, {
        textColor: GasPropertiesColors.pointerCoordinatesTextColorProperty,
        backgroundColor: GasPropertiesColors.pointerCoordinatesBackgroundColorProperty
      } );
    }

    // rendering order
    regionsNode && this.addChild( regionsNode );
    this.addChild( particleTypeRadioButtonGroup );
    this.addChild( bicyclePumpsToggleNode );
    this.addChild( pressureGaugeNode );
    this.addChild( pressureGaugeListboxParent );
    this.addChild( containerNode );
    this.addChild( eraseParticlesButton );
    this.addChild( thermometerNode );
    this.addChild( thermometerListboxParent );
    this.addChild( containerWidthNode );
    this.addChild( particleSystemNode );
    this.addChild( returnLidButton );
    this.addChild( heaterCoolerNode );
    this.addChild( toolsParent );
    pointerCoordinatesNode && this.addChild( pointerCoordinatesNode );

    // Time controls are created by the superclass, but subclass is responsible for positioning them
    const defaultWidth = model.modelViewTransform.modelToViewDeltaX( model.container.widthRange.defaultValue );
    this.timeControlNode.mutate( {
      left: containerViewPosition.x - defaultWidth,
      bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
    } );

    // Oops dialog when maximum temperature is exceeded.
    const oopsMaximumTemperatureDialog = new GasPropertiesOopsDialog( GasPropertiesStrings.oopsMaximumTemperature );
    model.oopsEmitters.maximumTemperatureEmitter.addListener( () => { this.showDialog( oopsMaximumTemperatureDialog ); } );

    // @private used in methods
    this.containerNode = containerNode;
    this.particleSystemNode = particleSystemNode;
    this.regionsNode = regionsNode;
    this.heavyBicyclePumpNode = heavyBicyclePumpNode;
    this.lightBicyclePumpNode = lightBicyclePumpNode;
    this.heaterCoolerNode = heaterCoolerNode;
  }

  /**
   * Resets the screen.
   * @protected
   * @override
   */
  reset() {
    super.reset();
    this.heavyBicyclePumpNode.reset();
    this.lightBicyclePumpNode.reset();
  }

  /**
   * Steps the view using real time units.
   * @param {number} dt - delta time, in seconds
   * @public
   * @override
   */
  stepView( dt ) {
    assert && assert( typeof dt === 'number' && dt >= 0, `invalid dt: ${dt}` );
    super.stepView( dt );
    this.containerNode.step( dt );
    this.particleSystemNode.update();
    this.regionsNode && this.regionsNode.update();
    this.heaterCoolerNode.step( dt );
  }

  /**
   * Shows a dialog, and cancels any in-progress interactions.
   * @param {Dialog} dialog
   * @public
   */
  showDialog( dialog ) {
    this.interruptSubtreeInput();
    dialog.show();
  }
}

gasProperties.register( 'IdealGasLawScreenView', IdealGasLawScreenView );
export default IdealGasLawScreenView;
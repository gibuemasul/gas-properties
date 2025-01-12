// Copyright 2019-2022, University of Colorado Boulder

/**
 * IdealGasLawModel extends the base model with functionality related to the Ideal Gas Law.
 *
 * This model has subcomponents that handle the quantities involved in the Ideal Gas Law, PV = NkT.  They are:
 *
 * P (pressure) - see PressureModel pressureProperty
 * V (volume) - see BaseContainer volumeProperty
 * N (number of particles) - see ParticleSystem numberOfParticlesProperty
 * T (temperature) - see TemperatureModel temperatureProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import Emitter from '../../../../axon/js/Emitter.js';
import EnumerationDeprecatedProperty from '../../../../axon/js/EnumerationDeprecatedProperty.js';
import Multilink from '../../../../axon/js/Multilink.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import merge from '../../../../phet-core/js/merge.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import gasProperties from '../../gasProperties.js';
import GasPropertiesConstants from '../GasPropertiesConstants.js';
import GasPropertiesQueryParameters from '../GasPropertiesQueryParameters.js';
import BaseModel from './BaseModel.js';
import CollisionCounter from './CollisionCounter.js';
import CollisionDetector from './CollisionDetector.js';
import HoldConstant from './HoldConstant.js';
import IdealGasLawContainer from './IdealGasLawContainer.js';
import ParticleSystem from './ParticleSystem.js';
import PressureGauge from './PressureGauge.js';
import PressureModel from './PressureModel.js';
import TemperatureModel from './TemperatureModel.js';

class IdealGasLawModel extends BaseModel {

  /**
   * @param {Tandem} tandem
   * @param {Object} [options]
   */
  constructor( tandem, options ) {
    assert && assert( tandem instanceof Tandem, `invalid tandem: ${tandem}` );

    options = merge( {

      leftWallDoesWork: false, // {boolean} does the container's left wall do work on particles?

      // superclass options
      holdConstant: HoldConstant.NOTHING,
      hasCollisionCounter: true
    }, options );

    super( tandem );

    // @public the quantity to hold constant
    this.holdConstantProperty = new EnumerationDeprecatedProperty( HoldConstant, options.holdConstant, {
      tandem: tandem.createTandem( 'holdConstantProperty' ),
      phetioDocumentation: 'determines which quantity will be held constant'
    } );

    // @public the factor to heat or cool the contents of the container.
    // See HeaterCoolerNode: 1 is max heat, -1 is max cool, 0 is no change.
    this.heatCoolFactorProperty = new NumberProperty( 0, {
      range: new Range( -1, 1 ),
      tandem: tandem.createTandem( 'heatCoolFactorProperty' ),
      phetioDocumentation: 'The amount of heat or cool applied to particles in the container. ' +
                           '-1 is maximum cooling, +1 is maximum heat, 0 is off'
    } );

    // @public whether particle-particle collisions are enabled
    this.particleParticleCollisionsEnabledProperty = new BooleanProperty( true, {
      tandem: tandem.createTandem( 'particleParticleCollisionsEnabledProperty' ),
      phetioDocumentation: 'determines whether collisions between particles are enabled'
    } );

    // @public (read-only)
    this.container = new IdealGasLawContainer( {
      leftWallDoesWork: options.leftWallDoesWork,
      tandem: tandem.createTandem( 'container' )
    } );

    // @public (read-only)
    this.particleSystem = new ParticleSystem(
      () => this.temperatureModel.getInitialTemperature(),
      this.particleParticleCollisionsEnabledProperty,
      this.container.particleEntryPosition, {
        tandem: tandem.createTandem( 'particleSystem' )
      }
    );

    // @public (read-only)
    this.collisionDetector = new CollisionDetector(
      this.container,
      this.particleSystem.insideParticleArrays,
      this.particleParticleCollisionsEnabledProperty
    );

    // @public (read-only) sub-model responsible for temperature T
    this.temperatureModel = new TemperatureModel(
      this.particleSystem.numberOfParticlesProperty, // N
      () => this.particleSystem.getAverageKineticEnergy(), { // KE
        tandem: tandem.createTandem( 'temperatureModel' )
      }
    );

    // @public (read-only) sub-model responsible for pressure P
    this.pressureModel = new PressureModel(
      this.holdConstantProperty,
      this.particleSystem.numberOfParticlesProperty, // N
      this.container.volumeProperty, // V
      this.temperatureModel.temperatureProperty, // T
      () => { this.container.blowLidOff(); }, {
        tandem: tandem.createTandem( 'pressureModel' )
      }
    );

    // @public (read-only)
    this.collisionCounter = null;
    if ( options.hasCollisionCounter ) {
      this.collisionCounter = new CollisionCounter( this.collisionDetector, {
        position: new Vector2( 40, 15 ), // view coordinates! determined empirically
        tandem: tandem.createTandem( 'collisionCounter' )
      } );
    }

    // If the container's width changes while the sim is paused, and it's not due to the user
    // resizing the container, then update immediately. See #125.
    Multilink.multilink(
      [ this.container.widthProperty, this.container.userIsAdjustingWidthProperty ],
      ( width, userIsAdjustingWidth ) => {
        if ( !userIsAdjustingWidth && !this.isPlayingProperty.value ) {
          this.updateWhenPaused();
        }
      } );

    // @public (read-only) Emitters for conditions related to the 'Hold Constant' feature.
    // When holding a quantity constant would break the model, the model switches to 'Nothing' mode, the model
    // notifies the view via an Emitter, and the view notifies the user via a dialog. This is called oopsEmitters
    // because the end result is that the user sees an OopsDialog, with a message of the form 'Oops! blah blah'.
    // It was difficult to find names for these Emitters that weren't overly verbose, so the names are
    // highly-abbreviated versions of the messages that the user will see, and they are grouped in an object
    // named oopsEmitters.
    this.oopsEmitters = {

      // Oops! Temperature cannot be held constant when the container is empty.
      temperatureEmptyEmitter: new Emitter(),

      // Oops! Temperature cannot be held constant when the container is open.
      temperatureOpenEmitter: new Emitter(),

      // Oops! Pressure cannot be held constant when the container is empty.
      pressureEmptyEmitter: new Emitter(),

      // Oops! Pressure cannot be held constant. Volume would be too large.
      pressureLargeEmitter: new Emitter(),

      // Oops! Pressure cannot be held constant. Volume would be too small.
      pressureSmallEmitter: new Emitter(),

      // Oops! Maximum temperature reached
      maximumTemperatureEmitter: new Emitter()
    };

    // When the number of particles in the container changes ...
    this.particleSystem.numberOfParticlesProperty.link( numberOfParticles => {

      // If the container is empty, check for 'Hold Constant' conditions that can't be satisfied.
      if ( numberOfParticles === 0 ) {
        if ( this.holdConstantProperty.value === HoldConstant.TEMPERATURE ) {

          // Temperature can't be held constant when the container is empty.
          phet.log && phet.log( 'Oops! T cannot be held constant when N=0' );
          this.holdConstantProperty.value = HoldConstant.NOTHING;
          this.oopsEmitters.temperatureEmptyEmitter.emit();
        }
        else if ( this.holdConstantProperty.value === HoldConstant.PRESSURE_T ||
                  this.holdConstantProperty.value === HoldConstant.PRESSURE_V ) {

          // Pressure can't be held constant when the container is empty.
          phet.log && phet.log( 'Oops! P cannot be held constant when N=0' );
          this.holdConstantProperty.value = HoldConstant.NOTHING;
          this.oopsEmitters.pressureEmptyEmitter.emit();
        }
      }

      // If the number of particles changes while the sim is paused, update immediately.
      // Do this after checking holdConstantProperty, in case it gets switched to HoldConstant.NOTHING.
      if ( !this.isPlayingProperty.value ) {
        this.updateWhenPaused();
      }
    } );

    // Temperature can't be held constant when the container is open, because we don't want to deal with
    // counteracting evaporative cooling. See https://github.com/phetsims/gas-properties/issues/159
    this.container.isOpenProperty.link( isOpen => {
      if ( isOpen && this.holdConstantProperty.value === HoldConstant.TEMPERATURE ) {
        phet.log && phet.log( 'Oops! T cannot be held constant when the container is open' );
        this.holdConstantProperty.value = HoldConstant.NOTHING;
        this.oopsEmitters.temperatureOpenEmitter.emit();
      }
    } );

    // When the number of particles (N) is decreased while holding temperature (T) constant, adjust the speed of
    // particles to result in the desired temperature.  We only need to do this when N decreases because particles
    // that are added have their initial speed set based on T of the container, and therefore result in no change
    // to T. See https://github.com/phetsims/gas-properties/issues/159
    this.particleSystem.numberOfParticlesProperty.link( ( numberOfParticles, previousNumberOfParticles ) => {
      if ( numberOfParticles > 0 && numberOfParticles < previousNumberOfParticles &&
           this.holdConstantProperty.value === HoldConstant.TEMPERATURE ) {
        assert && assert( !this.temperatureModel.controlTemperatureEnabledProperty.value,
          'this feature is not compatible with user-controlled particle temperature' );

        // Workaround for https://github.com/phetsims/gas-properties/issues/168. Addresses an ordering problem where
        // the temperature model needs to update when this state occurs, but it's still null. Temperature is null
        // when the container is empty.
        if ( this.temperatureModel.temperatureProperty.value === null ) {
          this.temperatureModel.update();
        }

        this.particleSystem.setTemperature( this.temperatureModel.temperatureProperty.value );
      }
    } );

    // Verify that we're not in a bad 'Hold Constant' state.
    assert && this.holdConstantProperty.link( holdConstant => {

      // values that are incompatible with an empty container
      assert && assert( !( this.particleSystem.numberOfParticlesProperty.value === 0 &&
      ( holdConstant === HoldConstant.TEMPERATURE ||
        holdConstant === HoldConstant.PRESSURE_T ||
        holdConstant === HoldConstant.PRESSURE_V ) ),
        `bad holdConstant state: ${holdConstant} with numberOfParticles=${this.particleSystem.numberOfParticlesProperty.value}` );

      // values that are incompatible with zero pressure
      assert && assert( !( this.pressureModel.pressureProperty.value === 0 &&
      ( holdConstant === HoldConstant.PRESSURE_V ||
        holdConstant === HoldConstant.PRESSURE_T ) ),
        `bad holdConstant state: ${holdConstant} with pressure=${this.pressureModel.pressureProperty.value}` );
    }, {

      // These values need to be correct before this listener fires.  This is not an issue when the sim is running,
      // but is relevant when PhET-iO restores state.  See https://github.com/phetsims/gas-properties/issues/182.
      phetioDependencies: [
        this.particleSystem.numberOfParticlesProperty,
        this.pressureModel.pressureProperty
      ]
    } );
  }

  /**
   * Resets the model.
   * @public
   * @override
   */
  reset() {
    super.reset();

    // Properties
    this.holdConstantProperty.reset();
    this.heatCoolFactorProperty.reset();
    this.particleParticleCollisionsEnabledProperty.reset();

    // model elements
    this.container.reset();
    this.particleSystem.reset();
    this.temperatureModel.reset();
    this.pressureModel.reset();
    this.collisionCounter && this.collisionCounter.reset();
  }

  /**
   * Steps the model using model time units. Order is very important here!
   * @param {number} dt - time delta, in ps
   * @protected
   * @override
   */
  stepModelTime( dt ) {
    assert && assert( typeof dt === 'number' && dt > 0, `invalid dt: ${dt}` );

    super.stepModelTime( dt );

    // step the system
    this.stepSystem( dt );

    // update things that are dependent on the state of the system
    this.updateModel( dt, this.collisionDetector.numberOfParticleContainerCollisions );
  }

  /**
   * Steps the things that affect the container and particle system, including heating/cooling
   * and collision detection/response. Order is very important here!
   * @param {number} dt - time delta, in ps
   * @private
   */
  stepSystem( dt ) {
    assert && assert( typeof dt === 'number' && dt > 0, `invalid dt: ${dt}` );

    // Apply heat/cool
    this.particleSystem.heatCool( this.heatCoolFactorProperty.value );

    // Step particles
    this.particleSystem.step( dt );

    // Allow particles to escape from the opening in the top of the container
    this.particleSystem.escapeParticles( this.container );

    // Step container, to animate resizing of left wall and compute velocity of left wall.
    this.container.step( dt );

    // Collision detection and response
    this.collisionDetector.update();

    // Remove particles that have left the model bounds
    this.particleSystem.removeParticlesOutOfBounds( this.modelBoundsProperty.value );

    // Do this after collision detection, so that the number of collisions detected has been recorded.
    this.collisionCounter && this.collisionCounter.step( dt );
  }

  /**
   * Updates parts of the model that are dependent on the state of the particle system.  This is separated from
   * stepSystem so that we can update if the number of particles changes while the simulation is paused.
   * Order is very important here!
   * @param {number} dtPressureGauge - time delta used to step the pressure gauge, in ps
   * @param {number} numberOfCollisions - number of collisions on the most recent time step
   * @private
   */
  updateModel( dtPressureGauge, numberOfCollisions ) {
    assert && assert( typeof dtPressureGauge === 'number' && dtPressureGauge > 0,
      `invalid dtPressureGauge: ${dtPressureGauge}` );
    assert && assert( typeof numberOfCollisions === 'number' && numberOfCollisions >= 0,
      `invalid numberOfCollisions: ${numberOfCollisions}` );

    // Adjust quantities to compensate for 'Hold Constant' mode. Do this before computing temperature or pressure.
    this.compensateForHoldConstant();

    // Update temperature. Do this before pressure, because pressure depends on temperature.
    this.temperatureModel.update();

    // Update pressure.
    this.pressureModel.update( dtPressureGauge, numberOfCollisions );

    // Do this last.
    this.verifyModel();
  }

  /**
   * Updates when the sim is paused.
   * @private
   */
  updateWhenPaused() {
    assert && assert( !this.isPlayingProperty.value, 'call this method only when paused' );

    // Using the pressure gauge's refresh period causes it to update immediately.
    this.updateModel( PressureGauge.REFRESH_PERIOD, 0 /* numberOfCollisions */ );
  }

  /**
   * Adjusts quantities to compensate for the quantity that is being held constant.
   * @private
   */
  compensateForHoldConstant() {

    if ( this.holdConstantProperty.value === HoldConstant.PRESSURE_V ) {

      // hold pressure constant by changing volume
      const previousContainerWidth = this.container.widthProperty.value;

      let containerWidth = this.computeIdealVolume() / ( this.container.height * this.container.depth );

      // Address floating-point error, see https://github.com/phetsims/gas-properties/issues/89
      containerWidth = Utils.toFixedNumber( containerWidth, 5 );

      // If the desired container width is out of range ...
      if ( !this.container.widthRange.contains( containerWidth ) ) {

        // Switch to the 'Nothing' mode
        this.holdConstantProperty.value = HoldConstant.NOTHING;

        // This results in an OopsDialog being displayed
        phet.log && phet.log( 'Oops! P cannot be held constant when V exceeds range, ' +
                              `containerWidth=${containerWidth} widthRange=${this.container.widthRange}` );
        if ( containerWidth > this.container.widthRange.max ) {
          this.oopsEmitters.pressureLargeEmitter.emit();
        }
        else {
          this.oopsEmitters.pressureSmallEmitter.emit();
        }

        // Constrain the container width to its min or max.
        containerWidth = this.container.widthRange.constrainValue( containerWidth );
      }

      // Change the container's width immediately, with no animation.
      this.container.resizeImmediately( containerWidth );

      // Redistribute particles in the new width
      this.particleSystem.redistributeParticles( containerWidth / previousContainerWidth );
    }
    else if ( this.holdConstantProperty.value === HoldConstant.PRESSURE_T ) {

      // Hold pressure constant by adjusting particle velocities to result in a desired temperature.
      const desiredTemperature = this.computeIdealTemperature();

      this.particleSystem.setTemperature( desiredTemperature );
      assert && assert( Math.abs( desiredTemperature - this.computeIdealTemperature() < 1E-3 ),
        'actual temperature does not match desired temperature' );

      this.temperatureModel.temperatureProperty.value = desiredTemperature;
    }
  }

  /**
   * Verify that the model is in a good state after having been updated. If it's not, adjust accordingly.
   * @private
   */
  verifyModel() {

    // If the maximum temperature was exceeded, reset the state of the container.
    // See https://github.com/phetsims/gas-properties/issues/128
    if ( this.temperatureModel.temperatureProperty.value >= GasPropertiesQueryParameters.maxTemperature ) {

      // Switch to a 'Hold Constant' setting that supports an empty container
      if ( this.holdConstantProperty.value !== HoldConstant.NOTHING &&
           this.holdConstantProperty.value !== HoldConstant.VOLUME ) {
        this.holdConstantProperty.value = HoldConstant.NOTHING;
      }

      // Remove all particles. Do this after changing holdConstantProperty, so that that we don't trigger
      // multiple oopsEmitters.  See https://github.com/phetsims/gas-properties/issues/150.
      this.particleSystem.removeAllParticles();

      // Put the lid on the container
      this.container.lidIsOnProperty.value = true;

      // Notify listeners that maximum temperature was exceeded.
      phet.log && phet.log( `Oops! Maximum temperature reached: ${this.temperatureModel.temperatureProperty.value}` );
      this.oopsEmitters.maximumTemperatureEmitter.emit();
    }
  }

  /**
   * Computes volume using the Ideal Gas Law, V = NkT/P
   * This is used to compute the volume needed to hold pressure constant in HoldConstant.PRESSURE_V mode.
   * @returns {number} in pm^3
   * @private
   */
  computeIdealVolume() {

    const N = this.particleSystem.numberOfParticlesProperty.value;
    const k = GasPropertiesConstants.BOLTZMANN; // (pm^2 * AMU)/(ps^2 * K)
    const T = this.temperatureModel.computeTemperature(); // temperature has not been updated, so compute it
    const P = this.pressureModel.pressureProperty.value / GasPropertiesConstants.PRESSURE_CONVERSION_SCALE;
    assert && assert( P !== 0, 'zero pressure not supported' );

    return ( N * k * T ) / P;
  }

  /**
   * Computes the temperature using the Ideal Gas Law, T = (PV)/(Nk)
   * This is used to compute the temperature needed to hold pressure constant in HoldConstant.PRESSURE_T mode.
   * @returns {number} in K
   * @public
   */
  computeIdealTemperature() {

    const P = this.pressureModel.pressureProperty.value / GasPropertiesConstants.PRESSURE_CONVERSION_SCALE;
    assert && assert( P !== 0, 'zero pressure not supported' );

    const N = this.particleSystem.numberOfParticlesProperty.value;
    assert && assert( N !== 0, 'empty container not supported' );

    const V = this.container.volumeProperty.value; // pm^3
    const k = GasPropertiesConstants.BOLTZMANN; // (pm^2 * AMU)/(ps^2 * K)

    return ( P * V ) / ( N * k );
  }
}

gasProperties.register( 'IdealGasLawModel', IdealGasLawModel );
export default IdealGasLawModel;
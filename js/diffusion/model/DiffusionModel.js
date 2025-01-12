// Copyright 2018-2022, University of Colorado Boulder

/**
 * DiffusionModel is the top-level model for the 'Diffusion' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import Multilink from '../../../../axon/js/Multilink.js';
import Property from '../../../../axon/js/Property.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import dotRandom from '../../../../dot/js/dotRandom.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import merge from '../../../../phet-core/js/merge.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import NullableIO from '../../../../tandem/js/types/NullableIO.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import GasPropertiesConstants from '../../common/GasPropertiesConstants.js';
import GasPropertiesUtils from '../../common/GasPropertiesUtils.js';
import BaseModel from '../../common/model/BaseModel.js';
import ParticleUtils from '../../common/model/ParticleUtils.js';
import gasProperties from '../../gasProperties.js';
import DiffusionCollisionDetector from './DiffusionCollisionDetector.js';
import DiffusionContainer from './DiffusionContainer.js';
import DiffusionData from './DiffusionData.js';
import DiffusionParticle1 from './DiffusionParticle1.js';
import DiffusionParticle2 from './DiffusionParticle2.js';
import DiffusionSettings from './DiffusionSettings.js';
import ParticleFlowRate from './ParticleFlowRate.js';

// constants
const CENTER_OF_MASS_PROPERTY_OPTIONS = {
  units: 'pm',
  valueType: [ 'number', null ],
  phetioValueType: NullableIO( NumberIO ),
  phetioReadOnly: true // derived from the state of the particle system
};

class DiffusionModel extends BaseModel {

  /**
   * @param {Tandem} tandem
   */
  constructor( tandem ) {
    assert && assert( tandem instanceof Tandem, `invalid tandem: ${tandem}` );

    super( tandem, {

      // Offset of the model's origin, in view coordinates. Determines where the container's bottom-right corner is.
      modelOriginOffset: new Vector2( 670, 520 ),

      // Stopwatch initial position (in view coordinates!), determined empirically.
      stopwatchPosition: new Vector2( 60, 50 )
    } );

    // @public (read-only) particles of each species, together these make up the 'particle system'
    this.particles1 = []; // {DiffusionParticle1[]}
    this.particles2 = []; // {DiffusionParticle2[]}

    // @public
    this.container = new DiffusionContainer( {
      tandem: tandem.createTandem( 'container' )
    } );

    // @public settings for the left and right sides of the container, before the divider is removed
    this.leftSettings = new DiffusionSettings( {
      tandem: tandem.createTandem( 'leftSettings' )
    } );
    this.rightSettings = new DiffusionSettings( {
      tandem: tandem.createTandem( 'rightSettings' )
    } );

    // Synchronize particle counts and arrays.
    const createDiffusionParticle1 = options => new DiffusionParticle1( options );
    this.leftSettings.numberOfParticlesProperty.link( numberOfParticles => {
      this.updateNumberOfParticles( numberOfParticles,
        this.container.leftBounds,
        this.leftSettings,
        this.particles1,
        createDiffusionParticle1 );
      assert && assert( GasPropertiesUtils.isArrayOf( this.particles1, DiffusionParticle1 ),
        'particles1 should contain only DiffusionParticle1' );
    } );
    const createDiffusionParticle2 = options => new DiffusionParticle2( options );
    this.rightSettings.numberOfParticlesProperty.link( numberOfParticles => {
      this.updateNumberOfParticles( numberOfParticles,
        this.container.rightBounds,
        this.rightSettings,
        this.particles2,
        createDiffusionParticle2 );
      assert && assert( GasPropertiesUtils.isArrayOf( this.particles2, DiffusionParticle2 ),
        'particles2 should contain only DiffusionParticle2' );
    } );

    // @public {Property.<number>} N, the total number of particles in the container
    this.numberOfParticlesProperty = new DerivedProperty(
      [ this.leftSettings.numberOfParticlesProperty, this.rightSettings.numberOfParticlesProperty ],
      ( leftNumberOfParticles, rightNumberOfParticles ) => {

        // Skip these assertions when PhET-iO state is being restored, because at least one of the arrays will
        // definitely not be populated. See https://github.com/phetsims/gas-properties/issues/178
        if ( !phet.joist.sim.isSettingPhetioStateProperty.value ) {

          // Verify that particle arrays have been populated before numberOfParticlesProperty is updated.
          // If you hit these assertions, then you need to add this listener later.  This is a trade-off
          // for using plain old Arrays instead of ObservableArrayDef.
          assert && assert( this.particles1.length === leftNumberOfParticles, 'particles1 has not been populated yet' );
          assert && assert( this.particles2.length === rightNumberOfParticles, 'particles2 has not been populated yet' );
        }
        return leftNumberOfParticles + rightNumberOfParticles;
      }, {
        numberType: 'Integer',
        isValidValue: value => value >= 0,
        valueType: 'number',
        phetioValueType: NumberIO,
        tandem: tandem.createTandem( 'numberOfParticlesProperty' ),
        phetioDocumentation: 'total number of particles in the container'
      } );

    // @public data for the left and right sides of the container, appears in Data accordion box
    this.leftData = new DiffusionData( this.container.leftBounds, this.particles1, this.particles2, {
      tandem: tandem.createTandem( 'leftData' )
    } );
    this.rightData = new DiffusionData( this.container.rightBounds, this.particles1, this.particles2, {
      tandem: tandem.createTandem( 'rightData' )
    } );

    // @public (read-only) {Property.<number|null>} centerX of mass for each particle species, in pm
    // null when there are no particles in the container.
    this.centerOfMass1Property = new Property( null, merge( {}, CENTER_OF_MASS_PROPERTY_OPTIONS, {
      tandem: tandem.createTandem( 'centerOfMass1Property' ),
      phetioDocumentation: 'center of mass for particles of type 1'
    } ) );
    this.centerOfMass2Property = new Property( null, merge( {}, CENTER_OF_MASS_PROPERTY_OPTIONS, {
      tandem: tandem.createTandem( 'centerOfMass2Property' ),
      phetioDocumentation: 'center of mass for particles of type 2'
    } ) );

    // @public flow rate model for each particle species
    this.particleFlowRate1 = new ParticleFlowRate( this.container.dividerX, this.particles1, {
      tandem: tandem.createTandem( 'particleFlowRate1' )
    } );
    this.particleFlowRate2 = new ParticleFlowRate( this.container.dividerX, this.particles2, {
      tandem: tandem.createTandem( 'particleFlowRate2' )
    } );

    // @public (read-only)
    this.collisionDetector = new DiffusionCollisionDetector( this.container, this.particles1, this.particles2 );

    // Update mass and temperature of existing particles. This adjusts speed of the particles.
    Multilink.multilink(
      [ this.leftSettings.massProperty, this.leftSettings.initialTemperatureProperty ],
      ( mass, initialTemperature ) => {
        updateMassAndTemperature( mass, initialTemperature, this.particles1 );
      } );
    Multilink.multilink(
      [ this.rightSettings.massProperty, this.rightSettings.initialTemperatureProperty ],
      ( mass, initialTemperature ) => {
        updateMassAndTemperature( mass, initialTemperature, this.particles2 );
      } );

    // Update data if initial temperature settings are changed while the sim is paused.
    Multilink.multilink(
      [ this.leftSettings.initialTemperatureProperty, this.rightSettings.initialTemperatureProperty ],
      () => {
        if ( !this.isPlayingProperty.value ) {
          this.updateData();
        }
      } );

    // Update radii of existing particles.
    this.leftSettings.radiusProperty.link( radius => {
      updateRadius( radius, this.particles1, this.container.leftBounds, this.isPlayingProperty.value );
    } );
    this.rightSettings.radiusProperty.link( radius => {
      updateRadius( radius, this.particles2, this.container.rightBounds, this.isPlayingProperty.value );
    } );

    // When the divider is restored, create a new initial state with same numbers of particles.
    this.container.hasDividerProperty.link( hasDivider => {
      if ( hasDivider ) {

        // Restarts the experiment with the same settings.
        // This causes the current sets of particles to be deleted, and new sets of particles to be created.
        this.leftSettings.restart();
        this.rightSettings.restart();

        // Reset flow-rate models
        this.particleFlowRate1.reset();
        this.particleFlowRate2.reset();
      }
    } );
  }

  /**
   * Resets the model.
   * @public
   * @override
   */
  reset() {
    super.reset();

    this.container.reset();
    this.leftSettings.reset();
    this.rightSettings.reset();
    this.centerOfMass1Property.reset();
    this.centerOfMass2Property.reset();
    this.particleFlowRate1.reset();
    this.particleFlowRate2.reset();

    assert && assert( this.particles1.length === 0, 'there should be no DiffusionParticle1 particles' );
    assert && assert( this.particles2.length === 0, 'there should be no DiffusionParticle2 particles' );
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

    // Step particles
    ParticleUtils.stepParticles( this.particles1, dt );
    ParticleUtils.stepParticles( this.particles2, dt );

    // Particle Flow Rate model
    if ( !this.container.hasDividerProperty.value ) {
      this.particleFlowRate1.step( dt );
      this.particleFlowRate2.step( dt );
    }

    // Collision detection and response
    this.collisionDetector.update();

    // Update other things that are based on the current state of the particle system.
    this.updateCenterOfMass();
    this.updateData();
  }

  /**
   * Adjusts an array of particles to have the desired number of elements.
   * @param {number} numberOfParticles - desired number of particles
   * @param {Bounds2} positionBounds - initial position will be inside this bounds
   * @param {DiffusionSettings} settings
   * @param {Particle[]} particles - array of particles that corresponds to newValue and oldValue
   * @param {function(options:*):Particle} createParticle - creates a Particle instance
   * @private
   */
  updateNumberOfParticles( numberOfParticles, positionBounds, settings, particles, createParticle ) {
    assert && assert( typeof numberOfParticles === 'number', `invalid numberOfParticles: ${numberOfParticles}` );
    assert && assert( positionBounds instanceof Bounds2, `invalid positionBounds: ${positionBounds}` );
    assert && assert( settings instanceof DiffusionSettings, `invalid settings: ${settings}` );
    assert && assert( Array.isArray( particles ), `invalid particles: ${particles}` );
    assert && assert( typeof createParticle === 'function', `invalid createParticle: ${createParticle}` );

    const delta = numberOfParticles - particles.length;
    if ( delta !== 0 ) {
      if ( delta > 0 ) {
        addParticles( delta, positionBounds, settings, particles, createParticle );
      }
      else {
        ParticleUtils.removeLastParticles( -delta, particles );
      }

      // If paused, update things that would normally be handled by step.
      if ( !this.isPlayingProperty.value ) {
        this.updateCenterOfMass();
        this.updateData();
      }
    }
  }

  /**
   * Updates the center of mass, as shown by the center-of-mass indicators.
   * @private
   */
  updateCenterOfMass() {
    this.centerOfMass1Property.value = ParticleUtils.getCenterXOfMass( this.particles1 );
    this.centerOfMass2Property.value = ParticleUtils.getCenterXOfMass( this.particles2 );
  }

  /**
   * Updates the Data displayed for the left and right sides of the container.
   * @private
   */
  updateData() {
    this.leftData.update( this.particles1, this.particles2 );
    this.rightData.update( this.particles1, this.particles2 );
  }
}

/**
 * Adds n particles to the end of the specified array.
 * @param {number} n
 * @param {Bounds2} positionBounds - initial position will be inside this bounds
 * @param {DiffusionSettings} settings
 * @param {Particle[]} particles
 * @param {function(options:*):Particle} createParticle - creates a Particle instance
 */
function addParticles( n, positionBounds, settings, particles, createParticle ) {
  assert && assert( typeof n === 'number' && n > 0, `invalid n: ${n}` );
  assert && assert( positionBounds instanceof Bounds2, `invalid positionBounds: ${positionBounds}` );
  assert && assert( settings instanceof DiffusionSettings, `invalid settings: ${settings}` );
  assert && assert( Array.isArray( particles ), `invalid particles: ${particles}` );
  assert && assert( typeof createParticle === 'function', `invalid createParticle: ${createParticle}` );

  // Create n particles
  for ( let i = 0; i < n; i++ ) {

    const particle = createParticle( {
      mass: settings.massProperty.value,
      radius: settings.radiusProperty.value
    } );

    // Position the particle at a random position within positionBounds, accounting for particle radius.
    const x = dotRandom.nextDoubleBetween( positionBounds.minX + particle.radius, positionBounds.maxX - particle.radius );
    const y = dotRandom.nextDoubleBetween( positionBounds.minY + particle.radius, positionBounds.maxY - particle.radius );
    particle.setPositionXY( x, y );
    assert && assert( positionBounds.containsPoint( particle.position ), 'particle is outside of positionBounds' );

    // Set the initial velocity, based on initial temperature and mass.
    particle.setVelocityPolar(
      // |v| = sqrt( 3kT / m )
      Math.sqrt( 3 * GasPropertiesConstants.BOLTZMANN * settings.initialTemperatureProperty.value / particle.mass ),

      // Random angle
      dotRandom.nextDouble() * 2 * Math.PI
    );

    particles.push( particle );
  }
}

/**
 * When mass or initial temperature changes, update particles and adjust their speed accordingly.
 * @param {number} mass
 * @param {number} temperature
 * @param {Particle[]} particles
 */
function updateMassAndTemperature( mass, temperature, particles ) {
  assert && assert( typeof mass === 'number' && mass > 0, `invalid mass: ${mass}` );
  assert && assert( typeof temperature === 'number' && temperature >= 0, `invalid temperature: ${temperature}` );
  assert && assert( Array.isArray( particles ), `invalid particles: ${particles}` );

  for ( let i = particles.length - 1; i >= 0; i-- ) {
    particles[ i ].mass = mass;

    // |v| = sqrt( 3kT / m )
    particles[ i ].setVelocityMagnitude( Math.sqrt( 3 * GasPropertiesConstants.BOLTZMANN * temperature / mass ) );
  }
}

/**
 * Updates the radius for a set of particles.
 * @param {number} radius
 * @param {Particle[]} particles
 * @param {Bounds2} bounds - particles should be inside these bounds
 * @param {boolean} isPlaying
 */
function updateRadius( radius, particles, bounds, isPlaying ) {
  assert && assert( typeof radius === 'number' && radius > 0, `invalid radius: ${radius}` );
  assert && assert( Array.isArray( particles ), `invalid particles: ${particles}` );
  assert && assert( bounds instanceof Bounds2, `invalid bounds: ${bounds}` );
  assert && assert( typeof isPlaying === 'boolean', `invalid isPlaying: ${isPlaying}` );

  for ( let i = particles.length - 1; i >= 0; i-- ) {

    const particle = particles[ i ];
    particle.radius = radius;

    // If the sim is paused, then adjust the position of any particles are not fully inside the bounds.
    // While the sim is playing, this adjustment will be handled by collision detection.
    if ( !isPlaying ) {

      // constrain horizontally
      if ( particle.left < bounds.minX ) {
        particle.left = bounds.minX;
      }
      else if ( particle.right > bounds.maxX ) {
        particle.right = bounds.maxX;
      }

      // constrain vertically
      if ( particle.bottom < bounds.minY ) {
        particle.bottom = bounds.minY;
      }
      else if ( particle.top > bounds.maxY ) {
        particle.top = bounds.maxY;
      }
    }
  }
}

gasProperties.register( 'DiffusionModel', DiffusionModel );
export default DiffusionModel;
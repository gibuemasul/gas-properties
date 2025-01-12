// Copyright 2019-2022, University of Colorado Boulder

/**
 * BaseContainer is the base class for containers in all screens. This is a rectangular container for particles,
 * with fixed position, fixed height and depth, and mutable width. The origin is at the bottom-right corner, and
 * width expands to the left.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import RangeWithValue from '../../../../dot/js/RangeWithValue.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import merge from '../../../../phet-core/js/merge.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import gasProperties from '../../gasProperties.js';
import Particle from './Particle.js';

class BaseContainer {

  /**
   * @param {Object} [options]
   */
  constructor( options ) {

    options = merge( {

      // position of the container's bottom right corner, in pm
      position: Vector2.ZERO,

      // range and initial value of the container's width, in pm
      widthRange: new RangeWithValue( 5000, 15000, 10000 ),

      // phet-io
      tandem: Tandem.REQUIRED

    }, options );

    assert && assert( options.position instanceof Vector2,
      `invalid position type: ${options.position}` );
    assert && assert( options.widthRange instanceof RangeWithValue,
      `invalid widthRange type: ${options.widthRange}` );

    // @public (read-only)
    this.position = options.position;
    this.widthRange = options.widthRange;

    // @public width of the container, in pm
    this.widthProperty = new NumberProperty( this.widthRange.defaultValue, {
      range: this.widthRange,
      units: 'pm',
      reentrant: true, // Occurring in PhET-iO State setting
      tandem: options.tandem.createTandem( 'widthProperty' ),
      phetioReadOnly: true
    } );

    // @public (read-only) height of the container, in pm
    this.height = 8750;

    // @private (read-only) depth of the container, in pm
    this.depth = 4000;

    // @public V, volume of the container, in pm^3
    this.volumeProperty = new DerivedProperty( [ this.widthProperty ],
      width => width * this.height * this.depth, {
        units: 'pm^3',
        isValidValue: value => ( typeof value === 'number' && value > 0 ),
        tandem: options.tandem.createTandem( 'volumeProperty' ),
        phetioValueType: NumberIO
      } );

    // @public (read-only) wall thickness, in pm
    this.wallThickness = 75;

    // @public inside bounds, in pm
    this.boundsProperty = new DerivedProperty( [ this.widthProperty ],
      width => new Bounds2(
        this.position.x - width, this.position.y,
        this.position.x, this.position.y + this.height
      ), {
        valueType: Bounds2
      } );

    // @public (read-only) maximum inside bounds, in pm.
    // Used for sizing the CanvasNode that draws the particle system inside the container.
    this.maxBounds = new Bounds2(
      this.position.x - this.widthRange.max, this.position.y,
      this.position.x, this.position.y + this.height
    );

    // @public (read-only) velocity of the left (movable) wall, pm/ps. This vector will be MUTATED!
    this.leftWallVelocity = new Vector2( 0, 0 );

    // @public Indicates whether the user is adjusting widthProperty. The width will also change automatically in
    // HoldConstant.PRESSURE_V mode. This is used to suppress model updates in the Ideal screen, when the user
    // is resizing the container with the sim paused.  See #125.
    this.userIsAdjustingWidthProperty = new BooleanProperty( false );
  }

  /**
   * Resets the container.
   * @public
   */
  reset() {
    this.widthProperty.reset();
  }

  /**
   * Convenience getter for width.
   * @returns {number} in pm
   * @public
   */
  get width() { return this.widthProperty.value; }

  /**
   * Convenience getter for inside bounds.
   * @returns {Bounds2} in pm
   * @public
   */
  get bounds() { return this.boundsProperty.value; }

  /**
   * Convenience getters for inside bounds of the container, in model coordinate frame.
   * Bounds2 has similar getters, but uses a view coordinate frame, where 'top' is minY and 'bottom' is maxY.
   * @returns {number} in pm
   * @public
   */
  get left() { return this.bounds.minX; }

  get right() { return this.bounds.maxX; }

  get bottom() { return this.bounds.minY; }

  get top() { return this.bounds.maxY; }

  /**
   * Determines whether the container fully contains a particle.
   * @param {Particle} particle
   * @returns {boolean}
   * @public
   */
  containsParticle( particle ) {
    assert && assert( particle instanceof Particle, `invalid particle: ${particle}` );

    return particle.left >= this.bounds.minX &&
           particle.right <= this.bounds.maxX &&
           particle.bottom >= this.bounds.minY &&
           particle.top <= this.bounds.maxY;
  }

  /**
   * Determines whether the container fully contains one or more collections of particles.
   * @param {Particle[][]} particleArrays
   * @returns {boolean}
   * @public
   */
  containsParticles( particleArrays ) {
    assert && assert( Array.isArray( particleArrays ), `invalid particlesArray: ${particleArrays}` );

    for ( let i = particleArrays.length - 1; i >= 0; i-- ) {
      const particles = particleArrays[ i ];
      for ( let j = particles.length - 1; j >= 0; j-- ) {
        const particle = particles[ j ];
        if ( !this.containsParticle( particle ) ) {
          return false;
        }
      }
    }
    return true;
  }
}

gasProperties.register( 'BaseContainer', BaseContainer );
export default BaseContainer;
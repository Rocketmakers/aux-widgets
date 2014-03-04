 /* toolkit. provides different widgets, implements and modules for 
 * building audio based applications in webbrowsers.
 * 
 * Invented 2013 by Markus Schmidt <schmidt@boomshop.net>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, 
 * Boston, MA  02110-1301  USA
 */

Ranged = new Class({
    // Ranged provides stuff for calculating linear scales from different values.
    // It is useful to build coordinate systems, calculating pixel positions
    // for different scale types and the like. Ranged is used e.g. in Scale,
    // MeterBase and Graph to draw elements on a certain position according to
    // a value on an arbitrary scale. Range implements AudioMath, Options and
    // Events.
    _class: "Ranged",
    Implements: AudioMath,
    __options: {
        scale:          _TOOLKIT_LINEAR, // What kind of value are we having?
                                         // _TOOLKIT_LINEAR
                                         // _TOOLKIT_DECIBEL / _TOOLKIT_LOG2
                                         // _TOOLKIT_FREQUENCY / _TOOLKIT_LOG10
                                         // function (value, options, coef) {}
                                         // 
                                         // If a function instead of a constant
                                         // is handed over, it receives the
                                         // actual options object as the second
                                         // argument and is supposed to return a
                                         // coefficient between 0 and 1. If the
                                         // third argument "coef" is true, it is
                                         // supposed to return a value depending
                                         // on a coefficient handed over as the 
                                         // first argument.
        reverse:        false,           // true if the range is reversed
        basis:          0,               // Dimensions of the range, set to
                                         // width/height in pixels, if you need
                                         // it for drawing purposes, to 100 if
                                         // you need percentual values or to 1
                                         // if you just need a linear
                                         // coefficient for a e.g. logarithmic
                                         // scale.
        min:            0,               // Minimum value of the range
        max:            0,               // Maximum value of the range
        step:           0,               // Step size, needed for e.g. user
                                         // interaction
        shift_up:       4,               // Multiplier for e.g. SHIFT pressed
                                         // while stepping
        shift_down:     0.25,            // Multiplier for e.g. SHIFT + CONTROL
                                         // pressed while stepping
        snap:           0,               // Snap the value to a virtual grid
                                         // with this distance
                                         // Using snap option with float values
                                         // causes the range to reduce its
                                         // minimum and maximum values depending
                                         // on the amount of decimal digits
                                         // because of the implementation of
                                         // math in JavaScript.
                                         // Using a step size of e.g. 1.125
                                         // reduces the maximum usable value
                                         // from 9,007,199,254,740,992 to
                                         // 9,007,199,254,740.992 (note the
                                         // decimal point)
                                         // Alternatively set this to an array
                                         // containing possible values
        round:          true,            // if snap is set decide how to jump
                                         // between snaps. Setting this to true
                                         // slips to the next snap if the value
                                         // is more than on its half way to it.
                                         // Otherwise the value has to reach the
                                         // next snap until it is hold there
                                         // again.
        log_factor:     1                // Used to range logarithmic curves.
                                         // The factor is used to stretch the
                                         // used range of the logarithmic curve
                                            
    },
    
    val2real: function (n, nosnap) {
        // calculates "real world" values (positions, coefficients, ...)
        // depending on options.basis
        return this.val2based(n, this.options.basis, nosnap);
    },
    real2val: function (n, nosnap) {
        // returns a point on the scale for the "real world" value (positions,
        // coefficients, ...) based on options.basis
        return this.based2val(n, this.options.basis, nosnap);
    },
    gen_to_scale : function() {
        if (typeof this.options.scale == "function") {
            var f = this.options.svale;
            var op = this.options;
            var bas = this.options.basis;
            return function (value) {
                return f(value, op, false) * bas;
            };
        }
        switch (this.options.scale) {
            default:
            case _TOOLKIT_LINEAR:
                return function (value, min, max, basis) {
                    return ((((min - value) * -1) / (max - min)) || 0) * basis;
                };
            case _TOOLKIT_DB:
            case _TOOLKIT_LOG2:
                return this.db2scale;
            case _TOOLKIT_FREQ:
            case _TOOLKIT_FREQ_REVERSE:
                return this.freq2scale;
        }
    },
    gen_val2px : function(nosnap) {
        var basis = this.options.basis;
        var min = this.options.min;
        var max = this.options.max;
        var rev = this.options.reverse;
        var reverse = this.options.scale == _TOOLKIT_DB || this.options.scale == _TOOLKIT_FREQ_REVERSE;
        var trafo = this.gen_to_scale();
        var lf = this.options.log_factor;

        if (!nosnap) {
            var snap = this.snap_value.bind(this);
            return function (x) {
                x = snap(x);
                x = trafo(x, min, max, basis, reverse, lf);
                if (rev) return -x + basis;
                else return x;
            };
        } else {
            return function (x) {
                x = trafo(x, min, max, basis, reverse, lf);
                if (rev) return -x + basis;
                else return x;
            };
        }
    },
    val2px: function (n, nosnap) {
        // just a wrapper for having understandable code and backward
        // compatibility
        return this.val2based(n, this.options.basis, nosnap);
    },
    gen_from_scale : function() {
        if (typeof this.options.scale == "function") {
            var f = this.options.svale;
            var op = this.options;
            var bas = this.options.basis;
            return function (value) {
                return f(value, op, true) * bas;
            };
        }
        switch (this.options.scale) {
            default:
            case _TOOLKIT_LINEAR:
                return function (value, min, max, basis) {
                    return (value / basis) * (max - min) + min;
                };
            case _TOOLKIT_DB:
            case _TOOLKIT_LOG2:
                return this.scale2db;
            case _TOOLKIT_FREQ:
            case _TOOLKIT_FREQ_REVERSE:
                return this.scale2freq;
        }
    },
    gen_px2val : function(nosnap) {
        var basis = this.options.basis || 1;
        var min = this.options.min;
        var max = this.options.max;
        var rev = this.options.reverse;
        var reverse = this.options.scale == _TOOLKIT_DB || this.options.scale == _TOOLKIT_FREQ_REVERSE;
        var trafo = this.gen_from_scale();
        var lf = this.options.log_factor;

        if (!nosnap) {
            var snap = this.snap_value.bind(this);
            return function (x) {
                if (rev) x = -x + basis;
                x = trafo(x, min, max, basis, reverse, lf);
                x = snap(x);
                return x;
            };
        } else {
            return function (x) {
                if (rev) x = -x + basis;
                x = trafo(x, min, max, basis, reverse, lf);
                return x;
            };
        }
    },
    px2val: function (n, nosnap) {
        // just a wrapper for having understandable code and backward
        // compatibility
        return this.based2val(n, this.options.basis, nosnap);
    },
    val2coef: function (n, nosnap) {
        // calculates a coefficient for the value
        return this.val2based(n, 1, nosnap);
    },
    coef2val: function (n, nosnap) {
        // calculates a value from a coefficient
        return this.based2val(n, 1, nosnap);
    },
    val2perc: function (n, nosnap) {
        // calculates percents on the scale from a value
        return this.val2based(n, 100, nosnap);
    },
    perc2val: function (n, nosnap) {
        // calculates a value from percents of the scale
        return this.based2val(n, 100, nosnap);
    },
    val2based: function (value, basis, nosnap) {
        // takes a value and returns the corresponding point on the scale
        // according to basis
        if (typeof value == "undefined") value = this.options.value;
        basis = basis || 1;
        if (!nosnap) value = this.snap_value(value);
        var coef = 0;
        if (typeof this.options.scale == "function")
            coef = this.options.scale(value, this.options, false) * basis;
        switch (this.options.scale) {
            default:
            case _TOOLKIT_LINEAR:
                coef = ((((this.options.min - value) * -1)
                    / (this.options.max - this.options.min)) || 0) * basis;
                break;
            case _TOOLKIT_DB:
                coef = this.db2scale(
                       value, this.options.min, this.options.max, basis,
                       true, this.options.log_factor);
                break;
            case _TOOLKIT_LOG2:
                coef = this.db2scale(
                       value, this.options.min, this.options.max, basis,
                       false, this.options.log_factor);
                break;
            case _TOOLKIT_FREQ:
                coef = this.freq2scale(
                       value, this.options.min, this.options.max, basis,
                       false);
                break;
            case _TOOLKIT_FREQ_REVERSE:
                coef = this.freq2scale(
                       value, this.options.min, this.options.max, basis,
                       true);
                break;
        }
        if (this.options.reverse) coef = -coef + basis;
        return coef;
    },
    based2val: function (coef, basis, nosnap) {
        // takes a point on the scale according to basis and returns the
        // corresponding value
        basis = basis || 1;
        var value = 0;
        if (this.options.reverse) coef = -coef + basis;
        if (typeof this.options.scale == "function")
            value = this.options.scale(coef, this.options, true);
        switch (this.options.scale) {
            default:
            case _TOOLKIT_LINEAR:
                value = (coef / basis)
                    * (this.options.max - this.options.min) + this.options.min;
                break;
            case _TOOLKIT_DB:
                value = this.scale2db(
                       coef, this.options.min, this.options.max, basis,
                       true, this.options.log_factor);
                break;
            case _TOOLKIT_LOG2:
                value = this.scale2db(
                       coef, this.options.min, this.options.max, basis,
                       false, this.options.log_factor);
                break;
            case _TOOLKIT_FREQ:
                value = this.scale2freq(
                       coef, this.options.min, this.options.max, basis,
                       false);
                break;
            case _TOOLKIT_FREQ_REVERSE:
                value = this.scale2freq(
                       coef, this.options.min, this.options.max, basis,
                       true);
                break;
        }
        if (nosnap) return value;
        return this.snap_value(value);
    },
    snap_value: function (value) {
        // if snapping is enabled, snaps the value to the grid
        if (!this.options.snap) return value;
        var snap  = this.options.snap;
        if (typeOf(snap) == "array") {
            return snap.next(value)
        } else {
            if (typeof this.___snapcoef["" + snap] == "undefined") {
                p = ("" + snap).split(".");
                this.___snapcoef["" + snap] = p.length > 1
                                            ? Math.pow(10, p[1].length) : 1;
            }
            var scoef = this.___snapcoef["" + snap];
            
            var multi = ((value * scoef) % (snap * scoef)) / scoef;
            var res   = value + ((this.options.round && (multi > snap / 2.0))
                              ? snap - multi : -multi);
            var digit = snap.toString().split(".");
            digit = digit.length > 1 ? digit[1].length : 0;
            return res.toFixed(digit).toFloat();
        }
    },
    ___snapcoef: {}
});

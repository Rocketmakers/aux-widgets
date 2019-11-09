/*
 * This file is part of Toolkit.
 *
 * Toolkit is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * Toolkit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */
import { define_class } from '../widget_helpers.js';
import { LevelMeter } from './levelmeter.js';
import { add_class, element } from '../utils/dom.js';

export const PhaseMeter = define_class({
    /**
     * PhaseMeter is a {@link LevelMeter} configured to display phase
     * correlation.
     * 
     * @extends LevelMeter
     * 
     */
    Extends: LevelMeter,
    _options: Object.create(LevelMeter.prototype._options),
    options: {
        show_clip: false,
        layout: "top",
        min: -1,
        max: 1,
        scale_base: 0,
        base: 0,
        levels: [0.05,0.1,0.5,1],
        format_labels: function (v) { return (v>0?"+":v<0?"-":"") + v.toFixed(1); },
        
    },
    initialize: function (options) {
        if (!options.element) options.element = element("div");
        LevelMeter.prototype.initialize.call(this, options);
        /**
         * @member {HTMLDivElement} PhaseMeter#element - The main DIV container.
         *   Has class <code>.aux-phasemeter</code>.
         */
    },
    draw: function(O, element)
    {
        add_class(element, "aux-phasemeter");

        LevelMeter.prototype.draw.call(this, O, element);
    },
    static_events: {
        set_value: function (v) {
            
        },
    },
});
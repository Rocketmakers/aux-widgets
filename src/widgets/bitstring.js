/*
 * This file is part of AUX.
 *
 * AUX is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * AUX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */

import { addClass } from './../utils/dom.js';
import { Buttons } from './buttons.js';
import { error } from '../utils/log.js';

/**
 * The <code>useraction</code> event is emitted when a widget gets modified by user interaction.
 * The event is emitted for the option <code>select</code>.
 *
 * @event Buttons#useraction
 * @param {string} name - The name of the option which was changed due to the users action
 * @param {mixed} value - The new value of the option
 */

/**
 * Bitstring is a specialized ({@link Buttons}) widget to display and
 * control arrays of bits.
 *
 * @param {Object} [options={ }] - An object containing initial options.
 *
 * @property {Function} [options.labels="i => i + 1"] - A function receiving
 *   the index as argument to format the buttons labels if the buttons
 *   are set as `options.length` and not as `options.buttons`.
 * @property {Function} [options.icons="i => null"] - A function receiving
 *   the index as argument to format the buttons labels if the buttons
 *   are set as `options.length` and not as `options.buttons`.
 * @property {Number|Boolean} [options.length=false] - The length of the bitstring.
 *   Use this option to auto-generate the buttons. If you want to have more
 *   control over the buttons displayed, set them as `options.buttons`
 *   and set this option to `false`.
 *
 * @class Bitstring
 *
 * @extends Buttons
 *
 */
export class Bitstring extends Buttons {
  static get _options() {
    return Object.assign({}, Buttons.getOptionTypes(), {
      labels: 'function',
      icons: 'function',
      length: 'number|boolean',
      bitstring: 'array|number',
    });
  }

  static get options() {
    return {
      multi_select: 1,
      labels: (i) => i + 1,
      icons: (i) => null,
      length: false,
      bitstring: 0,
      deselect: true,
    };
  }

  static get static_events() {
    return {
      set_buttons: function (buttons) {
        this.set('bitstring', this.options.bitstring);
      },
      set_length: function (length) {
        if (length !== false) {
          const O = this.options;
          const B = [];
          for (let i = 0, m = length; i < m; ++i) {
            B.push({
              label: O.labels(i),
              icons: O.icons(i),
            });
          }
          this.set('buttons', B);
        }
      },
      set_bitstring: function (bitstring) {
        if (typeof bitstring === 'undefined') return;
        let select;
        if (typeof bitstring === 'number') {
          select = this.buttons.list.map((b, i) =>
            bitstring & (1 << i) ? i : null
          );
        } else if (Array.isArray(bitstring)) {
          select = this.buttons.list.map((b, i) => (bitstring[i] ? i : null));
        } else {
          error('Bitstring %O is not of type number or array.', bitstring);
        }
        if (select) {
          select = select.filter((v) => v !== null);
          this.set('select', select);
        }
      },
      useraction: function (key, value) {
        if (key != 'select') return;
        const O = this.options;
        if (typeof O.bitstring == 'number') {
          let bitstring = 0;
          for (let i = 0, m = value.length; i < m; ++i) {
            if (value[i] === null) continue;
            bitstring |= 1 << value[i];
          }
          this.userset('bitstring', bitstring);
        } else if (Array.isArray(O.bitstring)) {
          const bitstring = new Array(this.buttons.list.length).fill(false);
          value.map((v, i) => (v === null ? null : (bitstring[v] = true)));
          this.userset('bitstring', bitstring);
        } else {
          error('Bitstring %O is not of type number or array.', O.bitstring);
        }
      },
    };
  }

  initialize(options) {
    super.initialize(options);
    /**
     * @member {HTMLDivElement} Bitstring#element - The main DIV container.
     *   Has class <code>.aux-bitstring</code>.
     */
  }

  draw(O, element) {
    addClass(element, 'aux-bitstring');

    this.set('length', O.length);
    this.set('bitstring', O.bitstring);
    
    super.draw(O, element);
  }
}

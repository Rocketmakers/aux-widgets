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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */

import { defineClass, defineChildElement } from './../../widget_helpers.js';
import { defineChildWidget } from './../../child_widget.js';
import {
  innerWidth,
  innerHeight,
  addClass,
  removeClass,
} from './../../utils/dom.js';

import { Container } from './../../widgets/container.js';

export const Patchbay = defineClass({
  Extends: Container,
  _options: Object.assign(Object.create(Container.prototype._options), {
    sources: 'object',
    sinks: 'object',
    size: 'number',
  }),
  options: {
    size: 32,
  },
  initialize: function (options) {
    Container.prototype.initialize.call(this, options);
  },
  draw: function (options, element) {
    addClass(this.element, 'aux-patchbay');
    Container.prototype.draw.call(this, options, element);
  },
});
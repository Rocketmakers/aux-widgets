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

import { defineClass } from '../widget_helpers.js';
import { Dialog } from './dialog.js';
import { Taggable } from './taggable.js';
import { addClass, element, removeClass } from '../utils/dom.js';

function keyUp(e) {
  if (e.keyCode != 13) return;
  newTagFromInput.call(this);
}
function newTagFromInput() {
  var val = this.element.value;
  if (!val) return;
  this.element.value = '';
  var t = false;
  if (!this.options.async) t = this.addTag(val);
  this.emit('newtag', val, t);
  if (this.options.closenew) this.close();
}

export const Tagger = defineClass({
  Extends: Dialog,
  Implements: Taggable,

  _options: Object.assign(Object.create(Dialog.prototype._options), {
    closenew: 'boolean',
    add: 'boolean',
  }),
  options: {
    closenew: true,
    visible: false,
    add: true,
  },
  initialize: function (options) {
    Dialog.prototype.initialize.call(this, options);

    Taggable.prototype.initialize.call(this);
    this.on('addtag', newTagFromInput.bind(this));

    this.set('add', this.options.add);
  },
  destroy: function () {
    Dialog.prototype.destroy.call(this);
  },
  draw: function (O, element) {
    addClass(element, 'aux-tagger');

    Dialog.prototype.draw.call(this, O, element);
  },
  redraw: function () {
    Dialog.prototype.redraw.call(this);
    var I = this.invalid;
    var O = this.options;
    if (I.add) {
      I.add = false;
      if (O.add) {
        if (!this.element) {
          this.element = element('input', 'aux-input');
          this.element.addEventListener('keyup', keyUp.bind(this), true);
          this.element.type = 'text';
          this.element.placeholder = 'New tag';
          this.element.appendChild(this.element);
        }
        this.element.appendChild(this.add.element);
        addClass(this.element, 'aux-has-input');
      } else if (!O.add) {
        if (this.element) {
          this.element.removeChild(this.element);
          this.element = null;
        }
        this.add.element.remove();
        removeClass(this.element, 'aux-has-input');
      }
    }
  },
  addTag: function (tag, options) {
    var t = Taggable.prototype.addTag.call(this, tag, options);
    if (!t) return;
    t.node.label.on(
      'click',
      (function (that, _tag) {
        return function () {
          that.emit('tagclicked', _tag.tag, _tag.node);
        };
      })(this, t)
    );
    if (this.options.visible) this.reposition();
    return t;
  },
  removeTag: function (tag, node, purge) {
    Taggable.prototype.removeTag.call(this, tag, node, purge);
    if (!this.taglist.length) this.close();
    if (this.options.visible) this.reposition();
  },
});

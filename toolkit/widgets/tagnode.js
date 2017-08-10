/*
 * This file is part of toolkit.
 *
 * toolkit is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * toolkit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */
"use strict";
(function (w, TK) {

TK.TagNode = TK.class({
  
  Extends: TK.Container,
  Implements: TK.Colors,
  
  _options: Object.assign(Object.create(TK.Container.prototype._options), {
    label: "string",
    color: "string",
  }),
  options: {
    label: "",
    color: "#000000",
  },
  
  initialize: function (options, tag) {
    TK.Container.prototype.initialize.call(this, options);
    this.tag = tag;
    this.add_class("toolkit-tag");
    
  },
  
  redraw: function () {
    TK.Container.prototype.redraw.call(this);
    var I = this.invalid;
    var O = this.options;
    if (I.color) {
      I.color = false;
      this.element.style.backgroundColor = O.color;
      this.element.style.color = this.rgb2bw(this.hex2rgb(O.color));
    }
  }
});

TK.ChildWidget(TK.TagNode, "label", {
    create: TK.Label,
    show: true,
    map_options: {
        tag: "label",
    },
    toggle_class: true,
});
TK.ChildWidget(TK.TagNode, "colorize", {
    create: TK.Button,
    show: false,
    toggle_class: true,
    static_events: {
      click: function (e) { this.parent.fire_event("colorize", e); }
    },
    default_options: {
        class: "toolkit-colorize"
    },
});
TK.ChildWidget(TK.TagNode, "remove", {
    create: TK.Button,
    show: true,
    toggle_class: true,
    static_events: {
      click: function (e) { this.parent.fire_event("remove", e, this.parent); }
    },
    default_options: {
        class: "toolkit-remove"
    },
});

})(this, this.TK);
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

"use strict";
(function(w, TK){

var reset = function (e) {
  if (!this.options.state) return;
  if (e) {
    var t = e.target;
    while (t) {
      if (t == this.element) return;
      t = t.parentElement;
    }
  }
  state_reset.call(this);
}

var state_set = function () {
  var T = this.__temp;
  var O = this.options;
  if (O.label_confirm) {
    T.label = O.label;
    this.set("label", O.label_confirm);
  }
  
  if (O.icon_confirm) {
    T.icon = O.icon;
    this.set("icon", O.icon_confirm);
  }
  
  T.reset = reset.bind(this); 
  document.addEventListener("click", T.reset, true);
  
  if (O.timeout)
    T.timeout = setTimeout(T.reset, O.timeout);
  
  T.click = Date.now();
  
  this.set("state", true);
}

var state_reset = function () {
  var T = this.__temp;
  if (T.label)
    this.set("label", T.label);
    
  if (T.icon)
    this.set("icon", T.icon);
    
  if (T.timeout >= 0)
    w.clearTimeout(T.timeout);
  
  if (T.reset)
    document.removeEventListener("click", T.reset, true);
  
  T.reset = null;
  T.timeout = -1;
  T.label = "";
  T.icon = "";
  T.click = 0;
  
  this.set("state", false);
}

/**
 * Is fired when the button was hit two times with at least
 *   <code>interrupt</code> milliseconds between both clicks.
 * 
 * @event TK.ConfirmButton#confirmed
 */
         
var clicked = function (e) {
  var T = this.__temp;
  var O = this.options;
  if (!O.confirm) {
    this.fire_event("confirmed");
  } else if (O.state && Date.now() > T.click + O.interrupt) {
    this.fire_event("confirmed");
    state_reset.call(this);
  } else if (!O.state) {
    state_set.call(this);
  }
}
  
TK.ConfirmButton = TK.class({
  /**
   * ConfirmButton needs to clicks/taps until the <code>confirmed</code>
   * event is fired. After the first click/tap dedicated label and icon
   * can be displayed and the button gets the class <code>toolkit-active</code>.
   * After the first click a timeout set via <code>timeout</code> the
   * button resets to its default settings if no second click/tap happens.
   *
   * @class TK.ConfirmButton
   * 
   * @extends TK.Button
   *
   * @param {Object} [options={ }] - An object containing initial options.
   * 
   * @property {Boolean} [options.confirm=true] - Defines if the button acts as <code>ConfirmButton</code> or normal <code>Button</code>.
   * @property {Number} [options.timeout=2000] - Defines a time in milliseconds after the button resets to defaults if no second click happens.
   * @property {Number} [options.interrupt=0] - This is the minimum time in milliseconds between two clicks to fire the <code>confirmed</code> event.
   * @property {String} [options.label_confirm] - The label to be used while in active state.
   * @property {String} [options.label_confirm] - The icon to be used while in active state.
   */
  _class: "ConfirmButton",
  Extends: TK.Button,
  
  _options: Object.assign(Object.create(TK.Button.prototype._options), {
    confirm: "boolean",
    timeout: "number",
    interupt: "number",
    label_confirm : "string",
    icon_confirm: "string",
  }),
  options: {
    confirm: true,
    timeout: 2000,
    interrupt: 0,
    label_confirm: "",
    icon_confirm: "",
  },
  
  initialize: function (options) {
    TK.Button.prototype.initialize.call(this, options);
    TK.add_class(this.element, "toolkit-confirm-button");
    this.add_event("click", clicked.bind(this));
    this.__temp = {
      label: "",
      icon: "",
      timeout: -1,
      reset: null,
      click: 0,
    }
  },
  
  set: function (key, value) {
    if (key == "confirm" && value == false) {
      this.set("state", false);
    }
    TK.Button.prototype.set.call(this, key, value);
  }
});

})(this, this.TK);

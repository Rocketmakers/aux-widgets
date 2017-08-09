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

function cancel () {
    var self = this.parent;
    self.fire_event.call(self, "cancel");
    self.close();
}

function apply (rgb, hsl, hex) {
    var self = this.parent;
    self.fire_event.call(self, "apply", rgb, hsl, hex);
    self.close();
}

TK.ColorPickerDialog = TK.class({
    
    _class: "ColorPickerDialog",
    Extends: TK.Dialog,
    
    initialize: function (options) {
        TK.Dialog.prototype.initialize.call(this, options);
        TK.add_class(this.element, "toolkit-color-picker-dialog");
    },
});
    
/**
 * @member {TK.ColorPicker} TK.ColorPickerDialog#colorpicker - The TK.ColorPicker widget.
 */
TK.ChildWidget(TK.ColorPickerDialog, "colorpicker", {
    create: TK.ColorPicker,
    show: true,
    inherit_options: true,
    userset_delegate: true,
    static_events: {
        cancel: cancel,
        apply: apply,
    },
});
    
})(this, this.TK);

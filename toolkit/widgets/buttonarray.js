 /* toolkit provides different widgets, implements and modules for 
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
"use strict";
(function(w){
function hide_arrows() {
    var E = this.element;
    if (E.firstChild == this._prev) E.removeChild(this._prev);
    if (E.lastChild == this._next) E.removeChild(this._next);
    TK.remove_class(E, "toolkit-over");
}
function show_arrows() {
    this.element.insertBefore(this._prev, this._clip);
    this.element.appendChild(this._next);
    TK.add_class(this.element, "toolkit-over");
}
w.ButtonArray = $class({
    /* @class: ButtonArray
     * 
     * @option: buttons; Array; []; A list of button options or label strings which
     *                              is converted to button instances
     *                              on init. If get is called, the
     *                              converted list of button instances is
     *                              returned.
     * @option: auto_arrows; Bool; true; If arrow buttons are added automatically
     * @option: direction; Int; _TOOLKIT_HORIZONTAL; The direction of the button list, one out of
     *                          _TOOLKIT_HORIZONTAL or _TOOLKIT_VERTICAL
     * @option: show; Int|Button; -1; The button to scroll to, either an ID or a button instance
     * 
     * @extends: Container
     * 
     * @description:
     * ButtonArray is a list of buttons (#Button) layouted either vertically or
     * horizontally. ButtonArray automatically adds arrow buttons if the
     * overal width is smaller than the buttons list.
     */
    _class: "ButtonArray",
    Extends: Container,
    options: {
        buttons: [],
        auto_arrows: true,
        direction: _TOOLKIT_HORIZONTAL,
        show: -1
    },
    
    initialize: function (options) {
        this.buttons = [];
        Container.prototype.initialize.call(this, options);
        TK.add_class(this.element, "toolkit-buttonarray");
        /* @element: _clip; div.toolkit-clip; A clipping area containing the list of buttons */
        this._clip      = TK.element("div", "toolkit-clip");
        /* @element: _container; div.toolkit-container; A container for all the buttons */
        this._container = TK.element("div", "toolkit-container");
        this.element.appendChild(this._clip);
        this._clip.appendChild(this._container);
        
        var vert = this.get("direction") == _TOOLKIT_VERTICAL;
        
        /* @module: prev; The previous arrow #Button instance
         * @module: next; The next arrow #Button instance */
        this.prev = new Button({label: vert ? "▲" : "◄",
                                class: "toolkit-previous"});
        this.next = new Button({label: vert ? "▼" : "►",
                                class: "toolkit-next"});
        this.prev.add_event("click", this._prev_clicked.bind(this));
        this.next.add_event("click", this._next_clicked.bind(this));
        this._prev = this.prev.element;
        this._next = this.next.element;
        
        this.set("direction", this.options.direction);
        this.add_buttons(this.options.buttons);
    },
    
    resize: function () {
        this._check_arrows();
        this.set("show", this.options.show);
    },
    
    add_buttons: function (options) {
        /* @method: add_buttons
         * @option: options; Array[String|Object]; undefined; An Array containing objects with options for the buttons (see #Button for more information) or strings for the buttons labels
         * @description: Adds an array of buttons to the end of the list. */
        for (var i = 0; i < options.length; i++)
            this.add_button(options[i]);
    },
    
    add_button: function (options, pos) {
        /* @method: add_button
         * @option: options; Object|String; undefined; An object containing options for the #Button to add or a string for the label
         * @option: pos; Int|Undefined; undefined; The position to add the #Button to. If avoided the #Button is added to the end of the list
         * description: Adds a #Button to the ButtonArray */
        if (typeof options === "string")
            options = {label: options}
        var b    = new Button(options);
        var len  = this.buttons.length;
        var vert = this.options.direction == _TOOLKIT_VERT;
        if (typeof pos == "undefined")
            pos = this.buttons.length;
        if (pos == len) {
            this.buttons.push(b);
            this._container.appendChild(b.element);
        } else {
            this.buttons.splice(pos, 0, b);
            this._container.insertBefore(b.element,
                this._container.childNodes[pos]);
        }
        
        this._check_arrows();
        var c = b;
        b.add_event("click", function () {
            this._button_clicked(c);
        }.bind(this));
        /* @event: added; Button, Widget; A #Button was added to the ButtonArray */
        this.fire_event("added", b);
        return b;
    },
    remove_button: function (button) {
        /* @method: remove_button
         * @option: button; Int|Button; undefined; ID or #Button instance
         * @description: Removes a #Button from the ButtonArray */
        if (typeof button == "object")
            button = this.buttons.indexOf(button);
        if (button < 0 || button >= this.buttons.length)
            return;
        /* @event: removed; Button, Widget; A #Button was removed from the ButtonArray */
        this.fire_event("removed", this.buttons[button]);
        this.buttons[button].destroy();
        this.buttons.splice(button, 1);
        this._check_arrows();
        this.buttons[this.options.show].set("state", false);
        if (button < this.options.show)
            this.set("show", this.options.show - 1);
    },
    
    destroy: function () {
        for (var i = 0; i < this.buttons.length; i++)
            this.buttons[i].destroy();
        this.prev.destroy();
        this.next.destroy();
        TK.destroy(this._container);
        TK.destroy(this._clip);
        Container.prototype.destroy.call(this);
    },

    redraw: function() {
        Container.prototype.redraw.call(this);
        var I = this.invalid;
        var O = this.options;

        if (I.auto_arrows) {
            I.auto_arrows = false;
            if (!O.auto_arrows) {
                hide_arrows.call(this);
                I.show = true;
            } else {
                I.check_arrows = true;
            }
        }

        if (I.check_arrows) {
            I.check_arrows = false;
            if (O.auto_arrows) {
                var erect = this.element.getBoundingClientRect();
                var brect = this._list_size();
                if (O.direction == _TOOLKIT_VERT) {
                    erect = erect.height;
                } else {
                    erect = erect.width;
                }
                if (brect > erect) {
                    show_arrows.call(this);
                } else {
                    hide_arrows.call(this);
                }
                I.show = true;
            }
        }

        if (I.show) {
            I.show = false;
            this._scroll_to(O.show);
        }
    },
    
    _check_arrows: function (force) {
        var I = this.invalid;
        var O = this.options;
        if (!I.check_arrows && O.auto_arrows) {
            I.check_arrows = true;
            this.trigger_draw();
        }
    },
    
    _scroll_to: function (id, force) {
        /* move the container so that the requested button is shown */
        /* hand over a button instance or a number */
        if (typeof id == "object")
            id = this.buttons.indexOf(id);
        // TODO: the id==this.options.show check breaks the button array. for some reason
        // the style calculations here can be completely wrong on the first time and get
        // ignored henceforward
        if (id < 0 || id >= this.buttons.length/* || (id == this.options.show && !force)*/)
            return this.options.show;
        if (this.options.show >= 0 && this.options.show < this.buttons.length)
            this.buttons[this.options.show].set("state", false);
        var dir      = this.options.direction == _TOOLKIT_VERTICAL;
        var subd     = dir ? 'top' : 'left';
        var subs     = dir ? 'height' : 'width';
        var btn      = this._container.childNodes[id];
        var btnrect  = btn.getBoundingClientRect();
        var conrect  = this._container.getBoundingClientRect();
        var btnsize  = toolkit["outer_" + subs](btn);
        var btnpos   = btnrect[subd] - conrect[subd];
        var listsize = this._list_size();
        var clipsize = this._clip.getBoundingClientRect()[subs];
        this._container.style[subd] = -(Math.max(0, Math.min(listsize - clipsize, btnpos - (clipsize / 2 - btnsize / 2)))) + "px";
        var tmp = this.options.show;
        this.options.show = id;
        this.buttons[id].set("state", true);
        /* @event: changed; Button, ID, Widget; A #Button was requested (clicked or scrolled to) */
        if (tmp != id) {
            this.fire_event("changed", this.buttons[id], id);
        }
        return id;
    },
    
    _list_size: function () {
        var dir      = this.options.direction == _TOOLKIT_VERTICAL;
        var subd     = dir ? 'top' : 'left';
        var subs     = dir ? 'height' : 'width';
        var subm2    = dir ? 'marginBottom' : 'marginRight';
        var btn      = this._container.lastChild;
        var btnstyle = btn.currentStyle || window.getComputedStyle(btn);
        var lastrect = this._container.lastChild.getBoundingClientRect();
        var conrect  = this._container.getBoundingClientRect();
        return lastrect[subd] - conrect[subd] + lastrect[subs] + parseInt(btnstyle[subm2]);
    },
    
    _prev_clicked: function (e) {
        /* @event: clicked; Button, ID, Widget; When a #Button or an arrow gets clicked */
        var id = this._scroll_to(this.options.show - 1);
        this.fire_event("clicked", this.buttons[id], id);
    },
    
    _next_clicked: function (e) {
        this.fire_event("clicked", this._scroll_to(this.options.show + 1));
    },
    
    _button_clicked: function (button) {
        this.fire_event("clicked", this._scroll_to(button));
    },
    
    set: function (key, value, hold) {
        switch (key) {
            case "buttons":
                if (hold)
                    break;
                for (var i = 0; i < this.buttons.length; i++)
                    this.buttons[i].destroy();
                this.buttons = [];
                this.add_buttons(value);
                break;
            case "direction":
                TK.remove_class(this.element, "toolkit-vertical");
                TK.remove_class(this.element, "toolkit-horizontal");
                TK.add_class(this.element, "toolkit-" + (value == _TOOLKIT_VERT ? "vertical" : "horizontal"));
                this.prev.set("label", value == _TOOLKIT_VERT ? "▲" : "◀");
                this.next.set("label", value == _TOOLKIT_VERT ? "▼" : "▶");
                break;
        }
        Container.prototype.set.call(this, key, value, hold);
    },
    get: function (key) {
        switch (key) {
            case "buttons":
                return this.buttons;
        }
        return Container.prototype.get.call(this, key);
    }
});
})(this);

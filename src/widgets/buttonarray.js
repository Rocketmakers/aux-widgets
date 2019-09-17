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

import { define_class } from './../widget_helpers.js';
import { element, add_class, remove_class, inner_height, inner_width, toggle_class } from './../utils/dom.js';
import { Container } from './container.js';
import { Button } from './button.js';

 /**
 * The <code>useraction</code> event is emitted when a widget gets modified by user interaction.
 * The event is emitted for the option <code>show</code>.
 *
 * @event ButtonArray#useraction
 * @param {string} name - The name of the option which was changed due to the users action
 * @param {mixed} value - The new value of the option
 */
 
function hide_arrows() {
    if (!this._prev.parentNode) return;
    if (this._prev.parentNode) this._prev.remove();
    if (this._next.parentNode) this._next.remove();
    var E = this.element;
    remove_class(E, "toolkit-over");
    this.trigger_resize();
}
function show_arrows() {
    if (this._prev.parentNode) return;
    var E = this.element;
    E.insertBefore(this._prev, this._clip);
    E.appendChild(this._next);
    add_class(E, "toolkit-over");
    this.trigger_resize();
}
function prev_clicked(e) {
    this.userset("show", Math.max(0, this.options.show - 1));
}
function prev_dblclicked(e) {
    this.userset("show", 0);
}

function next_clicked(e) {
    this.userset("show", Math.min(this.buttons.length-1, this.options.show + 1));
}
function next_dblclicked(e) {
    this.userset("show", this.buttons.length-1);
}

function button_clicked(button) {
    this.userset("show", this.buttons.indexOf(button));
}
function easeInOut (t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t + b;
    t--;
    return -c/2 * (t*(t-2) - 1) + b;
}

var zero = { width: 0, height: 0};

export const ButtonArray = define_class({
    /**
     * ButtonArray is a list of ({@link Button})s, arranged
     * either vertically or horizontally. ButtonArray is able to
     * adds arrow buttons automatically if the overal size is smaller
     * than the buttons list.
     *
     * @param {Object} [options={ }] - An object containing initial options.
     * 
     * @property {Array<Object|String>} [options.buttons=[]] - A list of
     *   button options objects or label strings which is converted to
     *   button instances on init. If get is called, a converted list
     *   of button instances is returned.
     * @property {Boolean} [options.auto_arrows=true] - Set to `false`
     *   to disable auto-generated arrow buttons.
     * @property {String} [options.direction="horizontal"] - The layout
     *   of the button list, either "horizontal" or "vertical".
     * @property {Integer|Button} [options.show=-1] - The {@link Button}
     *   to scroll to and highlight, expects either the button index starting
     *   from zero or the {@link Button} instance itself.
     * @property {Number} [options.scroll=0] - Offer scrollbars and "real"
     *   scrolling. This reduces performance because movement is done in JS
     *   instead of (pesumably accelerated) CSS transitions. 0 for standard
     *   behavior, n > 0 is handled as milliseconds for transitions.
     * @property {Object} [options.button_class=Button] - A class to
     *   be used for instantiating the buttons.
     * 
     * @class ButtonArray
     * 
     * @extends Container
     */
    _class: "ButtonArray",
    Extends: Container,
    _options: Object.assign(Object.create(Container.prototype._options), {
        buttons: "array",
        auto_arrows: "boolean",
        direction: "string",
        show: "int",
        resized: "boolean",
        scroll: "number",
        button_class: "object",
    }),
    options: {
        buttons: [],
        auto_arrows: true,
        direction: "horizontal",
        show: -1,
        resized: false,
        scroll: 0,
        button_class: Button,
    },
    static_events: {
        set_buttons: function(value) {
            for (var i = 0; i < this.buttons.length; i++)
                this.buttons[i].destroy();
            this.buttons = [];
            this.add_buttons(value);
        },
        set_direction: function(value) {
            this.prev.set("label", value === "vertical" ? "\u25B2" : "\u25C0");
            this.next.set("label", value === "vertical" ? "\u25BC" : "\u25B6");
        },
        set_show: function(value) {
            var button = this.current();
            if (button) {
                button.set("state", true);
                /**
                 * Is fired when a button is activated.
                 * 
                 * @event ButtonArray#changed
                 * 
                 * @param {Button} button - The {@link Button} which was clicked.
                 * @param {int} id - the ID of the clicked {@link Button}.
                 */
                this.fire_event("changed", button, value);
            }
        },
    },
    initialize: function (options) {
        /**
         * @member {Array} ButtonArray#buttons - An array holding all {@link Button}s.
         */
        this.buttons = [];
        Container.prototype.initialize.call(this, options);
        /**
         * @member {HTMLDivElement} ButtonArray#element - The main DIV container.
         *   Has class <code>toolkit-buttonarray</code>.
         */
        add_class(this.element, "toolkit-buttonarray");
        /**
         * @member {HTMLDivElement} ButtonArray#_clip - A clipping area containing the list of {@link Button}s.
         *    Has class <code>toolkit-clip</code>.
         */
        this._clip      = element("div", "toolkit-clip");
        /**
         * @member {HTMLDivElement} ButtonArray#_container - A container for all the {@link Button}s.
         *    Has class <code>toolkit-container</code>.
         */
        this._container = element("div", "toolkit-container");
        this.element.appendChild(this._clip);
        this._clip.appendChild(this._container);
        
        var vert = this.get("direction") === "vertical";
        
        /**
         * @member {Button} ButtonArray#prev - The previous arrow {@link Button} instance.
         */
        this.prev = new Button({class: "toolkit-previous", dblclick:400});
        /**
         * @member {Button} ButtonArray#next - The next arrow {@link Button} instance.
         */
        this.next = new Button({class: "toolkit-next", dblclick:400});
        
        this.prev.add_event("click", prev_clicked.bind(this));
        this.prev.add_event("doubleclick", prev_dblclicked.bind(this));
        this.next.add_event("click", next_clicked.bind(this));
        this.next.add_event("doubleclick", next_dblclicked.bind(this));
        
        /**
         * @member {HTMLDivElement} ButtonArray#_prev - The HTMLDivElement of the previous {@link Button}.
         */
        this._prev = this.prev.element;
        /**
         * @member {HTMLDivElement} ButtonArray#_next - The HTMLDivElement of the next {@link Button}.
         */
        this._next = this.next.element;
        
        this.set("direction", this.options.direction);
        this.set("scroll", this.options.scroll);
        this.add_children([this.prev, this.next]);
        this.add_buttons(this.options.buttons);
        this._sizes = null;
    },
    
    resize: function () {
        var tmp, e;

        var os = this._sizes;
        var s = {
            container: this._container.getBoundingClientRect(),
            clip: {
                height: inner_height(this._clip),
                width: inner_width(this._clip),
            },
            buttons: [],
            buttons_pos: [],
            prev: this._prev.parentNode ? this._prev.getBoundingClientRect() : os ? os.prev : zero,
            next: this._next.parentNode ? this._next.getBoundingClientRect() : os ? os.next : zero,
            element: this.element.getBoundingClientRect(),
        };

        this._sizes = s;

        for (var i = 0; i < this.buttons.length; i++) {
            e = this.buttons[i].element;
            s.buttons[i] = e.getBoundingClientRect();
            s.buttons_pos[i] = { left: e.offsetLeft, top: e.offsetTop };
        }

        Container.prototype.resize.call(this);
    },
    
    /**
     * Adds an array of buttons to the end of the list.
     *
     * @method ButtonArray#add_buttons
     * 
     * @param {Array.<string|object>} options - An Array containing objects
     *   with options for the buttons (see {@link Button} for more
     *   information) or strings for the buttons labels.
     */
    add_buttons: function (options) {
        for (var i = 0; i < options.length; i++)
            this.add_button(options[i]);
    },
    
    /**
     * Adds a {@link Button} to the ButtonArray.
     *
     * @method ButtonArray#add_button
     * 
     * @param {Object|string} options - An object containing options for the
     *   {@link Button} to add or a string for the label.
     * @param {integer} [position] - The position to add the {@link Button}
     *   to. If avoided the {@link Button} is added to the end of the list.
     * 
     * @returns {Button} The {@link Button} instance.
     */
    add_button: function (options, position) {
        if (typeof options === "string")
            options = {label: options}
        var b    = new this.options.button_class(options);
        var len  = this.buttons.length;
        var vert = this.options.direction === "vertical";
        if (position === void(0))
            position = this.buttons.length;
        if (position === len) {
            this.buttons.push(b);
            this._container.appendChild(b.element);
        } else {
            this.buttons.splice(position, 0, b);
            this._container.insertBefore(b.element,
                this._container.childNodes[position]);
        }

        this.add_child(b);

        this.trigger_resize();
        b.add_event("click", button_clicked.bind(this, b));
        /**
         * A {@link Button} was added to the ButtonArray.
         *
         * @event ButtonArray#added
         * 
         * @param {Button} button - The {@link Button} which was added to ButtonArray.
         */
        if (b === this.current())
            b.set("state", true);
        this.fire_event("added", b);

        return b;
    },
    /**
     * Removes a {@link Button} from the ButtonArray.
     *
     * @method ButtonArray#remove_button
     * 
     * @param {integer|Button} button - button index or the {@link Button}
     *   instance to be removed.
     */
    remove_button: function (button) {
        if (typeof button === "object")
            button = this.buttons.indexOf(button);
        if (button < 0 || button >= this.buttons.length)
            return;
        /**
         * A {@link Button} was removed from the ButtonArray.
         *
         * @event ButtonArray#removed
         * 
         * @param {Button} button - The {@link Button} instance which was removed.
         */
        this.fire_event("removed", this.buttons[button]);
        if (this.current() && button <= this.options.show) {
            this.options.show --;
            this.invalid.show = true;
            this.trigger_draw();
        }
        this.buttons[button].destroy();
        this.buttons.splice(button, 1);
        this.trigger_resize();
    },
    
    destroy: function () {
        for (var i = 0; i < this.buttons.length; i++)
            this.buttons[i].destroy();
        this.prev.destroy();
        this.next.destroy();
        this._container.remove();
        this._clip.remove();
        Container.prototype.destroy.call(this);
    },

    redraw: function() {
        Container.prototype.redraw.call(this);
        var I = this.invalid;
        var O = this.options;
        var S = this._sizes;

        if (I.direction) {
            var E = this.element;
            remove_class(E, "toolkit-vertical", "toolkit-horizontal");
            add_class(E, "toolkit-"+O.direction);
        }

        if (I.validate("direction", "auto_arrows") || I.resized) {
            if (O.auto_arrows && O.resized && !O.needs_resize) {
                var dir      = O.direction === "vertical";
                var subd     = dir ? 'top' : 'left';
                var subs     = dir ? 'height' : 'width';

                var clipsize = S.clip[subs];
                var listsize = 0;
                
                if (this.buttons.length)
                    listsize = S.buttons_pos[this.buttons.length-1][subd] +
                               S.buttons[this.buttons.length-1][subs];
                if (Math.round(listsize) > Math.round(clipsize)) {
                    show_arrows.call(this);
                } else if (Math.round(listsize) <= Math.round(clipsize)) {
                    hide_arrows.call(this);
                }
            } else if (!O.auto_arrows) {
                hide_arrows.call(this);
            }
        }
        if (I.validate("show", "direction", "resized")) {
            if (O.resized && !O.needs_resize) {
                var show = O.show
                if (show >= 0 && show < this.buttons.length) {
                    /* move the container so that the requested button is shown */
                    var dir      = O.direction === "vertical";
                    var subd     = dir ? 'top' : 'left';
                    var subt     = dir ? 'scrollTop' : 'scrollLeft';
                    var subs     = dir ? 'height' : 'width';

                    var btnrect  = S.buttons[show];
                    var clipsize = S.clip[subs];
                    var listsize = 0;
                    var btnsize = 0;
                    var btnpos = 0;
                    if (S.buttons.length) {
                        listsize = S.buttons_pos[this.buttons.length-1][subd] +
                                   S.buttons[this.buttons.length-1][subs];
                        btnsize  = S.buttons[show][subs];
                        btnpos   = S.buttons_pos[show][subd];
                    }
                    
                    var p = (Math.max(0, Math.min(listsize - clipsize, btnpos - (clipsize / 2 - btnsize / 2))));
                    if (this.options.scroll) {
                        var s = this._clip[subt];
                        this._scroll = {to: ~~p, from: s, dir: p > s ? 1 : -1, diff: ~~p - s, time: Date.now()};
                        this.invalid.scroll = true;
                        if (this._container.style[subd])
                            this._container.style[subd] = null;
                    } else {
                        this._container.style[subd] = -p + "px";
                        if (s)
                            this._clip[subt] = 0;
                    }
                }
            }
        }
        if (this.invalid.scroll && this._scroll) {
            var subt = O.direction === "vertical" ? 'scrollTop' : 'scrollLeft';
            var s = ~~this._clip[subt];
            var _s = this._scroll;
            var now = Date.now();
            if ((s >= _s.to && _s.dir > 0)
             || (s <= _s.to && _s.dir < 0)
             || now > (_s.time + O.scroll)) {
                this.invalid.scroll = false;
                this._clip[subt] = _s.to;
            } else {
                this._clip[subt] = easeInOut(Date.now() - _s.time, _s.from, _s.diff, O.scroll);
                this.trigger_draw_next();
            }
        }
    },
    
    /**
     * The currently active button.
     *
     * @method ButtonArray#current
     * 
     * @returns {Button|Boolean} The active {@link Button} or `false`, if none is selected.
     */
    current: function() {
        var n = this.options.show;
        if (n >= 0 && n < this.buttons.length) {
            return this.buttons[n];
        }
        return false;
    },
    
    set: function (key, value) {
        var button;
        if (key === "show") {
            if (value < 0) value = 0;
            if (value >= this.buttons.length) value = this.buttons.length - 1;
            if (value === this.options.show) return value;

            button = this.current();
            if (button) button.set("state", false);
        }
        if (key == "scroll") {
            toggle_class(this.element, "toolkit-scroll", value > 0);
            this.trigger_resize();
        }
        return Container.prototype.set.call(this, key, value);
    },
    get: function (key) {
        if (key === "buttons") return this.buttons;
        return Container.prototype.get.call(this, key);
    }
});

import { warn } from './../utils/log.js';
import { remove_event_listener, add_event_listener } from './../utils/events.js';
import { define_class, add_event, remove_event } from './../widget_helpers.js';

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
function call_handler(self, fun, args) {
    try {
        return fun.apply(self, args);
    } catch (e) {
        warn("event handler", fun, "threw", e);
    }
}
function dispatch_events(self, handlers, args) {
    var v;
    if (Array.isArray(handlers)) {
        for (var i = 0; i < handlers.length; i++) {
            v = call_handler(self, handlers[i], args);
            if (v !== void(0)) return v;
        }
    } else return call_handler(self, handlers, args);
}
var __native_events = {
    // mouse
    mouseenter : true,
    mouseleave : true,
    mousedown  : true,
    mouseup    : true,
    mousemove  : true,
    mouseover  : true,

    click      : true,
    dblclick   : true,

    startdrag  : true,
    stopdrag   : true,
    drag       : true,
    dragenter  : true,
    dragleave  : true,
    dragover   : true,
    drop       : true,
    dragend    : true,

    // touch
    touchstart : true,
    touchend   : true,
    touchmove  : true,
    touchenter : true,
    touchleave : true,
    touchcancel: true,

    keydown    : true,
    keypress   : true,
    keyup      : true,
    scroll     : true,
    focus      : true,
    blur       : true,

    // mousewheel
    mousewheel : true,
    DOMMouseScroll : true,
    wheel : true,

    submit     : true,
    contextmenu: true,
};
export function is_native_event(type) {
    return __native_events[type];
}

function remove_native_events(element) {
    var type;
    var s = this.static_events;
    var d = this.__events;
    var handler = this.__native_handler;

    for (type in s) if (is_native_event(type))
        remove_event_listener(element, type, handler);

    for (type in d) if (is_native_event(type) && (!s || !s.hasOwnProperty(type)))
        remove_event_listener(element, type, handler);
}
function add_native_events(element) {
    var type;
    var s = this.static_events;
    var d = this.__events;
    var handler = this.__native_handler;

    for (type in s) if (is_native_event(type))
        add_event_listener(element, type, handler);

    for (type in d) if (is_native_event(type) && (!s || !s.hasOwnProperty(type)))
        add_event_listener(element, type, handler);
}
function native_handler(ev) {
    /* FIXME:
     * * mouseover and error are cancelled with true
     * * beforeunload is cancelled with null
     */
    if (this.fire_event(ev.type, ev) === false) return false;
}
function has_event_listeners(event) {
    var ev = this.__events;

    if (ev.hasOwnProperty(event)) return true;

    ev = this.static_events;

    return ev && ev.hasOwnProperty(event);
}
/**
 * This is the base class for all widgets in toolkit.
 * It provides an API for event handling and other basic implementations.
 *
 * @class Base
 */
export const Base = define_class({
    initialize : function(options) {
        this.__events = {};
        this.__event_target = null;
        this.__native_handler = native_handler.bind(this);
        this.set_options(options);
        this.fire_event("initialize");
    },
    initialized : function() {
        /**
         * Is fired when an instance is initialized.
         * 
         * @event Base#initialized
         */
        this.fire_event("initialized");
    },
    /**
     * Destroys all event handlers and the options object.
     *
     * @method Base#destroy
     */
    destroy : function() {
        if (this.__event_target) {
            remove_native_events.call(this, this.__event_target, this.__events);
        }

        this.__events = null;
        this.__event_target = null;
        this.__native_handler = null;
        this.options = null;
    },
    /**
     * Merges a new options object into the existing one,
     * including deep copies of objects. If an option key begins with
     * the string "on" it is considered as event handler. In this case
     * the value should be the handler function for the event with
     * the corresponding name without the first "on" characters.
     *
     * @method Base#set_options(options)
     * 
     * @param {Object} [options={ }] - An object containing initial options.
     */
    set_options : function(o) {
        var opt = this.options;
        var key, a, b;
        if (typeof(o) !== "object") {
            delete this.options;
            o = {};
        } else if (typeof(opt) === "object") for (key in o) if (o.hasOwnProperty(key)) {
            a = o[key];
            b = opt[key];
            if (typeof a === "object" && a &&
                Object.getPrototypeOf(Object.getPrototypeOf(a)) === null &&
                typeof b === "object" && b &&
                Object.getPrototypeOf(Object.getPrototypeOf(b)) === null
                ) {
                o[key] = Object.assign({}, b, a);
            }
        }
        if (this.hasOwnProperty("options")) {
            this.options = Object.assign(opt, o);
        } else if (opt) {
            this.options = Object.assign(Object.create(opt), o);
        } else {
            this.options = Object.assign({}, o);
        }
        for (key in this.options) if (key.startsWith("on")) {
            this.add_event(key.substr(2).toLowerCase(), this.options[key]);
            delete this.options[key];
        }
    },
    /**
     * Get the value of an option.
     *
     * @method Base#get
     * 
     * @param {string} key - The option name.
     */
    get: function (key) {
        return this.options[key];
    },
    /**
     * Sets an option. Fires both the events <code>set</code> with arguments <code>key</code>
     * and <code>value</code>; and the event <code>'set_'+key</code> with arguments <code>value</code>
     * and <code>key</code>.
     *
     * @method Base#set
     * 
     * @param {string} key - The name of the option.
     * @param {mixed} value - The value of the option.
     * 
     * @emits Base#set
     * @emits Base#set_[option]
     */
    set: function (key, value) {
        var e;

        this.options[key] = value;
        /**
         * Is fired when an option is set.
         * 
         * @event Base#set
         * 
         * @param {string} name - The name of the option.
         * @param {mixed} value - The value of the option.
         */
        if (this.has_event_listeners("set"))
            this.fire_event("set", key, value);
        /**
         * Is fired when an option is set.
         * 
         * @event Base#set_[option]
         * 
         * @param {mixed} value - The value of the option.
         */
        e = "set_"+key;
        if (this.has_event_listeners(e))
            this.fire_event(e, value, key);

        return value;
    },
    /**
     * Sets an option by user interaction. Emits the <code>userset</code>
     * event. The <code>userset</code> event can be cancelled (if an event handler
     * returns <code>false</code>), in which case the option is not set.
     * Returns <code>true</code> if the option was set, <code>false</code>
     * otherwise. If the option was set, it will emit a <code>useraction</code> event.
     *
     * @method Base#userset
     * 
     * @param {string} key - The name of the option.
     * @param {mixed} value - The value of the option.
     *
     * @emits Base#userset
     * @emits Base#useraction
     */
    userset: function(key, value) {
        if (false === this.fire_event("userset", key, value)) return false;
        value = this.set(key, value);
        this.fire_event("useraction", key, value);
        return true;
    },
    /**
     * Delegates all occuring DOM events of a specific DOM node to the widget.
     * This way the widget fires e.g. a click event if someone clicks on the
     * given DOM node.
     * 
     * @method Base#delegate_events
     * 
     * @param {HTMLElement} element - The element all native events of the widget should be bound to.
     * 
     * @returns {HTMLElement} The element
     * 
     * @emits Base#delegated
     */
    delegate_events: function (element) {
        var old_target = this.__event_target;
        /**
         * Is fired when an element is delegated.
         * 
         * @event Base#delegated
         * 
         * @param {HTMLElement|Array} element - The element which receives all
         *      native DOM events.
         * @param {HTMLElement|Array} old_element - The element which previously
         *      received all native DOM events.
         */
        this.fire_event("delegated", element, old_target);

        if (old_target) remove_native_events.call(this, old_target);
        if (element) add_native_events.call(this, element);

        this.__event_target = element;

        return element;
    },
    /**
     * Register an event handler.
     *
     * @method Base#add_event
     * 
     * @param {string} event - The event descriptor.
     * @param {Function} func - The function to call when the event happens.
     * @param {boolean} prevent - Set to true if the event should prevent the default behavior.
     * @param {boolean} stop - Set to true if the event should stop bubbling up the tree.
     */
    add_event: function (event, func) {
        var ev;

        if (typeof event !== "string")
            throw new TypeError("Expected string.");

        if (typeof func !== "function")
            throw new TypeError("Expected function.");

        if (arguments.length !== 2)
            throw new Error("Bad number of arguments.");

        if (is_native_event(event) && (ev = this.__event_target) && !this.has_event_listeners(event))
            add_event_listener(ev, event, this.__native_handler);
        ev = this.__events;
        add_event(ev, event, func);
    },
    /**
     * Removes the given function from the event queue.
     * If it is a native DOM event, it removes the DOM event listener
     * as well.
     *
     * @method Base#remove_event
     * 
     * @param {string} event - The event descriptor.
     * @param {Function} fun - The function to remove.
     */
    remove_event: function (event, fun) {
        remove_event(this.__events, event, fun);

        // remove native DOM event listener from __event_target
        if (is_native_event(event) && !this.has_event_listeners(event)) {
            var ev = this.__event_target;
            if (ev) remove_event_listener(ev, event, this.__native_handler);
        }
    },
    /**
     * Fires an event.
     *
     * @method Base#fire_event
     * 
     * @param {string} event - The event descriptor.
     * @param {...*} args - Event arguments.
     */
    fire_event: function (event) {
        var ev;
        var args;
        var v;

        ev = this.__events;

        if (ev !== void(0) && (event in ev)) {
            ev = ev[event];

            args = Array.prototype.slice.call(arguments, 1);

            v = dispatch_events(this, ev, args);
            if (v !== void(0)) return v;
        }

        ev = this.static_events;

        if (ev !== void(0) && (event in ev)) {
            ev = ev[event];

            if (args === void(0)) args = Array.prototype.slice.call(arguments, 1);

            v = dispatch_events(this, ev, args);
            if (v !== void(0)) return v;
        }
    },
    /**
     * Test if the event descriptor has some handler functions in the queue.
     *
     * @method Base#has_event_listeners
     * 
     * @param {string} event - The event desriptor.
     * 
     * @returns {boolean} True if the event has some handler functions in the queue, false if not.
     */
    has_event_listeners: has_event_listeners,
    /**
     * Add multiple event handlers at once, either as dedicated event handlers or a list of event
     * descriptors with a single handler function.
     *
     * @method Base#add_events
     * 
     * @param {Object | Array} events - Object with event descriptors as keys and functions as
     *   values or Array of event descriptors. The latter requires a handler function as the
     *   second argument.
     * @param {Function} func - A function to add as event handler if the first argument is an
     *   array of event desriptors.
     */
    add_events: function (events, func) {
        var i;
        if (Array.isArray(events)) {
            for (i = 0; i < events.length; i++)
                this.add_event(events[i], func);
        } else {
            for (i in events) 
                if (events.hasOwnProperty(i))
                    this.add_event(i, events[i]);
        }
    },
    /**
     * Remove multiple event handlers at once, either as dedicated event handlers or a list of
     * event descriptors with a single handler function.
     *
     * @method Base#remove_events
     * 
     * @param {Object | Array} events - Object with event descriptors as keys and functions as
     *   values or Array of event descriptors. The latter requires the handler function as the
     *   second argument.
     * @param {Function} func - A function to remove from event handler queue if the first
     *   argument is an array of event desriptors.
     */
    remove_events: function (events, func) {
        var i;
        if (Array.isArray(events)) {
            for (i = 0; i < events.length; i++)
                this.remove_event(events[i], func);
        } else {
            for (i in events)
                if (events.hasOwnProperty(i))
                    this.remove_event(i, events[i]);
        }
    },
    /**
     * Fires several events.
     *
     * @method Base#fire_events
     * 
     * @param {Array.<string>} events - A list of event names to fire.
     */
    fire_events: function (events) {
        for (var i in events) {
            if (events.hasOwnProperty(i))
                this.fire_event(i, events[i]);
        }
    }
});
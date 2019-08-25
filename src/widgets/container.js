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
import { Widget } from './widget.js';
import { S } from '../dom_scheduler.js';
import { element, add_class, remove_class, get_duration, empty, set_content } from '../utils/dom.js';
import { warn } from '../utils/log.js';

function after_hiding() {
    this.__hide_id = false;
    if (this.options.display_state === "hiding")
        this.set("display_state", "hide");
}
function after_showing() {
    this.__hide_id = false;
    if (this.options.display_state === "showing")
        this.set("display_state", "show");
}
function enable_draw_self() {
    if (this._drawn) return;
    this._drawn = true;
    if (this.needs_redraw) {
        S.add(this._redraw, 1);
    }
    /**
     * Is fired when the container is shown.
     * 
     * @event Container#show
     */
    this.fire_event("show");
}
function enable_draw_children() {
    var C = this.children;
    var H = this.hidden_children;
    if (C) for (var i = 0; i < C.length; i++) if (!H[i]) C[i].enable_draw();
}
function disable_draw_self() {
    if (!this._drawn) return;
    this._drawn = false;
    if (this.needs_redraw) {
        S.remove(this._redraw, 1);
        S.remove_next(this._redraw, 1);
    }
    /**
     * Is fired when the container is hidden.
     * 
     * @event Container#hide
     */
    this.fire_event("hide");
}
function disable_draw_children() {
    var C = this.children;
    var H = this.hidden_children;
    if (C) for (var i = 0; i < C.length; i++) if (!H[i]) C[i].disable_draw();
}
export const Container = define_class({
    /**
     * Container represents a <code>&lt;DIV></code> element.
     *
     * Container have four different display states: <code>show</code>, <code>hide</code>,
     * <code>showing</code> and <code>hiding</code>. Each of these states has a corresponding
     * CSS class called <code>toolkit-show</code>, <code>toolkit-hide</code>, <code>toolkit-showing</code>
     * and <code>toolkit-hiding</code>, respectively. The display state can be controlled using
     * the methods {@link Container#show}, {@link Container#hide} and {@link Widget#toggle_hidden}.
     *
     * A container can keep track of the display states of its children.
     * The display state of a child can be changed using {@link Container#hide_child},
     * {@link Container#show_child} and {@link Container#toggle_child}.
     *
     * @class Container
     * 
     * @extends Widget
     *
     * @param {Object} [options={ }] - An object containing initial options.
     * 
     * @property {String|HTMLElement} [options.content] - The content of the container. It can either be
     *   a string which is interpreted as Text or a DOM node. Note that this options will remove all
     *   child nodes from the container element including those added via append_child.
     * @property {Number} [options.hiding_duration] - The duration in ms of the hiding CSS
     *   transition/animation of this container. If this option is not set, the transition duration
     *   will be determined by the computed style, which can be rather
     *   expensive. Setting this option explicitly can therefore be an optimization.
     * @property {Number} [options.showing_duration] - The duration in ms of the showing CSS
     *   transition/animation of this container.
     * @property {String} [options.display_state="show"] - The current display state of this container.
     *   Do not modify, manually.
     * @property {Array<Object>} [options.children=[]] - Add child widgets on init. Will not be maintained on runtime! Just for convenience purposes on init.
     */
    _class: "Container",
    Extends: Widget,
    _options: Object.assign(Object.create(Widget.prototype._options), {
        content: "string",
        display_state: "string",
        hiding_duration: "int",
        showing_duration: "int",
        children: "array",
    }),
    options: {
        display_state : "show",
        children: [],
    },
    initialize: function (options) {
        var E;
        Widget.prototype.initialize.call(this, options);
        this.hidden_children = [];
        /** 
         * @member {HTMLDivElement} Container#element - The main DIV element. Has class <code>toolkit-container</code> 
         */
        if (!(E = this.element)) this.element = E = element("div");
        add_class(E, "toolkit-container"); 
        this.widgetize(E, true, true, true);

        this.__after_hiding = after_hiding.bind(this);
        this.__after_showing = after_showing.bind(this);
        this.__hide_id = false;
        add_class(E, "toolkit-show");
        
        if (this.options.children)
            this.append_children(this.options.children);
    },
    
    /**
     * Calls {@link Container#append_child} for an array of widgets.
     * 
     * @method Container#append_children
     *
     * @param {Array.<Widget>} children - The child widgets to append.
     */
    append_children : function (a) {
        a.map(this.append_child, this);
    },
    /**
     * Appends <code>child.element</code> to the container element and
     * registers <code>child</code> as a child widget.
     * 
     * @method Container#append_child
     *
     * @param {Widget} child - The child widget to append.
     */
    append_child : function(child) {
        child.set("container", this.element);
        this.add_child(child);
    },
    set_parent : function(parent) {
        if (parent && !(parent instanceof Container)) {
            warn("Container %o should not be child of non-container %o", this, parent);
        }
        Widget.prototype.set_parent.call(this, parent);
    },
    add_child : function(child) {
        Widget.prototype.add_child.call(this, child);
        var H = this.hidden_children;
        if (!H) this.hidden_children = H = [];
        H.push(false);
    },
    remove_child : function(child) {
        if (!child) return;
        child.disable_draw();
        child.parent = null;
        var C = this.children;
        if (C === null) return;
        var H = this.hidden_children;
        var i = C.indexOf(child);
        if (i !== -1) {
            C.splice(i, 1);
            H.splice(i, 1);
        }
    },
    enable_draw: function () {
        if (this._drawn) return;
        enable_draw_self.call(this);
        enable_draw_children.call(this);
    },
    disable_draw: function () {
        if (!this._drawn) return;
        disable_draw_self.call(this);
        disable_draw_children.call(this);
    },
    /** 
     * Starts the transition of the <code>display_state</code> to <code>hide</code>.
     *
     * @method Container#hide
     *
     */
    hide: function () {
        var O = this.options;
        if (O.display_state === "hide") return;
        disable_draw_children.call(this);
        enable_draw_self.call(this);
        if (O.display_state === "hiding") return;
        this.set("display_state", "hiding");
    },
    /** 
     * Immediately switches the display state of this container to <code>hide</code>.
     * Unlike {@link Container#hide} this method does not perform the hiding transition
     * and immediately modifies the DOM by setting the <code>toolkit-hide</code> class.
     *
     * @method Container#force_hide
     *
     */
    force_hide: function () {
        var O = this.options;
        if (O.display_state === "hide") return;
        this.disable_draw();
        var E = this.element;
        O.display_state = "hide";
        add_class(E, "toolkit-hide");
        remove_class(E, "toolkit-hiding", "toolkit-showing", "toolkit-show");
    },
    /** 
     * Starts the transition of the <code>display_state</code> to <code>show</code>.
     *
     * @method Container#show
     *
     */
    show: function() {
        var O = this.options;
        enable_draw_self.call(this);
        if (O.display_state === "show" || O.display_state === "showing") return;
        this.set("display_state", "showing");
    },
    /** 
     * Immediately switches the display state of this container to <code>show</code>.
     * Unlike {@link Container#hide} this method does not perform the hiding transition
     * and immediately modifies the DOM by setting the <code>toolkit-show</code> class.
     *
     * @method Container#force_show
     *
     */
    force_show: function() {
        var O = this.options;
        if (O.display_state === "show") return;
        this.enable_draw();
        var E = this.element;
        O.display_state = "show";
        add_class(E, "toolkit-show");
        remove_class(E, "toolkit-hiding", "toolkit-showing", "toolkit-hide");
    },
    show_nodraw: function() {
        var O = this.options;
        if (O.display_state === "show") return;
        this.set("display_state", "show");

        var C = this.children;
        var H = this.hidden_children;
        if (C) for (var i = 0; i < C.length; i++) if (!H[i]) C[i].show_nodraw();
    },
    hide_nodraw: function() {
        var O = this.options;
        if (O.display_state === "hide") return;
        this.set("display_state", "hide");

        var C = this.children;
        var H = this.hidden_children;
        if (C) for (i = 0; i < C.length; i++) if (!H[i]) C[i].hide_nodraw();
    },

    /**
     * Switches the hidden state of a child to <code>hidden</code>.
     * The argument is either the child index or the child itself.
     *
     * @method Container#hide_child
     * @param {Object|integer} child - Child or its index.
     *
     */
    hide_child: function(i) {
        var C = this.children;
        var H = this.hidden_children;

        if (typeof i !== "number") {
            i = C.indexOf(i);
            if (i === -1) throw new Error("Cannot find child.");
        }

        H[i] = true;
        C[i].hide();
    },

    /**
     * Switches the hidden state of a child to <code>shown</code>.
     * The argument is either the child index or the child itself.
     *
     * @method Container#show_child
     * @param {Object|integer} child - Child or its index.
     *
     */
    show_child: function(i) {
        var C = this.children;
        var H = this.hidden_children;

        if (typeof i !== "number") {
            i = C.indexOf(i);
            if (i === -1) throw new Error("Cannot find child.");
        }

        if (H[i]) {
            H[i] = false;
            if (this.is_drawn()) C[i].show();
            else C[i].show_nodraw();
        }
    },

    /**
     * Toggles the hidden state of a child.
     * The argument is either the child index or the child itself.
     *
     * @method Container#toggle_child
     * @param {Object|integer} child - Child or its index.
     *
     */
    toggle_child: function(i) {
        var C = this.children;
        var H = this.hidden_children;

        if (typeof i !== "number") {
            i = C.indexOf(i);
            if (i === -1) throw new Error("Cannot find child.");
        }
        if (H[i]) this.show_child(i);
        else this.hide_child(i);
    },

    visible_children: function(a) {
        if (!a) a = [];
        var C = this.children;
        var H = this.hidden_children;
        if (C) for (var i = 0; i < C.length; i++) {
            if (H[i]) continue;
            a.push(C[i]);
            C[i].visible_children(a);
        }
        return a;
    },

    hidden: function() {
        var state = this.options.display_state;
        return Widget.prototype.hidden.call(this) || state === "hiding" || state === "hide";
    },

    redraw: function() {
        var O = this.options;
        var I = this.invalid;
        var E = this.element;

        Widget.prototype.redraw.call(this);

        if (I.display_state) {
            I.display_state = false;
            var time;
            remove_class(E, "toolkit-hiding", "toolkit-hide", "toolkit-showing", "toolkit-show");

            if (this.__hide_id) {
                window.clearTimeout(this.__hide_id);
                this.__hide_id = false;
            }

            switch (O.display_state) {
            case "hiding":
                add_class(E, "toolkit-hiding");
                time = O.hiding_duration || get_duration(E);
                if (time > 0) {
                    this.__hide_id = window.setTimeout(this.__after_hiding, time);
                    break;
                }
                this.set("display_state", "hide");
                remove_class(E, "toolkit-hiding");
                /* FALL THROUGH */
            case "hide":
                add_class(E, "toolkit-hide");
                disable_draw_self.call(this);
                break;
            case "showing":
                add_class(E, "toolkit-showing");
                time = O.showing_duration || get_duration(E);
                if (time > 0) {
                    this.__hide_id = window.setTimeout(this.__after_showing, time);
                    enable_draw_children.call(this);
                    break;
                }
                this.set("display_state", "show");
                remove_class(E, "toolkit-showing");
                /* FALL THROUGH */
            case "show":
                add_class(E, "toolkit-show");
                enable_draw_children.call(this);
                break;
            }
        }

        if (I.content) {
            I.content = false;
            empty(E);

            if (O.content) set_content(E, O.content);
        }
    },
});
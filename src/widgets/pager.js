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
 
 /**
 * The <code>useraction</code> event is emitted when a widget gets modified by user interaction.
 * The event is emitted for the option <code>show</code>.
 *
 * @event Pager#useraction
 * 
 * @param {string} name - The name of the option which was changed due to the users action
 * @param {mixed} value - The new value of the option
 */
import { define_class, ChildElement } from '../widget_helpers.js';
import { ChildWidget } from '../child_widget.js';
import { add_class, remove_class, is_dom_node } from '../utils/dom.js';
import { warn } from '../utils/log.js';
import { Container } from './container.js';
import { ButtonArray } from './buttonarray.js';
 
export const Pager = define_class({
    /**
     * Pager, also known as Notebook in other UI toolkits, provides
     * multiple containers for displaying contents which are switchable
     * via a {@link ButtonArray}.
     * 
     * @class Pager
     * 
     * @param {Object} [options={ }] - An object containing initial options.
     * 
     * @property {String} [options.position="top"] - The position of the ButtonArray
     * @property {Array<Object>} [options.pages=[]] -
     *   An array of mappings (objects) containing the members `label` and `content`.
     *   `label` is a string used as the buttons label or an object containing options for
     *   a {@link Button}. `content` is the content of the page, which can be
     *   either an instance of {@link Container} (or derivate),
     *   a DOMNode or a string which gets wrapped in a new {@link Container}.
     * @property {Integer} [options.show=-1] - The page to show.
     *
     * @extends Container
     * 
     * @example
     * var pager = new Pager({
     *  pages: [
     *   {
     *     label: "Empty Page 1",
     *     content: document.createElement("span")
     *   },
     *   {
     *     label: { label:"Foobar", class:"foobar" },
     *     content: "<h1>Foobar</h1><p>Lorem ipsum dolor sit amet</p>"
     *   }
     *  ]
     * });
     */
    _class: "Pager",
    Extends: Container,
    _options: Object.assign(Object.create(Container.prototype._options), {
        position:  "string",
        direction: "string",
        pages:     "array",
        show:      "int",
        resized: "boolean",
    }),
    options: {
        position:  "top",
        direction: "forward",
        pages:     [],
        show:      -1,
        resized: false,
    },
    static_events: {
        set_show: function(value) {
            var page = this.current();

            if (page) {
                page.set("active", true);
                this.show_child(page);
                /**
                 * The page to show has changed.
                 * 
                 * @param {Container} page - The {@link Container} instance of the newly selected page.
                 * @param {number} id - The ID of the page.
                 * 
                 * @event Pager#changed
                 */
                this.fire_event("changed", page, value);
            }
        },
        set_pages: function(value) {
            for (var i = 0; i < this.pages.length; i++)
                this.pages[i].destroy();
            this.pages = [];
            this.add_pages(value);
        },
        set_position: function(value) {
            var badir;
            if (value === "top" || value === "bottom") {
                badir = "horizontal";
            } else {
                badir = "vertical";
            }
            this.buttonarray.set("direction", badir);
        },
    },
    
    initialize: function (options) {
        this.pages = [];
        Container.prototype.initialize.call(this, options);
        /**
         * The main DIV element. Has the class <code>toolkit-pager</code>.
         *
         * @member Pager#element
         */
        add_class(this.element, "toolkit-pager");
    },
    
    initialized: function () {
        Container.prototype.initialized.call(this);
        this.add_pages(this.options.pages);
        this.set("position", this.options.position);
        this.set("show", this.options.show);
    },
    
    redraw: function () {
        Container.prototype.redraw.call(this);
        var O = this.options;
        var I = this.invalid;
        var E = this.element;

        if (I.direction) {
            I.direction = false;
            remove_class(E, "toolkit-forward", "toolkit-backward");
            add_class(E, "toolkit-" + O.direction);
        }
        
        if (I.position) {
            I.position = false;
            remove_class(E, "toolkit-top", "toolkit-right", "toolkit-bottom",
                            "toolkit-left", "toolkit-vertical", "toolkit-horizontal");
            switch (O.position) {
                case "top":
                    add_class(E, "toolkit-top", "toolkit-vertical");
                    break;
                case "bottom":
                    add_class(E, "toolkit-bottom", "toolkit-vertical");
                    break;
                case "left":
                    add_class(E, "toolkit-left", "toolkit-horizontal");
                    break;
                case "right":
                    add_class(E, "toolkit-right", "toolkit-horizontal");
                    break;
                default:
                    warn("Unsupported position", O.position);
            }
            I.layout = true;
        }
        
        if (I.show) {
            I.show = false;
            for (var i = 0; i < this.pages.length; i ++) {
                var page = this.pages[i];
                if (i === O.show)
                    page.add_class("toolkit-active");
                else
                    page.remove_class("toolkit-active");
            }
        }
    },
    
    /**
     * Adds an array of pages.
     *
     * @method Pager#add_pages
     * 
     * @param {Array<Object>} options - An Array of objects with members
     *   `label` and `content`. `label` is a string with the {@link Button}s label or
     *   an object containing options for the {@link Button} instance.
     *   `content` is either a {@link Container} (or derivate) widget,
     *   a DOMNode (needs option `options` to be set) or a string which
     *   gets wrapped in a new {@link Container} with options from
     *   argument `options`.
     * 
     * @example
     * var p = new Pager();
     * p.add_pages([
     *   {
     *     label: "Page 1",
     *     content: "<h1>Page1</h1>",
     *   }
     * ]);
     * 
     */
    add_pages: function (options) {
        for (var i = 0; i < options.length; i++)
            this.add_page(options[i].label, options[i].content);
    },
    
    /**
     * Adds a {@link Container} to the pager and a corresponding {@link Button}
     *   to the pagers {@link ButtonArray}.
     *
     * @method Pager#add_page
     *
     * @param {string|Object} button - A string with the {@link Button}s label or
     *   an object containing options for the {@link Button} instance.
     * @param {Widget|Class|string} content - The content of the page.
     *   Either a {@link Container} (or derivate) widget,
     *   a DOMNode (needs option `options` to be set) or a string which
     *   gets wrapped in a new {@link Container} with options from
     *   argument `options`.
     * @param {Object} [options={ }] - An object containing options for
     *   the {@link Container} to be added as page if `content` is
     *   either a string or a DOMNode.
     * @param {integer|undefined} position - The position to add the new
     *   page to. If undefined, the page is added at the end.
     * @emits Pager#added
     */
    add_page: function (button, content, position, options) {
        var p;
        if (typeof button === "string")
            button = {label: button};
        this.buttonarray.add_button(button, position);

        if (typeof content === "string" || is_dom_node(content)) {
            if (!options) options = {}; 
            options.content = content;
            p = new Container(options);
        } else if (typeof content === "function") {
            // assume here content is a subclass of Container
            p = new content(options);
        } else {
            p = content;
        }

        p.add_class("toolkit-page");
        p.set("container", this._clip);

        var len = this.pages.length;

        if (position >= 0 && position < len - 1) {
            this.pages.splice(position, 0, p);
            this._clip.insertBefore(p.element, this._clip.childNodes[position]);
        } else {
            position = len;
            this.pages.push(p);
            this._clip.appendChild(p.element);
        }
        /**
         * A page was added to the Pager.
         *
         * @event Pager#added
         * 
         * @param {Container} page - The {@link Container} which was added as a page.
         */
        this.fire_event("added", p);

        this.add_child(p);

        // TODO: not always necessary
        if (this.current() === p) {
            this.options.show = position;
            this.buttonarray.set("show", position);
            p.set("active", true);
            p.set("display_state", "show");
        } else {
            /* do not use animation */
            p.force_hide();
            this.hide_child(p);
        }
        this.invalid.layout = true;
        this.trigger_draw();
        return p;
    },

    /**
     * Removes a page from the Pager.
     * 
     * @method Pager#remove_page
     * 
     * @param {integer|Container} page - The container to remove. Either a
     *   position or the {@link Container} widget generated by <code>add_page</code>.
     * 
     * @emits Pager#removed
     */
    remove_page: function (page) {
        if (typeof page === "object")
            page = this.pages.indexOf(page);
        if (page < 0 || page >= this.pages.length)
            return;
        this.buttonarray.remove_button(page);
        if (page < this.options.show)
            this.set("show", this.options.show-1);
        else if (page === this.options.show)
            this.set("show", this.options.show);
        var p = this.pages[page];
        this.pages.splice(page, 1);
        p.destroy();
        this.remove_child(p);
        this.invalid.layout = true;
        this.trigger_draw();
        /**
         * A page was removed from the Pager
         *
         * @event Pager#removed
         * 
         * @param {Container} page - The {@link Container} which was removed.
         */
        this.fire_event("removed", p);
    },

    current: function() {
        /**
         * Returns the currently displayed page or null.
         * 
         * @method Pager#current
         */
        var n = this.options.show;
        if (n >= 0 && n < this.pages.length) {
            return this.pages[n];
        }
        return null;
    },

    /**
     * Opens the first page of the pager. Returns <code>true</code> if a
     * first page exists, <code>false</code> otherwise.
     *
     * @method Pager#first
     */
    first: function() {
        if (this.pages.length) {
            this.set("show", 0);
            return true;
        }
        return false;
    },
    /**
     * Opens the last page of the pager. Returns <code>true</code> if a
     * last page exists, <code>false</code> otherwise.
     *
     * @method Pager#last
     */
    last: function() {
        if (this.pages.length) {
            this.set("show", this.pages.length-1);
            return true;
        }
        return false;
    },

    /**
     * Opens the next page of the pager. Returns <code>true</code> if a
     * next page exists, <code>false</code> otherwise.
     *
     * @method Pager#next
     */
    next: function() {
        var c = this.options.show;
        return this.set("show", c+1) !== c;
    },
    /**
     * Opens the previous page of the pager. Returns <code>true</code> if a
     * previous page exists, <code>false</code> otherwise.
     *
     * @method Pager#prev
     */
    prev: function() {
        var c = this.options.show;
        return this.set("show", c-1) !== c;
    },

    set: function (key, value) {
        var page;
        if (key === "show") {
            if (value < 0) value = 0;
            else if (value >= this.pages.length) value = this.pages.length - 1;

            if (value === this.options.show) return value;
            if (value > this.options.show) {
                this.set("direction", "forward");
            } else {
                this.set("direction", "backward");
            }
            page = this.current();
            if (page) {
                this.hide_child(page);
                page.set("active", false);
            }

            this.buttonarray.set("show", value);
        }
        return Container.prototype.set.call(this, key, value);
    },
    get: function (key) {
        if (key === "pages") return this.pages;
        return Container.prototype.get.call(this, key);
    }
});

/**
 * The {@link ButtonArray} instance acting as the menu.
 *
 * @member Pager#buttonarray
 */
ChildWidget(Pager, "buttonarray", {
    create: ButtonArray,
    show: true,
    map_options: {
        show: "show",
    },
    static_events: {
        userset: function(key, value) {
            this.parent.userset(key, value);
            return false;
        }
    },
});

/**
 * @member {HTMLDivElement} Pager#_clip - The clipping area containing the pages.
 *   Has class <code>toolkit-clip</code>.
 */
ChildElement(Pager, "clip", {
    show: true,
});

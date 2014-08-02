 /* toolkit. provides different widgets, implements and modules for 
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
 
Clock = $class({
    // Clock shows a customized clock with circulars displaying hours, minutes
    // and seconds. It has three free formatable labels.
    _class: "Clock",
    Extends: Widget,
    options: {
        thickness:    10,         // thickness of the rings
        margin:       0,          // margin between the circulars
        size:         200,        // diameter of the whole clock
        time:         new Date(), // the date object to show
        show_seconds: true,       // show the seconds ring
        show_minutes: true,       // show the minutes ring
        show_hours:   true,       // show the hours ring
        timeout:      0,          // set a timeout to update the clock with the
                                  // system clock regulary
        timeadd:      0,          // set additional milliseconds for the
                                  // timeout target
                                  // system clock regulary
        offset:       0,          // if a timeout is set offset the system time
                                  // in milliseconds
        fps:          25,         // framerate for calculatind SMTP frames
        months:       ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        days:         ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        label: function (_date, year, month, date, day, hour, minute, second, millisecond, frame, months, days) {
            // return ...  does not work, wtf?
            var s =  
                ((hour < 10) ? ("0" + hour) : hour) + ":" +
                ((minute < 10) ? ("0" + minute) : minute) + ":" +
                ((second < 10) ? ("0" + second) : second);
            return s;
        },
        label_upper: function (_date, year, month, date, day, hour, minute, second, millisecond, frame, months, days) {
            return days[day];
        },
        label_lower: function (_date, year, month, date, day, hour, minute, second, millisecond, frame, months, days) {
            return ((date < 10) ? ("0" + date) : date) + ". " + months[month] + " " + year;
        },
        label_scale: 0.33           // the scale of the upper and lower labels
                                   // compared to the main label
    },
    initialize: function (options) {
        this.circulars = {};
        this._margin = -1;
        Widget.prototype.initialize.call(this, options);
        this.element = this.widgetize(makeSVG("svg", {"class": "toolkit-clock"}),
                                      true, true, true);
        
        this.set("container", this.options.container);
        
        this._label       = makeSVG("text", {
            "class":       "toolkit-label",
            "text-anchor": "middle",
            "style":       "dominant-baseline: central;"
        });
        this._label_upper = makeSVG("text", {
            "class": "toolkit-label-upper",
            "text-anchor": "middle",
            "style":       "dominant-baseline: central;"
        });
        this._label_lower = makeSVG("text", {
            "class": "toolkit-label-lower",
            "text-anchor": "middle",
            "style":       "dominant-baseline: central;"
        });
        this.element.appendChild(this._label);
        this.element.appendChild(this._label_upper);
        this.element.appendChild(this._label_lower);
        
        var options = {
            container: this.element,
            show_hand: false,
            start: 270,
            basis: 360,
            min: 0
        }
        this.circulars.seconds = new Circular($mixin({}, options,
            {max: 60, "class": "toolkit-seconds"}));
        this.circulars.minutes = new Circular($mixin({}, options,
            {max: 60, "class": "toolkit-minutes"}));
        this.circulars.hours   = new Circular($mixin({}, options,
            {max: 12, "class": "toolkit-hours"}));
        
        this.set("timeout", this.options.timeout);
        this.set("size", this.options.size, true);
        
        Widget.prototype.initialize.call(this, options);

        this.redraw();
        this.initialized();
    },
    
    redraw: function () {
        var margin = 0;
        for (var i in this.circulars) {
            var circ = this.circulars[i];
            if (this.options["show_" + i]) {
                circ.set("thickness", this.options.thickness);
                circ.set("show_base", true);
                circ.set("show_value", true);
                circ.set("size", this.options.size);
                circ.set("margin", margin);
                margin += this.options.thickness;
                margin += circ._get_stroke();
                margin += this.options.margin;
            } else {
                circ.set("show_base", false);
                circ.set("show_value", false);
            }
        }
        if(this._margin < 0) {
            this._margin = margin;
            this._set_labels();
        } else {
            this._margin = margin;
        }
        this._set_labels();
        Widget.prototype.redraw.call(this);
    },
    
    destroy: function () {
        this._label.destroy();
        this._label_upper.destroy();
        this._label_lower.destroy();
        this.element.destroy();
        this.circulars.seconds.destroy();
        this.circulars.minutes.destroy();
        this.circulars.hours.destroy();
        Widget.prototype.destroy.call(this);
    },
    _draw_time: function (force) {
        var tmp, drawn;
        var t = this.options.time;

        if ((tmp = t.getSeconds()) != this.__sec || force) {
            this.circulars.seconds.set("value", tmp);
            this.__sec = tmp;
        }
        if ((tmp = t.getMinutes()) != this.__min || force) {
            this.circulars.minutes.set("value", tmp);
            this.__min = tmp;
        }
        if ((tmp = t.getHours() % 12) != this.__hour || force) {
            this.circulars.hours.set("value", tmp);
            this.__hour = tmp;
        }
        
        var args = [t,
                    t.getFullYear(),
                    t.getMonth(),
                    t.getDate(),
                    t.getDay(),
                    t.getHours(),
                    t.getMinutes(),
                    t.getSeconds(),
                    t.getMilliseconds(),
                    Math.round(t.getMilliseconds() / (1000 / this.options.fps)),
                    this.options.months,
                    this.options.days];
        if ((tmp = this.options.label.apply(this, args)) != this.__label || force) {
            toolkit.set_text(this._label, tmp);
            this.__label = tmp;
            drawn = true;
        }
        if ((tmp = this.options.label_upper.apply(this, args)) != this.__upper || force) {
            toolkit.set_text(this._label_upper, tmp);
            this.__upper = tmp;
            drawn = true;
        }
        if ((tmp = this.options.label_lower.apply(this, args)) != this.__lower || force) {
            toolkit.set_text(this._label_lower, tmp);
            this.__lower = tmp;
            drawn = true;
        }
        
        if (drawn)
            this.fire_event("timedrawn", [this, this.options.time]);
    },
    _set_labels: function () {
        var s = this.options.label(new Date(2000, 8, 30, 24, 59, 59, 999), 2000, 8,
                                                   30, 6, 24, 59, 59, 999, 999,
                                                   this.options.months, this.options.days);
        if (this._label.firstChild) {
            this._label.firstChild.nodeValue = s;
        } else this._label.appendChild(document.createTextNode(s));
        
        this._label.set("transform", "");
        
        var bb = this._label.getBoundingClientRect();
        var mleft   = this._label.getStyle("margin-left").toInt() || 0;
        var mright  = this._label.getStyle("margin-right").toInt() || 0;
        var mtop    = this._label.getStyle("margin-top").toInt() || 0;
        var mbottom = this._label.getStyle("margin-bottom").toInt() || 0;
        var space   = this.options.size - mleft - mright - this._margin * 2;
        var scale   = space / bb.width;
        var pos     = this.options.size / 2;
        
        this._label.set("transform", "translate(" + pos + "," + pos + ") "
            + "scale(" + scale + ")");
        
        var bb = this._label.getBoundingClientRect();
        
        this._label_upper.set("transform", "translate(" + pos + "," + (pos - bb.height / 2 - mtop) + ") "
            + "scale(" + (scale * this.options.label_scale) + ")");
        this._label_lower.set("transform", "translate(" + pos + "," + (pos + bb.height / 2 + mtop) + ") "
            + "scale(" + (scale * this.options.label_scale) + ")");
        this._draw_time(true);
    },
    
    _timeout : function () {
        if (this.__to)
            window.clearTimeout(this.__to);
        if (this.options.timeout) {
            if (this.options.offset)
                this.set("time", new Date(+(new Date()) + this.options.offset));
            else
                this.set("time", new Date());
                
            var targ;
            if (this.options.timeadd) {
                var now = (new Date().getTime() + this.options.offset) % 1000;
                targ = this.options.timeout + this.options.timeadd - now;
            } else {
                targ = this.options.timeout
            }
            this.__to = window.setTimeout(this._timeout.bind(this), targ);
        }
    },
    
    // GETTERS & SETTERS
    set: function (key, value, hold) {
        this.options[key] = value;
        switch (key) {
            case "thickness":
            case "margin":
            case "show_hours":
            case "show_minutes":
            case "show_seconds":
                if (!hold) this.redraw();
                break;
            case "size":
                this.element.set("width", value);
                this.element.set("height", value);
                if (!hold) this.redraw();
                break;
            case "time":
                if (!hold) this._draw_time();
                break;
            case "timeout":
                this._timeout();
                break;
            case "label":
            case "label_lower":
            case "label_upper":
            case "label_scale":
                this._set_labels();
                break;
        }
        Widget.prototype.set.call(this, key, value, hold);
    }
});

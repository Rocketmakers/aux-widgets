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

Tooltip = $class({
    // Tooltip adds a tooltip list to a widget. Tooltip lists follow the
    // mouse pointer throughout the document and auto-show and auto-hide
    // automatically.
    _class: "Tooltip",
    _tooltip: false,
    tooltip: function (cont, tt) {
        if (!this._tooltip) {
            // build tooltip container
            this._tooltip = toolkit.element("ul", "toolkit-tooltip");
            this.__tt_pos_cb = this._pos_tooltip.bind(this);
            document.addEventListener("mousemove", this.__tt_pos_cb);
            document.addEventListener("touchmove", this.__tt_pos_cb);
            document.body.appendChild(this._tooltip);
            this.__tt_injected = true;
            this.__tt_count = 0;
            this.fire_event("tooltipshow", [this]);
        }
        if(!cont && tt) {
            // destroy a tooltip
            this.fire_event("tooltipremoved", [tt, this]);
            tt.destroy();
            tt = false;
            this.__tt_count --;
            if (this.__tt_count <= 0) {
                document.removeEventListener("mousemove", this.__tt_pos_cb);
                document.removeEventListener("touchmove", this.__tt_pos_cb);
                this._tooltip.destroy();
                this._tooltip = false;
                this.__tt_injected = false;
                this.fire_event("tooltiphide", [tt, this]);
            }
            return;
        } else if (!tt) {
            // add a tooltip
            var tt = document.createElement("li");
            this.fire_event("tooltipadded", [tt, cont, this]);
            this.__tt_count ++;
        }
        
        // fill tooltip
        if(typeof cont == "string")
            tt.set("html", cont);
        else if(typeof cont == "object")
            tt.appendChild(tt);
            
        this._tooltip.appendChild(tt);
        
        this.__tt_count = Math.max(0, this.__tt_count);
        this.fire_event("tooltipset", [tt, this]);
        return tt;
    },
    _pos_tooltip: function (e) {
        if (!this.__tt_injected)
            return;
        e = this._get_event(e);
        toolkit.setStyles(this._tooltip, {
            top: e.clientY,
            left: e.clientX
        });
        keep_inside(this._tooltip);
    },
    _get_event: function (event) {
        // return the right event if touch surface is used
        // with multiple fingers
        return (event.touches && event.touches.length)
              ? event.touches[0] : event;
    }
});

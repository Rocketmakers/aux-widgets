/*
 * This file is part of AUX.
 *
 * AUX is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * AUX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */

import { defineClass } from './../widget_helpers.js';
import { Module } from './module.js';
import { addEventListener, removeEventListener } from '../utils/events.js';

/* this has no global symbol */
function CaptureState(start) {
  this.start = start;
  this.prev = start;
  this.current = start;
}
CaptureState.prototype = {
  /* distance from start */
  distance: function () {
    var v = this.vDistance();
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  },
  setCurrent: function (ev) {
    this.prev = this.current;
    this.current = ev;
    return true;
  },
  vDistance: function () {
    var start = this.start;
    var current = this.current;
    return [current.clientX - start.clientX, current.clientY - start.clientY];
  },
  prevDistance: function () {
    var prev = this.prev;
    var current = this.current;
    return [current.clientX - prev.clientX, current.clientY - prev.clientY];
  },
};
/* general api */
function startCapture(state) {
  /* do nothing, let other handlers be called */
  if (this.drag_state) return;

  var v = this.emit('startcapture', state, state.start);

  if (v === true) {
    /* we capture this event */
    this.drag_state = state;
    this.set('state', true);
  }

  return v;
}
function moveCapture(ev) {
  var d = this.drag_state;

  if (!d.setCurrent(ev) || this.emit('movecapture', d) === false) {
    stopCapture.call(this, ev);
    return false;
  }
}
function stopCapture(ev) {
  var s = this.drag_state;
  if (s === null) return;

  this.emit('stopcapture', s, ev);
  this.set('state', false);
  s.destroy();
  this.drag_state = null;
}

/* mouse handling */
function MouseCaptureState(start) {
  this.__mouseup = null;
  this.__mousemove = null;
  CaptureState.call(this, start);
}
MouseCaptureState.prototype = Object.assign(
  Object.create(CaptureState.prototype),
  {
    setCurrent: function (ev) {
      /* If the buttons have changed, we assume that the capture has ended */
      if (!this.isDraggedBy(ev)) return false;
      return CaptureState.prototype.setCurrent.call(this, ev);
    },
    init: function (widget) {
      this.__mouseup = mouseUp.bind(widget);
      this.__mousemove = mouseMove.bind(widget);
      document.addEventListener('mousemove', this.__mousemove);
      document.addEventListener('mouseup', this.__mouseup);
    },
    destroy: function () {
      document.removeEventListener('mousemove', this.__mousemove);
      document.removeEventListener('mouseup', this.__mouseup);
      this.__mouseup = null;
      this.__mousemove = null;
    },
    isDraggedBy: function (ev) {
      var start = this.start;
      if (start.buttons !== ev.buttons || start.which !== ev.which)
        return false;
      return true;
    },
  }
);
function mouseDown(ev) {
  var s = new MouseCaptureState(ev);
  var v = startCapture.call(this, s);

  /* ignore this event */
  if (v === void 0) return;

  ev.stopPropagation();
  ev.preventDefault();

  /* we did capture */
  if (v === true) s.init(this);

  return false;
}
function mouseMove(ev) {
  moveCapture.call(this, ev);
}
function mouseUp(ev) {
  stopCapture.call(this, ev);
}

/* touch handling */

/*
 * Old Safari versions will keep the same Touch objects for the full lifetime
 * and simply update the coordinates, etc. This is a bug, which we work around by
 * cloning the information we need.
 */
function cloneTouch(t) {
  return {
    clientX: t.clientX,
    clientY: t.clientY,
    identifier: t.identifier,
  };
}

function TouchCaptureState(start) {
  CaptureState.call(this, start);
  var touch = start.changedTouches.item(0);
  touch = cloneTouch(touch);
  this.stouch = touch;
  this.ptouch = touch;
  this.ctouch = touch;
}
TouchCaptureState.prototype = Object.assign(
  Object.create(CaptureState.prototype),
  {
    findTouch: function (ev) {
      var id = this.stouch.identifier;
      var touches = ev.changedTouches;
      var touch;

      for (var i = 0; i < touches.length; i++) {
        touch = touches.item(i);
        if (touch.identifier === id) return touch;
      }

      return null;
    },
    setCurrent: function (ev) {
      var touch = cloneTouch(this.findTouch(ev));
      this.ptouch = this.ctouch;
      this.ctouch = touch;
      return CaptureState.prototype.setCurrent.call(this, ev);
    },
    vDistance: function () {
      var start = this.stouch;
      var current = this.ctouch;
      return [current.clientX - start.clientX, current.clientY - start.clientY];
    },
    prevDistance: function () {
      var prev = this.ptouch;
      var current = this.ctouch;
      return [current.clientX - prev.clientX, current.clientY - prev.clientY];
    },
    destroy: function () {},
    isDraggedBy: function (ev) {
      return this.findTouch(ev) !== null;
    },
  }
);
function touchStart(ev) {
  /* if cancelable is false, this is an async touchstart, which happens
   * during scrolling */
  if (!ev.cancelable) return;

  /* the startcapture event handler has return false. we do not handle this
   * pointer */
  var v = startCapture.call(this, new TouchCaptureState(ev));

  if (v === void 0) return;

  ev.preventDefault();
  ev.stopPropagation();
  return false;
}
function touchMove(ev) {
  if (!this.drag_state) return;
  /* we are scrolling, ignore the event */
  if (!ev.cancelable) return;
  /* if we cannot find the right touch, some other touchpoint
   * triggered this event and we do not care about that */
  if (!this.drag_state.findTouch(ev)) return;
  /* if movecapture returns false, the capture has ended */
  if (moveCapture.call(this, ev) !== false) {
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }
}
function touchEnd(ev) {
  var s;
  if (!ev.cancelable) return;
  s = this.drag_state;
  /* either we are not dragging or it is another touch point */
  if (!s || !s.findTouch(ev)) return;
  stopCapture.call(this, ev);
  ev.stopPropagation();
  ev.preventDefault();
  return false;
}
function touchCancel(ev) {
  return touchEnd.call(this, ev);
}
var dummy = function () {};

function getParents(element) {
  var ret = [];
  if (Array.isArray(element))
    element.map(function (e) {
      e = e.parentNode;
      if (e) ret.push(e);
    });
  else if ((element = element.parentNode)) ret.push(element);
  return ret;
}

var static_events = {
  set_node: function (value) {
    this.delegateEvents(value);
  },
  contextmenu: function () {
    return false;
  },
  delegated: [
    function (element, old_element) {
      /* cancel the current capture */
      if (old_element) stopCapture.call(this);
    },
    function (elem, old) {
      /* NOTE: this works around a bug in chrome (#673102) */
      if (old) removeEventListener(getParents(old), 'touchstart', dummy);
      if (elem) addEventListener(getParents(elem), 'touchstart', dummy);
    },
  ],
  touchstart: touchStart,
  touchmove: touchMove,
  touchend: touchEnd,
  touchcancel: touchCancel,
  mousedown: mouseDown,
};

export const DragCapture = defineClass({
  /**
   * DragCapture is a low-level class for tracking drag interaction using both
   *   touch and mouse events. It can be used for implementing drag'n'drop
   *   functionality as well as value dragging e.g. {@link Fader} or
   *   {@link Knob}. {@link DragValue} derives from DragCapture.
   *
   *   Each drag interaction started by the user begins with the
   *   `startcapture` event. If an event handler returns `true`, the dragging
   *   is started. Otherwise mouse or touch events which belong to the same
   *   drag interaction are ignored.
   *
   *   While the drag interaction is running, the `movecapture` is fired for
   *   each underlying move event. Once the drag interaction completes, the
   *   `stopcapture` event is fired.
   *
   *   While the drag interaction is running, the `state()` method returns a
   *   CaptureState object. This object has methods for calculating current
   *   position, distance from the start position etc.
   *
   *
   * @extends Module
   *
   * @param {Object} widget - The parent widget making use of DragValue.
   * @param {Object} [options={ }] - An object containing initial options.
   *
   * @property {HTMLElement} [options.node] - The DOM element receiving the drag events. If not set the widgets element is used.
   *
   * @class DragCapture
   */
  /**
   * Capturing started.
   *
   * @event DragCapture#startcapture
   *
   * @param {object} state - An internal state object.
   * @param {DOMEvent} start - The event object of the initial event.
   */

  /**
   * A movement was captured.
   *
   * @event DragCapture#movecapture
   *
   * @param {DOMEvent} event - The event object of the current move event.
   */

  /**
   * Capturing stopped.
   *
   * @event DragCapture#stopcapture
   *
   * @param {object} state - An internal state object.
   * @param {DOMEvent} event - The event object of the current event.
   */
  Extends: Module,
  _options: {
    node: 'object',
    state: 'boolean' /* internal, undocumented */,
  },
  options: {
    state: false,
  },
  static_events: static_events,
  initialize: function (widget, O) {
    Module.prototype.initialize.call(this, widget, O);
    this.drag_state = null;
    if (O.node === void 0) O.node = widget.element;
    this.set('node', O.node);
  },
  destroy: function () {
    Module.prototype.destroy.call(this);
    stopCapture.call(this);
  },
  cancelDrag: stopCapture,
  dragging: function () {
    return this.options.state;
  },
  state: function () {
    return this.drag_state;
  },
  isDraggedBy: function (ev) {
    return this.drag_state !== null && this.drag_state.isDraggedBy(ev);
  },
});

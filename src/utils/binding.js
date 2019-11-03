/* jshint -W078 */

/**
 * This module contains function for creating Widget option bindings.
 *
 * @module utils/binding
 */


import { warn } from './log.js';
import { Timer } from './timers.js';

function call_all(a)
{
  for (let i = 0; i < a.length; i++)
  {
    try
    {
      a[i]();
    }
    catch (err)
    {
      warn('Unsubscribe generated an exception: %o', err);
    }
  }
}

/**
 * This function subscribes to those changes to option `name`
 * which are initiated by user action. Returns a function
 * which can be called to unsubsribe.
 *
 * @example
 *      const unsubcribe = observe_useraction(fader, 'value', (value) => {
 *        console.log('Fader value changed to %o', value);  
 *      });
 *
 *      setTimeout(unsubscribe, 1000);
 */
export function observe_useraction(widget, name, callback)
{
  if (!widget.get_option_type(name) && !name.startsWith('_'))
    throw new Error('No such options: '+name);

  return widget.subscribe('useraction', (key, value) => {
    if (key == name) callback(value);
  });
}

/**
 * This function subscribes to changes to option `name`.
 * Returns a function which can be called to unsubsribe.
 *
 * @example
 *      const unsubcribe = observe_useraction(fader, 'value', (value) => {
 *        console.log('Fader value is %o now.', value);  
 *      });
 *
 *      setTimeout(unsubscribe, 1000);
 */
export function observe_option(widget, name, callback)
{
  if (!widget.get_option_type(name) && !name.startsWith('_'))
    throw new Error('No such options: '+name);

  callback(widget.get(name));

  return widget.subscribe('set_' + name, (value) => {
    callback(value);
  });
}

export function intercept_option(widget, name, callback)
{
  if (!widget.get_option_type(name) && !name.startsWith('_'))
    throw new Error('No such options: '+name);

  return widget.subscribe('userset', (_name, value) => {
    if (_name !== name) return;
    callback(value);
    return false;
  });
}

/**
 * Class used to create two-way bindings which debounces the transmission of
 * backend values to a widget option.
 * If the widget supports the generic 'interacting' option, it can be used
 * to block incoming values while the user is interacting with the widget.
 * Alternatively, incoming values are delayed until a certain time after
 * the last value modification was generated by a user.
 */
export class DebounceBinding
{
  /**
   * @param {Object} widget - The Widget.
   * @param {String} name - The option name.
   * @param {Number} time - Number of milliseconds to delay values passed to
   *    {@link set} after the last 'useraction' event for the option name.
   * @param {Boolean} [use_interacting=true] - If true, use the interacting
   *    option of the widget to delay incoming values while a user is
   *    interacting with the widget.
   */
  constructor(widget, name, time, use_interacting)
  {
    this.widget = widget;
    this.name = name;
    this.time = time;
    this._timer = new Timer(() => {
      this.unlock();
    });
    this._subscriptions = [ () => this._timer.stop() ];
    this._last_value = null;
    this._has_value = false;
    this._locked = 0;

    if (widget.get_option_type('interacting'))
    {
      let interacting = false;
      this._subscriptions.push(observe_option(widget, 'interacting', (value) => {
        if (value === interacting) return;
        interacting = value;
        if (value)
        {
          this.lock();
        }
        else
        {
          this.unlock();
        }
      }));
    }
    else if (!time)
    {
      warn("%o does not have an 'interacting' option. Setting debounce time to 0 makes no sense here.",
           widget);
    }

    if (time)
    {
      this._subscriptions.push(observe_useraction(widget, name, () => {
        if (!this._timer.active)
          this.lock();

        this._timer.restart(time);
      }));
    }
  }

  lock()
  {
    this._locked++;
  }

  /**
   * Returns true if values are currently being debounced.
   */
  isLocked()
  {
    return this._locked > 0;
  }

  unlock()
  {
    if (--this._locked) return;

    if (!this._has_value) return;

    this.widget.set(this.name, this._last_value);
  }

  /**
   * Receive a value from the backend. Unless the value is delayed by timer or
   * by the user interaction, this method calls
   *    `this.widget.set(this.name, value)'.
   */
  set(value)
  {
    this._last_value = value;
    this._has_value = true;

    if (this._locked) return;

    this.widget.set(this.name, value);
  }

  /**
   * Remove all event subscriptions. If the last value received by the backend
   * has been delayed, it will not be passed to the widget.
   */
  destroy()
  {
    call_all(this._subscriptions);
    this._subscriptions = [];
  }
}
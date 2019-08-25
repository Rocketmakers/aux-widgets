import { warn, error } from './utils/log.js';
import { FORMAT } from './utils/sprintf.js';
import { html } from './utils/dom.js';
import { is_native_event } from './implements/base.js';

// TODO:
// * the refcount logic is not correct since it ignores the fact
//   that addEventListener and friends can
//    - be called more than once without effect
//    - can be called with different values of capture
//   this is a proof of concept at the moment

function low_parse_attribute(type, x) {
  switch (type) {
  case "js":
    return new Function([], "return ("+x+");").call(this);
  case "json":
    return JSON.parse(x);
  case "html":
    return html(x);
  case "string":
    return x;
  case "number":
    return parseFloat(x);
  case "int":
    return parseInt(x);
  case "sprintf":
    return FORMAT(x);
  case "regexp":
    return new RegExp(x);
  case "bool":
  case "boolean":
    x = x.trim();
    if (x === "true") {
      return true;
    } else if (x === "false") {
      return false;
    }
    throw new Error("Malformed 'bool': ", x);
  case "array":
    try {
      return low_parse_attribute('json', x);
    } catch (err) {}
    return low_parse_attribute('js', x);
  default:
    throw new Error("unsupported type " + type);
  }
}

function parse_attribute(type, value)
{
  {
    const pos = value.indexOf(':');

    if (pos !== -1)
    {
      try
      {
        return low_parse_attribute(value.substr(0, pos), value.substr(pos+1));
      }
      catch (err) { }
    }

    const types = type.split('|');

    if (types.length > 1)
    {
      for (let i = 0; i < types.length; i++)
      {
        try
        {
          return low_parse_attribute(types[i], value);
        }
        catch (e)
        {
          warn(e);
        }
      }

      throw new Error('Could not find any matching format in ' + type);
    }
  }

  return low_parse_attribute(type, value);
}

function attributes_from_widget(Widget)
{
  const attributes = [];
  const skip = ["class", "id", "container", "element"];

  for (var i in Widget.prototype._options)
  {
    if (skip.indexOf(i) === -1)
      attributes.push(i);
  }

  return attributes;
}

class ComponentBase extends HTMLElement
{
  constructor(widget)
  {
    super();
    this.tk_events_handlers = new Map();
    this.tk_events_paused = false;
    this.tk_initializing = false;
    this.widget = null;
  }

  tk_initialize()
  {
  }

  tk_try_initialize()
  {
    if (this.widget !== null) return true;

    if (this.tk_initializing) return false;
    this.tk_initializing = true;
    this.tk_initialize();
    this.tk_initializing = false;
    return true;
  }

  connectedCallback()
  {
    this.tk_try_initialize();
  }

  attributeChangedCallback(name, oldValue, newValue)
  {
    if (!this.tk_try_initialize()) return;

    this.tk_events_paused = true;
    try {
      const widget = this.widget;
      const type = widget._options[name];
      const value = parse_attribute(type, newValue);
      widget.set(name, value);
    } catch (e) {
      warn('Setting attribute generated an error:', e);
    }
    this.tk_events_paused = false;
  }

  addEventListener(type, ...args)
  {
    if (!is_native_event(type) && this.tk_try_initialize())
    {
      const handlers = this.tk_events_handlers;

      if (!handlers.has(type))
      {
        const cb = (...args) => {
          if (this.tk_events_paused) return;
          this.dispatchEvent(new CustomEvent(type, { detail: { args: args } }));
        };

        handlers.set(type, cb);
        this.widget.add_event(type, cb);
      }
    }

    super.addEventListener(type, ...args);
  }
}

export function component_from_widget(Widget)
{
  const attributes = attributes_from_widget(Widget);

  return class extends ComponentBase
  {
    static get observedAttributes()
    {
      return attributes;
    }

    tk_initialize()
    {
      this.widget = new Widget({
        element: this,
      });
    }

    connectedCallback()
    {
      super.connectedCallback();
      this.widget.enable_draw();
    }

    disconnectedCallback()
    {
      this.widget.disable_draw();
    }
  }
}

export function subcomponent_from_widget(Widget, ParentWidget, append_cb, remove_cb)
{
  const attributes = attributes_from_widget(Widget);

  if (!append_cb) append_cb = (parent, child) => {
    parent.add_child(child);
  };

  if (!remove_cb) remove_cb = (parent, child) => {
    parent.remove_child(child);
  };

  return class extends ComponentBase
  {
    static get observedAttributes()
    {
      return attributes;
    }

    tk_initialize()
    {
      this.widget = new Widget();
      this.setAttribute('hidden', '');
    }

    constructor()
    {
      super();
      this.parent = null;
    }

    connectedCallback()
    {
      super.connectedCallback();

      const parent = this.parentNode.widget;

      if (parent instanceof ParentWidget)
      {
        this.parent = parent;
        append_cb(parent, this.widget);
      }
      else
      {
        error('Missing parent widget.');
      }
    }

    disconnectedCallback()
    {
      const parent = this.parent;

      if (parent)
      {
        remove_cb(parent, this.widget);
        this.parent = null;
      }
    }
  }
}
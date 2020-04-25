import { Events } from '../../events.js';
import { init_subscribers, add_subscriber, remove_subscriber, call_subscribers } from '../../utils/subscribers.js';
import { init_subscriptions, add_subscription, unsubscribe_subscriptions } from '../../utils/subscriptions.js';
import { SubscriberMap } from '../../utils/subscriber_map.js';

import { GroupData } from './group.js';

function allowAll(node, callback)
{
  callback(true);
  return init_subscriptions();
}

function call_continuation_if(node, subscribe_predicate, continuation)
{
  let active = false;
  let inner_subscription = init_subscriptions();

  let subscription = subscribe_predicate(node, (value) => {
    // nothing todo
    if (active === value) return;

    active = value;


    if (value)
    {
      inner_subscription = continuation(node);
    }
    else
    {
      inner_subscription = unsubscribe_subscriptions(inner_subscription);
    }
  });

  return () => {
    subscription = unsubscribe_subscriptions(subscription);
    inner_subscription = unsubscribe_subscriptions(inner_subscription);
  };
}

class SuperGroup
{
  constructor(group, parent, index)
  {
    this.group = group;
    this.parent = parent;
    this.depth = parent ? (parent.depth + 1) : -1;
    this.size = 0;
    this.index = index !== void(0) ? index : -1;
    this.children = [];
  }

  createChildNode(child)
  {
    if (child instanceof GroupData)
    {
      return new SuperGroup(child, this);
    }
    else
    {
      return child;
    }
  }

  childDistance(index)
  {
    let offset = 1;

    const list = this.children;

    for (let i = 0; i < index; i++)
    {
      const child = list[i];

      offset ++;

      if (child instanceof SuperGroup)
      {
        offset += child.size;
      }
    }

    return offset;
  }

  updateSize(diff)
  {
    this.size += diff;

    const parent = this.parent;

    if (parent !== null)
    {
      parent.updateSize(diff);
    }
  }

  forEach(cb)
  {
    this.children.forEach((node) => {
      if (node instanceof SuperGroup)
      {
        cb(node.group, this);
        node.forEach(cb);
      }
      else
      {
        cb(node, this);
      }
    });
  }
}

function get_child(node)
{
  if (node instanceof SuperGroup)
  {
    return node.group;
  }
  else
  {
    return node;
  }
}


export class ListDataView extends Events
{
  // PRIVATE APIs
  _offsetFromParent(group, index)
  {
    return this.getSuperGroup(group).childDistance(index);
  }

  _updateSize(parent, diff)
  {
    parent.updateSize(diff);
    this.emit('sizeChanged', this.root.size);
  }

  _updateIndex(startIndex)
  {
    const list = this.list;

    for (let i = startIndex; i < list.length; i++)
    {
      const child = list[i];

      if (!(child instanceof GroupData)) continue;

      const super_group = this.groups.get(child);

      super_group.index = i;
    }
  }

  _childAdded(parent, node, index)
  {
    let sub = init_subscriptions();
    const child = get_child(node);

    // increase size by one
    this._updateSize(parent, 1);

    const offset = parent.childDistance(index);
    const list = this.list;

    const list_index = parent.index + offset;

    list.splice(list_index, 0, child);

    if (node instanceof SuperGroup)
    {
      node.index = list_index;
      this.groups.set(child, node);
    }

    this._updateIndex(list_index + 1);

    if (list_index < this.startIndex)
    {
      this.startIndex++;
      this.emit('startIndexChanged', this.startIndex);
    }

    if (node instanceof SuperGroup)
    {
      sub = add_subscription(sub, this._subscribe(node));
    }

    this._notifyRegion(list_index);

    return sub;
  }

  _childRemoved(parent, node, index)
  {
    const child = get_child(node);
    // NOTE: the subtree is always empty now, since
    // it is automatically removed before
    const size = (node instanceof SuperGroup)
      ? (1 + node.size)
      : 1;

    // decrease size
    this._updateSize(parent, -size);

    const offset = parent.childDistance(index);
    const list = this.list;

    const list_index = parent.index + offset;

    if (list[list_index] !== child)
    {
      /*
      console.log('list: %o', list.map((n) => n.label));
      console.log('index %d : %o vs. %o',
                  list_index, list[list_index].label,
                  child.label);
      */
      throw new Error('Removing wrong child.');
    }

    list.splice(list_index, size);
    this._updateIndex(list_index);

    const startIndex = this.startIndex;

    if (list_index < startIndex)
    {
      this.startIndex -= size;
      this.emit('startIndexChanged', this.startIndex, startIndex);
    }
    else if (this.size < startIndex + this.amount && startIndex > 0)
    {
      this.startIndex = Math.max(0, startIndex - size);
      this.emit('startIndexChanged', this.startIndex, startIndex);
      this._notifyRegion(this.startIndex, this.startIndex + size);
    }
    else
    {
      this._notifyRegion(list_index);
    }
  }

  _subscribe(super_group)
  {
    const list = super_group.children;
    const group = super_group.group;

    const sub = group.forEachAsync((node) => {
      return this._filter(node, (node) => {
        let sub = init_subscriptions();

        node = super_group.createChildNode(node);

        list.push(node);
        // TODO: needs to be dynamic
        list.sort(this.sortFunction);

        sub = add_subscription(sub, this._childAdded(super_group, node, list.indexOf(node)));

        sub = add_subscription(sub, () => {
          if (node === null) return;

          const index = list.indexOf(node);

          list.splice(index, 1);

          this._childRemoved(super_group, node, index);

          node = null;
        });

        return sub;
      });
    });

    return sub;
  }

  _notifyRegion(start, end)
  {
    const startIndex = this.startIndex;
    const endIndex = startIndex + this.amount;

    if (end === void(0)) end = endIndex;

    if (end <= startIndex) return;
    if (start >= endIndex) return;

    const from = Math.max(start, startIndex);
    const to = Math.min(end, endIndex);
    const list = this.list;
    const subscribers = this.subscribers;

    for (let i = from; i < to; i++)
    {
      const element = list[i];

      call_subscribers(subscribers, i, element);
    }
  }

  _filterCollapsed(node, continuation)
  {
    return call_continuation_if(node, (node, callback) => {
      return this.subscribeCollapsed(node.parent, (is_collapsed) => callback(!is_collapsed));
    }, continuation);
  }

  _filter(node, continuation)
  {
    return this._filterCollapsed(node, (node) => {
      return call_continuation_if(node, this.filterFunction, continuation);
    });
  }

  // PUBLIC APIs
  constructor(group, amount, filterFunction, sortFunction)
  {
      super();
      this.root = new SuperGroup(group, null);
      this.startIndex = 0;
      this.amount = amount;
      this.filterFunction = filterFunction || allowAll;
      this.sortFunction = sortFunction;
      this.subscribers = init_subscribers();


      // global flat list
      this.list = [];

      // set of collapsed groups
      this.collapsed = new WeakSet();

      // list of subscribers for an element being collapsed
      this.collapsedSubscribers = new SubscriberMap();

      // index in the flat list where each group
      this.groups = new Map([[ group, this.root ]]);

      // subscribers
      this.subscriptions = this._subscribe(this.root);
  }

  get size()
  {
    return this.root.size;
  }

  getSuperGroup(group)
  {
    if (!(group instanceof GroupData))
    {
      throw new TypeError('Expected GroupData instance as argument.');
    }

    const super_group = this.groups.get(group);

    if (!super_group)
    {
      throw new Error('No group info available for this group.');
    }

    return super_group;
  }

  getDepth(child)
  {
    const info = this.getSuperGroup(child.parent);

    return info.depth + 1;
  }

  getSubtreeSize(group)
  {
    const info = this.getSuperGroup(group);

    return info.size;
  }

  setStartIndex(index)
  {
    this.startIndex = index;
    this._notifyRegion(index, index + this.amount);
  }

  scrollStartIndex(offset)
  {
    this.startIndex += offset;

    if (offset > 0)
    {
      const end = this.startIndex + this.amount;
      this._notifyRegion(end - offset, end);
    }
    else if (offset < 0)
    {
      const start = this.startIndex;
      this._notifyRegion(start, start - offset);
    }
  }

  collapseGroup(group, is_collapsed)
  {
    if (typeof is_collapsed !== 'boolean')
      throw new TypeError('Expected boolean.');

    if (!(group instanceof GroupData))
      throw new TypeError('Expected GroupData.');

    const collapsed = this.collapsed;

    if (is_collapsed)
    {
      collapsed.add(group);
    }
    else
    {
      collapsed.delete(group);
    }


    this.collapsedSubscribers.call(group, is_collapsed);
  }

  isCollapsed(group)
  {
    if (!(group instanceof GroupData))
      throw new TypeError('Expected GroupData.');

    return this.collapsed.has(group);
  }

  destroy()
  {
    this.subscriptions = unsubscribe_subscriptions(this.subscriptions);
  }

  check()
  {
    this.forEach((child) => {
      if (child instanceof GroupData)
      {
        const index = this.getSuperGroup(child).index;

        if (this.list[index] !== child)
        {
          console.error('Found group at position %d. Found %o vs. %o.\n',
                      index, child.label, this.list[index].label);
          throw new Error('Group is not at right position.');
        }
      }
      else if (child instanceof SuperGroup)
      {
        throw new TypeError('Discovered unexpected node SuperGroup.');
      }
      else
      {
        const super_group = this.getSuperGroup(child.parent);
        const index = super_group.children.indexOf(child);
        const distance = super_group.childDistance(index);

        if (this.list[super_group.index + distance] !== child)
        {
          console.error('Found group at position %d. Found %o vs. %o.\n',
                      index, child.label, this.list[index].label);
        }
      }
    });
  }

  forEach(cb)
  {
    const rec = (super_group) => {
      super_group.children.forEach((node) => {
        cb(get_child(node));
        if (node instanceof SuperGroup)
          rec(node);
      });
    };

    rec(this.root);
  }

  subscribeElements(cb)
  {
    if (typeof(cb) !== 'function')
      throw new TypeError('Expected function.');

    this.subscribers = add_subscriber(this.subscribers, cb);

    const from = this.startIndex;
    const to = from + this.amount;
    const list = this.list;

    for (let i = from; i < to; i++)
    {
      const element = list[i];

      call_subscribers(cb, i, element);
    }

    return () => {
      if (cb === null) return;
      this.subscribers = remove_subscriber(this.subscribers, cb);
      cb = null;
    };
  }

  /**
   * Emits the size of the list.
   */
  subscribeSize(cb)
  {
    call_subscribers(cb, this.root.size);

    return this.subscribe('sizeChanged', cb);
  }

  /**
   * Triggers when the startIndex changed but the view remained the same. This
   * may happen when data is being removed which is entirely _before_ the
   * current view.
   */
  subscribeStartIndexChanged(cb)
  {
    return this.subscribe('startIndexChanged', cb);
  }

  subscribeCollapsed(group, cb)
  {
    cb(this.collapsed.has(group));

    return this.collapsedSubscribers.subscribe(group, cb);
  }

  at(index)
  {
    return this.list[index];
  }
}

// ../src/tsx/tsx-core.ts
var consoleLog = console.log;
var consoleError = console.error;
var displayContents = {
  style: "display:contents;"
};
var displayNone = {
  style: "display:none;"
};
var divTag = "div";
function instanceOfHTMLElement(something) {
  return something instanceof HTMLElement;
}
function instanceOfSVGSVGElement(something) {
  return something instanceof SVGSVGElement;
}
function instanceOfMathMLElement(something) {
  return something instanceof MathMLElement;
}
function instanceOfInternalComponent(something) {
  return something instanceof InternalComponent;
}
function instanceOfRenderObject(something) {
  return something instanceof RenderObject;
}
function instanceOfComponent(something) {
  return something instanceof Component;
}
function instanceOfText(something) {
  return something instanceof Text;
}
function instanceOfBasicTypes(something) {
  if (typeof something === "string" || typeof something === "bigint" || typeof something === "number" || typeof something === "boolean") {
    return true;
  }
  return false;
}
function hasSetterInPrototypeChain(object, fieldName) {
  let currentObject = object;
  while (currentObject) {
    const descriptor = Object.getOwnPropertyDescriptor(currentObject, fieldName);
    if (descriptor && (descriptor.set || descriptor.writable)) {
      return true;
    }
    currentObject = Object.getPrototypeOf(currentObject);
  }
  return false;
}
function setAttributeHelper(element, name, value) {
  if (hasSetterInPrototypeChain(element, name)) {
    ;
    element[name] = value;
  } else {
    element.setAttribute(name, value.toString());
  }
}
function setBooleanAttributeHelper(element, name, value) {
  if (hasSetterInPrototypeChain(element, name)) {
    ;
    element[name] = value;
  } else {
    if (name.startsWith("aria-") || name.startsWith("data-")) {
      element.setAttribute(name, String(value));
    } else {
      if (value) {
        element.setAttribute(name, "");
      }
    }
  }
}
function getAttributeHelper(element, qualifiedName) {
  return element.getAttribute(qualifiedName);
}
function defineLockedProperty(object, key, value) {
  Object.defineProperty(object, key, {
    value,
    writable: false,
    configurable: false,
    enumerable: false
  });
}
function lowerCamelToHypenCase(text) {
  return text.replace(/[A-Z]/g, function(char) {
    return "-" + char.toLowerCase();
  });
}
var domReferences = /* @__PURE__ */ new Map();
var domNextKey = 1n;
var domKeyName = "vk";
var listenersF = /* @__PURE__ */ new Map();
var listenersR = /* @__PURE__ */ new Map();
function getDOMreference(key) {
  return domReferences.get(key);
}
function registerNewVtKey(component, element) {
  const componentKey = String(domNextKey);
  domNextKey++;
  if (element) {
    setAttributeHelper(element, domKeyName, componentKey);
  }
  domReferences.set(componentKey, component);
  return componentKey;
}
function releaseVtKey(vtKey) {
  domReferences.delete(vtKey);
}
function releaseVtKeyObject(hasVtKey) {
  domReferences.delete(hasVtKey.vtKey);
}
function childToElement(child) {
  if (instanceOfBasicTypes(child) || instanceOfText(child)) {
    return createElement("span", null, child);
  } else if (child) {
    return renderableElementToElement(child);
  }
}
function childToNode(child) {
  if (instanceOfBasicTypes(child)) {
    return document.createTextNode(child.toString());
  } else if (instanceOfText(child)) {
    return child;
  } else if (child) {
    return renderableElementToElement(child);
  }
}
function renderableElementToElement(child) {
  if (instanceOfHTMLElement(child) || instanceOfSVGSVGElement(child) || instanceOfMathMLElement(child)) {
    return child;
  } else if (instanceOfRenderObject(child)) {
    return child.renderDefault();
  } else if (instanceOfComponent(child)) {
    const component = getDOMreference(child.vtKey);
    if (component) {
      if (instanceOfInternalComponent(component)) {
        return component.e;
      }
    }
  }
  consoleError("Internal typescript error");
  return hiddenElement();
}
function appendChild(parent, child) {
  if (Array.isArray(child)) {
    for (let i = 0; i < child.length; i++) {
      appendChild(parent, child[i]);
    }
  } else {
    const element = childToNode(child);
    if (element) {
      parent.appendChild(element);
    }
  }
}
function hiddenElement() {
  return createElement(divTag, displayNone);
}
function vtSetImmediate(callback) {
  Promise.resolve().then(callback);
}
function wrapElementIfNeeded(element) {
  if (!element) {
    return hiddenElement();
  }
  if (instanceOfComponent(element) || instanceOfRenderObject(element) || element.hasAttribute(domKeyName)) {
    return createElement(divTag, displayContents, element);
  }
  return element;
}
var UpdateHandlerLink = class {
  /** Reference to the rendered object */
  result;
  /** Stashed references to make selected updates more performant */
  updateRefs;
  /** Create a new UpdateHandlerLink */
  constructor(result, updateRefs) {
    this.result = result;
    this.updateRefs = updateRefs;
  }
};
var RenderObject = class {
  #data;
  #defaultRenderFunction;
  #defaultHandleUpdate;
  #elements = /* @__PURE__ */ new Map();
  /** This RenderObject's vtKey */
  vtKey = registerNewVtKey(this);
  #hasEventListeners = false;
  #onMounts = [];
  #onUnmounts = [];
  #eventDispatchDelay = 0;
  #eventDispatched = false;
  #eventListeningKey() {
    return `vt-ro-${this.vtKey}`;
  }
  #emitOnChangeEvent() {
    emitEvent(this.#eventListeningKey(), new VelotypeEvent(this, "onChange"));
  }
  /**
     * Create a new RenderObject
     * 
     * @param initialData the initial data to use to render this RenderObject with
     * @param renderFunction a function that renders a data value into an AnchorElement
     * @param handleUpdate advanced functionality used to highly optimize rendering on value updates
     */
  constructor(initialData, defaultRenderFunction, defaultHandleUpdate) {
    this.#data = initialData;
    this.#defaultRenderFunction = defaultRenderFunction || hiddenElement;
    this.#defaultHandleUpdate = defaultHandleUpdate;
  }
  /**
     * Register an EventListener to receive an onChange event when the value of this RenderObject changes.
     * 
     * @param component the Component this RenderObject is created within or a child of the owning Component (has undefined behavior if registered to a non-child of the owning Component)
     * @param listener the EventListener to register
     * @param triggerOnRegistration should an onChange event be emitted immediately upon registration? (default: false)
     * @param eventDispatchDelay to delay (in ms) onChange event dispatch, will dispatch at most one change event per eventDispatchDelay (default: 0)
     * @returns this
     */
  registerOnChangeListener(component, listener, triggerOnRegistration, eventDispatchDelay) {
    this.#hasEventListeners = true;
    this.#eventDispatchDelay = eventDispatchDelay && eventDispatchDelay > 0 ? eventDispatchDelay : 0;
    registerEventListener(component, this.#eventListeningKey(), listener);
    if (triggerOnRegistration) {
      vtSetImmediate(() => {
        this.#emitOnChangeEvent();
      });
    }
    return this;
  }
  /**
     * Register a mount/unmount pair to be triggered when the Component that this RenderObject is created within gets mounted / unmounted
     * 
     * @param onMount callback to be triggered when the Component that this RenderObject is created within gets mounted
     * @param onUnmount callback to be triggered when the Component that this RenderObject is created within gets unmounted
     * @returns this
     */
  registerOnMount(onMount, onUnmount) {
    if (onMount) {
      this.#onMounts.push(onMount);
    }
    if (onUnmount) {
      this.#onUnmounts.push(onUnmount);
    }
    return this;
  }
  /**
     * Velotype internal function
     * 
     * DO NOT CALL directly (will be called by Velotype core)
     * 
     * Used to trigger set of registered onMounts
     */
  mount() {
    this.#onMounts.forEach((onMount) => {
      onMount();
    });
  }
  /**
     * Velotype internal function
     * 
     * DO NOT CALL directly (will be called by Velotype core)
     * 
     * Used to trigger set of registered onUnmounts and then trigger `this.removeAll()`
     */
  unmount() {
    this.#onUnmounts.forEach((onUnmount) => {
      onUnmount();
    });
  }
  /** Get the current value of this RenderObject */
  get value() {
    return this.#data;
  }
  /**
     * Set the current value of this RenderObject
     * 
     * Will trigger a rerender if (this.value != newData)
     */
  set value(newData) {
    this.set(newData);
  }
  /** Get the current value of this RenderObject */
  get() {
    return this.#data;
  }
  /**
     * Set the current value of this RenderObject
     * 
     * Will trigger rerenderElements if (this.value != newData)
     */
  set(newData) {
    if (this.#data != newData) {
      this.rerenderElements(newData);
    }
  }
  /**
     * Force a rerender of existing elements and set value to newData
     * 
     * This method may need to be used in cases where this.value is a complex object
     * or other data structure that is manipulated in-place rather than reassigned.
     */
  rerenderElements(newData) {
    Array.from(this.#elements.entries()).forEach(([key, element]) => {
      if (element.hU && element.uR) {
        element.hU(element.e, element.uR, this.#data, newData);
      } else {
        const render = element.rF(newData, this);
        if (render instanceof UpdateHandlerLink) {
          const newElement = wrapElementIfNeeded(childToElement(render.result));
          setAttributeHelper(newElement, domKeyName, key);
          replaceElement(element.e, newElement);
          this.#elements.set(key, {
            e: newElement,
            rF: element.rF,
            hU: element.hU,
            uR: render.updateRefs
          });
        } else {
          const newElement = wrapElementIfNeeded(childToElement(render));
          setAttributeHelper(newElement, domKeyName, key);
          replaceElement(element.e, newElement);
          this.#elements.set(key, {
            e: newElement,
            rF: element.rF,
            hU: element.hU
          });
        }
      }
    });
    this.#data = newData;
    if (this.#hasEventListeners) {
      if (this.#eventDispatchDelay > 0) {
        if (!this.#eventDispatched) {
          this.#eventDispatched = true;
          setTimeout(() => {
            this.#eventDispatched = false;
            this.#emitOnChangeEvent();
          }, this.#eventDispatchDelay);
        }
      } else {
        this.#emitOnChangeEvent();
      }
    }
  }
  /**
     * Velotype internal function
     * 
     * DO NOT CALL directly (will be called by Velotype core)
     * 
     * Used to unmount an instance element of this RenderObject
     */
  unmountKey(key) {
    const element = this.#elements.get(key);
    if (element) {
      const componentKey = getAttributeHelper(element.e, domKeyName);
      if (key == componentKey) {
        this.#elements.delete(componentKey);
        releaseVtKey(componentKey || "");
        return true;
      } else {
        consoleError("Invalid state", key, componentKey, element);
        return false;
      }
    } else {
      consoleError("Invalid unmountKey", key);
      return false;
    }
  }
  /**
     * Used to generate new instance elements of this RenderObject using the
     * default renderFunction and default handleUpdate function
     * 
     * No need to call directly (will be called by Velotype core when needed)
     */
  renderDefault() {
    return this.render(this.#defaultRenderFunction, this.#defaultHandleUpdate);
  }
  /**
     * Trigger rendering of this RenderObject and bind the created element to
     * the passed renderFunction and handleUpdate function
     */
  render(renderFunction, handleUpdate) {
    const render = renderFunction(this.#data, this);
    const newElement = wrapElementIfNeeded(childToElement(render instanceof UpdateHandlerLink ? render.result : render));
    const componentKey = registerNewVtKey(this, newElement);
    this.#elements.set(componentKey, {
      e: newElement,
      rF: renderFunction,
      hU: handleUpdate,
      uR: render instanceof UpdateHandlerLink ? render.updateRefs : render
    });
    return newElement;
  }
  /**
     * Get the rendered elements of this RenderObject
     * 
     * THIS IS ADVANCED FUNCTIONALITY - use carefully
     */
  getElements() {
    return Array.from(this.#elements.values()).map((e) => e.e);
  }
  /**
     * Removes all instance elements that this RenderObject has generated
     */
  removeAll() {
    this.#elements.entries().forEach(([key, element]) => {
      removeElement(element.e);
      releaseVtKey(key);
    });
    this.#elements.clear();
  }
};
var RenderBasic = class extends RenderObject {
  /** Create a new BasicComponent */
  constructor(initialData) {
    super(initialData, function(data) {
      return createElement("span", displayContents, data.toString());
    });
  }
  /**
     * Register an EventListener to receive an onChange event when the value of
     * this RenderBasic changes.
     * 
     * @param component the Component this RenderBasic is created within or a child of the owning Component (has undefined behavior if registered to a non-child of the owning Component)
     * @param listener the EventListener to register
     * @param triggerOnRegistration should an onChange event be emitted immediately upon registration? (default: false)
     * @param eventDispatchDelay to delay (in ms) onChange event dispatch, will dispatch at most one change event per eventDispatchDelay (default: 0)
     * @returns this
     */
  registerOnChangeListener(component, listener, triggerOnRegistration) {
    super.registerOnChangeListener(component, listener, triggerOnRegistration);
    return this;
  }
  /**
     * Register a mount/unmount pair to be triggered when the Component that this RenderBasic is created within gets mounted / unmounted
     * 
     * @param onMount callback to be triggered when the Component that this RenderBasic is created within gets mounted
     * @param onUnmount callback to be triggered when the Component that this RenderBasic is created within gets unmounted
     * @returns this
     */
  registerOnMount(onMount, onUnmount) {
    super.registerOnMount(onMount, onUnmount);
    return this;
  }
  /**
     * Get the value of this BasicComponent as a String
     */
  getString() {
    return String(super.get());
  }
  /**
     * Set the value of this BasicComponent from a String
     */
  setString(newDataString) {
    const data = super.get();
    if (typeof data === "string") {
      this.set(newDataString);
    } else if (typeof data === "bigint") {
      this.set(BigInt(newDataString));
    } else if (typeof data === "number") {
      this.set(Number(newDataString));
    } else if (typeof data === "boolean") {
      this.set(Boolean(newDataString));
    }
  }
};
var Component = class {
  /** The attributes this Component was created with */
  attrs;
  /** The children this Component was created with */
  children;
  /** constructor gets attrs and children */
  constructor(attrs, children) {
    this.attrs = attrs;
    this.children = children;
  }
  /**
     * Mount is called just after this Component is attached to the DOM.
     * 
     * May be overriden by a specific Component that extends Component
     */
  mount() {
  }
  /**
     * Unmount is called just before this Component is removed from the DOM.
     * 
     * May be overriden by a specific Component that extends Component
     */
  unmount() {
  }
  /**
     * Trigger re-rendering of this Component and all child Components.
     * This will unmount and delete all child Components, then call
     * this.render() and consequently new and mount a fresh set of child Components.
     * 
     * This is set by Velotype Core on Component construction and is not overridable
     */
  refresh() {
  }
  /**
     * A unique key per instance of each Component.
     * 
     * This is read-only and set by Velotype Core on Component construction and is not overridable
     */
  vtKey = "";
  /**
     * Replace a Child element with a newly constructed element
     * 
     * This is set by Velotype Core on Component construction and is not overridable
     * 
     * @param child a child element of this Component
     * @param newChild the element to replace with
     * @returns newElement when replacement is successful, otherwise returns child
     */
  replaceChild(child, newChild) {
    return child;
  }
  /**
     * Append a newly constructed element to a child element
     * 
     * This is set by Velotype Core on Component construction and is not overridable
     * 
     * @param child a child element of this Component
     * @param toAppendChild the element to append
     * @returns boolean for if replacement was accepted (will reject if the input child element is not a child of this Component)
     */
  appendToChild(child, toAppendChild) {
    return false;
  }
  /**
     * Prepend a newly constructed element to a child element
     * 
     * This is set by Velotype Core on Component construction and is not overridable
     * 
     * @param child a child element of this Component
     * @param toPrependChild the element to prepend
     * @returns boolean for if replacement was accepted (will reject if the input child element is not a child of this Component)
     */
  prependToChild(child, toPrependChild) {
    return false;
  }
  /**
     * Replace the children of a child element
     * 
     * This is set by Velotype Core on Component construction and is not overridable
     * 
     * @param child a child element of this Component
     * @param toPrependElement the element to prepend
     * @returns boolean for if replacement was accepted (will reject if the input child element is not a child of this Component)
     */
  replaceChildrenOfChild(child, newChildren) {
    return false;
  }
  /**
     * Remove a child element
     * 
     * This is set by Velotype Core on Component construction and is not overridable
     * 
     * @param child a child element of this Component
     * @returns boolean for if removal was accepted (will reject if the input child element is not a child of this Component)
     */
  removeChild(child) {
    return false;
  }
};
function replaceElement(element, newElement) {
  const isFocused = document.hasFocus() ? document.activeElement == element : false;
  if (instanceOfHTMLElement(element)) {
    unmountComponentElementChildren(element);
  }
  element.replaceWith(newElement);
  if (instanceOfHTMLElement(newElement)) {
    mountComponentElementChildren(newElement);
  }
  if (isFocused) {
    newElement.focus();
  }
  return newElement;
}
function appendElement(element, toAppendElement) {
  element.appendChild(toAppendElement);
  mountComponentElement(toAppendElement);
}
function prependElement(element, toPrependElement) {
  element.prepend(toPrependElement);
  mountComponentElement(toPrependElement);
}
function replaceChildren(element, newChildren) {
  unmountComponentElementChildren(element);
  element.replaceChildren(...newChildren);
  mountComponentElementChildren(element);
}
function removeElement(element) {
  unmountComponentElement(element);
  element.remove();
}
var InternalComponent = class {
  constructor(component, attrs, children) {
    this.c = component;
    this.a = attrs;
    this.h = children;
    this.k = registerNewVtKey(this);
    defineLockedProperty(component, "vtKey", this.k);
    defineLockedProperty(component, "refresh", this.f);
    defineLockedProperty(component, "replaceChild", this.q);
    defineLockedProperty(component, "appendToChild", this.w);
    defineLockedProperty(component, "prependToChild", this.t);
    defineLockedProperty(component, "replaceChildrenOfChild", this.y);
    defineLockedProperty(component, "removeChild", this.u);
    this.e = componentRender(this, this.a, this.h);
  }
  /**
     * Stashes the Velotype Component defined by the user
     */
  c;
  /**
     * Stashes a reference to the root AnchorElement of this Component.
     */
  e;
  /**
     * Stashes the Component vtKey for this Component
     */
  k;
  /**
     * Stashes the attrs for this Component
     */
  a;
  /**
     * Stashes the children for this Component
     */
  h;
  /**
     * Trigger unmount for this Component's children, then re-render
     * this Component and then mount new children.
     */
  f = () => {
    this.e = replaceElement(this.e, componentRender(this, this.a, this.h));
  };
  /**
     * Release this Component's ComponentKey
     */
  r = () => {
    releaseVtKey(this.k);
  };
  /**
     * replaceChild()
     */
  q = (child, newChild) => {
    if (this.e.contains(child)) {
      return replaceElement(child, renderableElementToElement(newChild));
    } else {
      return child;
    }
  };
  /**
     * appendToChild()
     */
  w = (child, toAppend) => {
    if (this.e.contains(child)) {
      appendElement(child, renderableElementToElement(toAppend));
      return true;
    } else {
      return false;
    }
  };
  /**
     * prependToChild()
     */
  t = (child, toPreppend) => {
    if (this.e.contains(child)) {
      prependElement(child, renderableElementToElement(toPreppend));
      return true;
    } else {
      return false;
    }
  };
  /**
     * replaceChildrenOfChild()
     */
  y = (child, newChildren) => {
    if (this.e.contains(child)) {
      replaceChildren(child, newChildren.map((c) => renderableElementToElement(c)));
      return true;
    } else {
      return false;
    }
  };
  /**
     * removeChild()
     */
  u = (child) => {
    if (this.e.contains(child)) {
      removeElement(child);
      return true;
    } else {
      return false;
    }
  };
};
function traverseElementChildren(element, callback) {
  if (instanceOfHTMLElement(element) || instanceOfSVGSVGElement(element) || instanceOfMathMLElement(element)) {
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children[i];
      traverseElementChildren(child, callback);
      const key = getAttributeHelper(child, domKeyName);
      if (key) {
        const component = getDOMreference(key);
        if (component) {
          callback(component, key);
        }
      }
    }
  }
}
function mountComponentElementHelper(component, _key) {
  if (instanceOfInternalComponent(component)) {
    const internalComponent = component;
    internalComponent.c.mount();
    Object.entries(internalComponent.c).forEach((array) => {
      const enumberableValue = array[1];
      if (instanceOfRenderObject(enumberableValue)) {
        enumberableValue.mount();
      }
    });
  }
}
function mountComponentElement(element) {
  if (instanceOfHTMLElement(element)) {
    mountComponentElementChildren(element);
  }
  const key = getAttributeHelper(element, domKeyName);
  if (key) {
    const component = getDOMreference(key);
    if (component) {
      mountComponentElementHelper(component, key);
    }
  }
}
function mountComponentElementChildren(element) {
  traverseElementChildren(element, mountComponentElementHelper);
}
function unmountComponentElementHelper(component, key) {
  if (instanceOfInternalComponent(component)) {
    removeComponentListeners(component.c);
    component.c.unmount();
    Object.entries(component.c).forEach((array) => {
      const enumberableValue = array[1];
      if (instanceOfRenderObject(enumberableValue)) {
        enumberableValue.unmount();
        releaseVtKeyObject(enumberableValue);
      } else if (instanceOfComponent(enumberableValue)) {
        releaseVtKeyObject(enumberableValue);
      }
    });
    component.r();
  } else {
    component.unmountKey(key);
  }
}
function unmountComponentElementChildren(element) {
  traverseElementChildren(element, unmountComponentElementHelper);
}
function unmountComponentElement(element) {
  if (instanceOfHTMLElement(element)) {
    unmountComponentElementChildren(element);
  }
  const key = getAttributeHelper(element, domKeyName);
  if (key) {
    const component = getDOMreference(key);
    if (component) {
      unmountComponentElementHelper(component, key);
    }
  }
}
function componentRender(classComponent, attrs, children) {
  const render = wrapElementIfNeeded(classComponent.c.render(attrs, children));
  setAttributeHelper(render, domKeyName, classComponent.k);
  return render;
}
function setAttrsOnElement(element, attrs) {
  if (!attrs) {
    return;
  }
  for (const [name, value] of Object.entries(attrs || {})) {
    if (name.startsWith("on") && name.length > 4) {
      if (value) {
        let options = void 0;
        let handler = value;
        if (typeof value !== "function" && value.handler && value.options !== void 0) {
          handler = value.handler;
          options = value.options;
        }
        const eventName = name[2] == "-" ? name.slice(3) : name.slice(2).toLowerCase();
        element.addEventListener(eventName, handler, options);
      }
    } else if (name == "style" && value instanceof Object) {
      for (const key of Object.keys(value)) {
        const keyValue = value[key] === null || value[key] === void 0 ? "" : value[key];
        const stringKeyValue = typeof keyValue == "number" ? keyValue.toString() : keyValue;
        const style = element.style;
        if (stringKeyValue.endsWith("!important")) {
          style.setProperty(lowerCamelToHypenCase(key), stringKeyValue.substring(0, stringKeyValue.length - 10), "important");
        } else {
          if (hasSetterInPrototypeChain(style, key)) {
            style[key] = stringKeyValue;
          } else {
            style.setProperty(key, stringKeyValue);
          }
        }
      }
    } else if (typeof value == "boolean") {
      setBooleanAttributeHelper(element, name, value);
    } else if (typeof value == "function") {
    } else if (value || value == "") {
      setAttributeHelper(element, name, value);
    }
  }
}
function createElement(tag, attrs, ...children) {
  const notNullAttrs = attrs || {};
  if (typeof tag === "string") {
    const element = document.createElement(tag);
    setAttrsOnElement(element, notNullAttrs);
    if (tag == "template") {
      appendChild(element.content, children);
    } else {
      appendChild(element, children);
    }
    return element;
  } else if (instanceOfComponent(tag.prototype)) {
    const internalComponent = new InternalComponent(new tag(notNullAttrs, children), notNullAttrs, children);
    return internalComponent.e;
  } else if (typeof tag === "function") {
    const output = tag(notNullAttrs, children);
    if (instanceOfBasicTypes(output)) {
      return output;
    } else if (Array.isArray(output)) {
      return output;
    } else if (instanceOfSVGSVGElement(output)) {
      return wrapElementIfNeeded(output);
    } else if (instanceOfMathMLElement(output)) {
      return wrapElementIfNeeded(output);
    } else {
      return wrapElementIfNeeded(output);
    }
  }
  consoleError("Invalid tag", tag, notNullAttrs, children);
  return hiddenElement();
}
function replaceElementWithRoot(rootComponent, element) {
  element.replaceWith(rootComponent);
  mountComponentElement(rootComponent);
  return rootComponent;
}
var VelotypeEvent = class {
  /**
     * Link to the emitting object
     */
  emittingObject;
  /**
     * A simple string representing the type of event
     */
  event;
  /**
     * Generic metadata about the event
     */
  data;
  /**
     * Create a new VelotypeEvent
     */
  constructor(emittingObject, event, data) {
    this.emittingObject = emittingObject;
    this.event = event;
    this.data = data;
  }
};
function registerEventListener(hasVtKey, listeningKey, listener) {
  registerListenerMap(listenersF, listeningKey, hasVtKey.vtKey, listener);
  registerListenerMap(listenersR, hasVtKey.vtKey, listeningKey, listener);
}
function registerListenerMap(map, firstKey, secondKey, listener) {
  const keyListeners = map.get(firstKey);
  if (keyListeners !== void 0) {
    keyListeners.set(secondKey, listener);
  } else {
    const newKeyListeners = /* @__PURE__ */ new Map();
    newKeyListeners.set(secondKey, listener);
    map.set(firstKey, newKeyListeners);
  }
}
function removeComponentListeners(hasVtKey) {
  const keyListeners = listenersR.get(hasVtKey.vtKey);
  if (keyListeners) {
    Array.from(keyListeners.keys()).forEach((listeningKey) => {
      removeListenerMap(listenersF, listeningKey, hasVtKey.vtKey);
      removeListenerMap(listenersR, hasVtKey.vtKey, listeningKey);
    });
  }
}
function removeListenerMap(map, firstKey, secondKey) {
  const keyListeners = map.get(firstKey);
  if (keyListeners !== void 0) {
    const listener = keyListeners.get(secondKey);
    if (listener !== void 0) {
      keyListeners.delete(secondKey);
      if (keyListeners.size <= 0) {
        map.delete(firstKey);
      }
    } else {
      consoleLog("WARN removing event listener, secondKey is not present", firstKey, secondKey);
    }
  } else {
    consoleLog("WARN removing event listener, firstKey is not present", firstKey, secondKey);
  }
}
function emitEvent(listeningKey, event, hasVtKey) {
  const keyListeners = listenersF.get(listeningKey);
  if (keyListeners !== void 0) {
    keyListeners.entries().forEach(([vtKey, listener]) => {
      if (!hasVtKey || hasVtKey.vtKey != vtKey) {
        listener(event);
      }
    });
  } else {
    consoleLog("WARN, event emitted with no listeners", listeningKey, event);
  }
}

// ../src/jsx-runtime/jsx-runtime.ts
function jsx(tag, attrs, key) {
  const children = attrs.children;
  delete attrs.children;
  if (key !== void 0) {
    attrs.key = key;
  }
  return createElement(tag, attrs, children);
}
var jsxs = jsx;

// test_modules/basic-div.tsx
var BasicDivTest = class extends Component {
  buttonClicked = new RenderBasic(false);
  render() {
    return /* @__PURE__ */ jsxs("div", {
      children: [
        /* @__PURE__ */ jsx("div", {
          id: "hello-div",
          children: "Hello Velotype!"
        }),
        /* @__PURE__ */ jsx("div", {
          id: "style-string",
          style: "display:flex;margin-top:4px;",
          children: "style string"
        }),
        /* @__PURE__ */ jsx("div", {
          id: "style-object",
          style: {
            display: "flex",
            marginTop: "4px"
          },
          children: "style object"
        }),
        /* @__PURE__ */ jsx("button", {
          id: "boolean-attribute-default-true",
          type: "button",
          disabled: true,
          children: "boolean attribute default true"
        }),
        /* @__PURE__ */ jsx("button", {
          id: "boolean-attribute-explicit-true",
          type: "button",
          disabled: true,
          children: "boolean attribute explicit true"
        }),
        /* @__PURE__ */ jsx("button", {
          id: "boolean-attribute-explicit-false",
          type: "button",
          disabled: false,
          children: "boolean attribute explicit false"
        }),
        /* @__PURE__ */ jsxs("button", {
          id: "button-onclick",
          type: "button",
          onClick: () => {
            this.buttonClicked.value = true;
          },
          children: [
            "clickable button has been clicked: ",
            this.buttonClicked
          ]
        })
      ]
    });
  }
};
replaceElementWithRoot(/* @__PURE__ */ jsx(BasicDivTest, {}), document.getElementById("main-page"));
//# sourceMappingURL=basic-div.js.map

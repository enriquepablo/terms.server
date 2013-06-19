/*
 * QuickUI
 * Version 0.9.4
 * Modular web control framework
 * http://quickui.org
 *
 * Copyright 2009-2013 Jan Miksovsky
 * Licensed under the MIT license.
 */

(function() {

/*
Main Control class definition and jQuery plugin.
*/

/*
QuickUI "control" jQuery extension to create and manipulate
controls via a regular jQuery instance.

Usage:

$( element ).control()
  Returns the control that was created on that element.

$( element ).control( { content: "Hello" } );
  Sets the content property of the control at this element.

$( element ).control( MyControlClass );
  Creates a new instance of MyControlClass around the element( s ).

$( element ).control( MyControlClass, { content: "Hello" } );
  Creates new control instance( s ) and sets its ( their ) content property.

NOTE: the forms that create new control instances may return a jQuery array
of elements other than the ones which were passed in. This occurs whenever
the control class wants a different root tag than the tag on the supplied
array of elements.
*/

var Control, controlClassData, initialize, replaceElements, significantContent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

jQuery.fn.control = function(arg1, arg2) {
  var $cast, controlClass, properties;

  if (arg1 === void 0) {
    $cast = (new Control(this)).cast(jQuery);
    if ($cast instanceof Control) {
      return $cast;
    } else {
      return null;
    }
  } else if (jQuery.isFunction(arg1)) {
    controlClass = arg1;
    properties = arg2;
    return controlClass.createAt(this, properties);
  } else {
    return (new Control(this)).cast().properties(arg1);
  }
};

/*
Control class: the base class for all QuickUI controls.

This is defined as a subclass of jQuery so that all control objects can also
have jQuery methods applied to them.
*/


Control = (function(_super) {
  __extends(Control, _super);

  /*
  The Control constructor has to accommodate the fact that Control subclasses
  jQuery, which happens to have a rather unusual constructor. jQuery raises two
  issues, one of which we can work around, the other we can't.
  
  First issue: The base jQuery() constructor doesn't actually return a new
  instance of the jQuery class, but instead returns a new instance of a helper
  class called jQuery.prototype.init. That is, the jQuery constructor is an
  "other typed" constructor: it returns something other than an instance of the
  class which was requested. Such constructors are not supported in CoffeeScript
  as of CoffeeScript 1.5. To work around that, we invoke jQuery's constructor,
  get back an instance of the helper class, then copy the values from that
  intermediate result to the new object we're constructing.
  
  Second issue: For conciseness, jQuery wants to support static constructors,
  that is, creation of a new jQuery object without actually needing to use the
  "new" keyword. So the following are equivalent:
  
    var $elements = $("div");
    var $elements = new $("div");
  
  The constructor does this regardless of whether it's called with "new" or not,
  so it can produce the results above. The problem is that the above technique
  is similarly prohibited by CoffeeScript. As a result, Control classes should
  always be instantiated with the formal use of "new".
  */


  function Control() {
    var args, result;

    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (this === window) {
      throw "Control constructor must be invoked with 'new'.";
    } else {
      result = jQuery.apply(null, args);
      if (result.length > 0) {
        jQuery.merge(this, result);
      }
    }
  }

  /*
  Create an instance of this control class around a specific element (or
  multiple instances around a set of elements).
  */


  Control.create = function(properties) {
    return this.createAt(null, properties);
  };

  /*
  Create instance(s) of this control class around the given target(s).
  
  If the tag associated with the given class differs from the tag on the
  target(s), a new element (or set of elements) will be created and used to
  replace the existing element(s). E.g., if one creates a button-based
  control on a div, the exiting div will get replaced with a button element.
  This will work for any existing element other than the document body,
  which will of course be left as a body element. Event handlers or CSS
  classes on the old element(s) will not be transferred to the new one(s).
  
  If properties are supplied, they will be set on the new controls.
  If the properties argument is a single string, it will be passed to
  the controls' content() property.
  */


  Control.createAt = function(target, properties) {
    var $control, $controls, defaultTarget, element, existingTag, oldContents, _i, _len, _ref;

    defaultTarget = "<" + this.prototype.tag + "/>";
    $controls = void 0;
    oldContents = void 0;
    if (target === null) {
      $controls = new this(defaultTarget);
      oldContents = [];
    } else {
      $controls = new this(target);
      oldContents = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = $controls.length; _i < _len; _i++) {
          element = $controls[_i];
          _results.push(significantContent(element));
        }
        return _results;
      })();
      existingTag = $controls[0].nodeName.toLowerCase();
      if (existingTag !== this.prototype.tag.toLowerCase() && existingTag !== "body") {
        $controls = replaceElements($controls, new this(defaultTarget));
      }
    }
    if (properties !== void 0 && !$.isPlainObject(properties)) {
      properties = {
        content: properties
      };
    }
    this.initialize();
    $controls.controlClass(this).addClass(this.prototype.classes).render().propertyVector("content", oldContents).properties(properties);
    _ref = $controls.segments();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      $control = _ref[_i];
      initialize(this, $control);
    }
    return $controls;
  };

  /*
  The CSS classes that should be applied to new instances of this class. This is
  normally not set directly, but a default value is automatically constructed
  the first time the control class is instantiated. The default value for this
  includes the names of all control classes in the class' inheritance
  hierarchy. Example: If a control class Foo has superclasses Bar and Control,
  this member will be "Foo Bar Control".
  */


  Control.prototype.classes = "Control";

  /*
  Each control class knows its own name.
  We'd prefer to use "name" for this, but this is a reserved word.
  */


  Control.prototype.className = "Control";

  /*
  Get/set the reference for the actual class for these control( s ). This may
  differ from the class of the jQuery object used to access this function:
    
    $e = new Control "<button>"   # $e is now of type Control
    e.control( BasicButton )      # Turns the element into a BasicButton 
    $e.className                  # Returns "Control"
    $e.controlClass()             # Returns the BasicButton class
  */


  Control.prototype.controlClass = function(classFn) {
    if (classFn) {
      return this.data(controlClassData, classFn);
    } else {
      return this.data(controlClassData);
    }
  };

  /*
  Control itself has no settings that need to be applied on render.
  */


  Control.prototype.inherited = null;

  /*
  Invoked when the control has finished rendering.
  Subclasses can override this to perform their own post-rendering work
  (e.g., wiring up events).
  */


  Control.prototype.initialize = function() {};

  /*
  A *class* method to force initialization of the data associated with a class.
  A class will be implicitly initialized if an attempt is made to instantiate
  it. However, if a tool wants to statically inspect a class without
  instantiating it, this method can be called to ensure the class is properly
  set up. Invoking this method more than once does no harm.
  
  The class members set up in this method are:
  .className: the name of the class
  .classes: all CSS class names applied to new instances of that control class
  */


  Control.initialize = function() {
    var superclass, _ref;

    if (!this.prototype.hasOwnProperty("className")) {
      this.prototype.className = (_ref = this.name) != null ? _ref : /function\s+([^\( ]*)/.exec(this.toString())[1];
    }
    if (!this.prototype.hasOwnProperty("classes")) {
      superclass = this.superclass();
      superclass.initialize();
      return this.prototype.classes = this.prototype.className + " " + superclass.prototype.classes;
    }
  };

  /*
  Rendering a control lets each class in the control class' hierarchy,
  starting at the *top*. Each class' "inherited" settings are passed to
  property setters on that class' superclass. That is, each class defines
  itself in the semantics of its superclass.
  */


  Control.prototype.render = function() {
    var classFn, rendered, superclass;

    classFn = this.constructor;
    if (classFn !== Control) {
      superclass = classFn.superclass();
      rendered = (new superclass(this)).render();
      if (classFn.prototype.hasOwnProperty("inherited")) {
        rendered.json(classFn.prototype.inherited, this);
      }
    }
    return this;
  };

  Control.prototype.pushStack = function(elems) {
    var ret;

    ret = jQuery.merge(new this.constructor(), elems);
    ret.prevObject = this;
    ret.context = this.context;
    return ret;
  };

  /*
  The current version of QuickUI.
  */


  Control.prototype.quickui = "0.9.4";

  /*
  Create a subclass of this class. The new class' prototype is extended with
  the indicated members in the options parameter. This method is provided for
  plain JavaScript users -- CoffeeScript users can use its "class" syntax.
  
  Normally, jQuery subclasses must be created with the $.sub() plugin. However,
  the Control constructor already works around the most common case that plugin
  handles, and the other case that plugin handles (static instantations without
  the "new" keyword) is not supported for Control.
  */


  Control.sub = function(options) {
    var subclass, superclass, _ref;

    superclass = this;
    subclass = (function(_super1) {
      __extends(subclass, _super1);

      function subclass() {
        _ref = subclass.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      return subclass;

    })(superclass);
    jQuery.extend(true, subclass, superclass);
    if (options != null) {
      subclass.prototype.extend(options);
    }
    subclass.__super__ = superclass.prototype;
    subclass.fn = subclass.prototype;
    return subclass;
  };

  Control.superclass = function() {
    return this.__super__.constructor;
  };

  /*
  By default, the root tag of the control will be a div.
  Control classes can override this: <Control name="Foo" tag="span">
  */


  Control.prototype.tag = "div";

  /*
  Replace this control with an instance of the given class and properties.
  Unlike a normal Control.create() call, existing control contents are
  *not* preserved. Event handlers, however, remain attached;
  use a separate call to $.off() to remove them if desired.
  
  If preserveClasses is true, the existing class hierarchy will be left
  on the "class" attribute, although the class "Control" will remain the
  rightmost class. Suppose the class hierarchy looks like
       class="Foo Control"
  If we're switching to class Bar, the hierarchy will end up like
       class="Bar Foo Control"
  
  TODO: This function have evolved to overlap quite a bit with $.control().
  The latter's ability to preserve element content in Control.createAt() 
  perhaps should be deprecated. Callers could rely on transmute() if they
  need to preserve existing content.
  */


  Control.prototype.transmute = function(newClass, preserveContent, preserveClasses, preserveEvents) {
    var $controls, classFn, element, oldClasses, _i, _len;

    classFn = Control.getClass(newClass);
    oldClasses = (preserveClasses ? this.prop("class") : null);
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      element = this[_i];
      removeElementFromInDocumentCallbacks(element);
    }
    if (!preserveContent) {
      this.empty();
    }
    this.removeClass();
    this.removeData();
    if (!preserveEvents) {
      this.off();
    }
    $controls = classFn.createAt(this);
    if (oldClasses) {
      $controls.removeClass("Control").addClass(oldClasses).addClass("Control");
    }
    return $controls;
  };

  return Control;

})(jQuery);

/*
Private helpers
*/


controlClassData = "_controlClass";

/*
Invoke the initialize() method of each class in the control's class hierarchy,
starting with the base class and working down.
*/


initialize = function(classFn, $control) {
  var superclass;

  superclass = classFn.superclass();
  if (superclass !== jQuery) {
    initialize(superclass, $control);
  }
  if (classFn.prototype.hasOwnProperty("initialize")) {
    return classFn.prototype.initialize.call($control);
  }
};

/*
Replace the indicated existing element(s) with the indicated replacements and
return the new elements. This is used if, say, we need to convert a bunch of
divs to buttons. Significantly, this preserves element IDs.
*/


replaceElements = function($existing, $replacement) {
  var $new, element, i, id, ids, _i, _len;

  ids = (function() {
    var _i, _len, _results;

    _results = [];
    for (_i = 0, _len = $existing.length; _i < _len; _i++) {
      element = $existing[_i];
      _results.push($(element).prop("id"));
    }
    return _results;
  })();
  $new = $replacement.replaceAll($existing);
  for (i = _i = 0, _len = $new.length; _i < _len; i = ++_i) {
    element = $new[i];
    id = ids[i];
    if (id && id.length > 0) {
      $(element).prop("id", id);
    }
  }
  return $new;
};

/*
Return an element's "significant" contents: contents which contain
at least one child that's something other than whitespace or comments.
If the element has no significant contents, return undefined.
*/


significantContent = function(element) {
  var content, node, _i, _len;

  content = new Control(element).content();
  if (typeof content === "string" && jQuery.trim(content).length > 0) {
    return content;
  }
  for (_i = 0, _len = content.length; _i < _len; _i++) {
    node = content[_i];
    if (node.nodeType !== 8) {
      if (typeof node !== "string" || jQuery.trim(node).length > 0) {
        return content;
      }
    }
  }
  return void 0;
};

if (typeof window !== "undefined" && window !== null) {
  window.Control = Control;
}

/*
This preserves jQuery's $.browser facility, which is deprecated in jQuery 1.9.
It's all too common for a control to need to work around subtle bugs in
browsers -- most often IE 8, but they all have quirks -- and these bugs are
nearly never detectable by general feature-detection systems like Modernizr.
So Control.browser supports the same properties as jQuery.browser used to.
*/

var userAgent, userAgentMatch;

userAgent = navigator.userAgent.toLowerCase();

userAgentMatch = /(chrome)[ \/]([\w.]+)/.exec(userAgent) || /(webkit)[ \/]([\w.]+)/.exec(userAgent) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(userAgent) || /(msie) ([\w.]+)/.exec(userAgent) || userAgent.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(userAgent) || [];

Control.browser = {};

if (userAgentMatch[1] != null) {
  Control.browser[userAgentMatch[1]] = true;
}

if (userAgentMatch[2] != null) {
  Control.browser.version = userAgentMatch[2];
}

if (Control.browser.chrome) {
  Control.browser.webkit = true;
} else if (Control.browser.webkit) {
  Control.browser.safari = true;
}

/*
Standardized handling of element content.
*/

var isInputElement;

Control.prototype.extend({
  /*
  Get/set the content of an HTML element.
  
  Like $.contents(), but you can also set content, not just get it.
  You can set content to a single item, an array of items, or a set
  of items listed as parameters. Setting multiple items at a time
  is an important case in rehydrating HTML controls. Input elements
  are also handled specially: their value ( val ) is their content.
  
  This function attempts to return contents in a canonical form, so
  that setting contents with common parameter types is likely to
  return those values back in the same form. If there is only one
  content element, that is returned directly, instead of returning
  an array of one element. If the element being returned is a text node,
  it is returned as a string.
  
  Usage:
   $element.content( "Hello" )              # Simple string
   $element.content( ["Hello", "world"] )   # Array
   $element.content( "Hello", "world" )     # Parameters
   Control( "<input type='text'/>" ).content( "Hi" )   # Sets text value
  
  This is used as the default implementation of a control's content
  property. Controls can override this behavior.
  */

  content: function(value) {
    var $element, array, item, result, _i, _len, _ref, _ref1;

    if (value === void 0) {
      $element = this.nth(0);
      if (isInputElement($element[0])) {
        return $element.val();
      } else {
        result = (function() {
          var _i, _len, _ref, _results;

          _ref = $element.contents();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            _results.push(item.nodeType === 3 ? item.nodeValue : item);
          }
          return _results;
        })();
        if (result.length === 1 && typeof result[0] === "string") {
          return result[0];
        } else {
          return new this.constructor(result);
        }
      }
    } else {
      array = arguments.length > 1 ? arguments : value instanceof jQuery ? value.get() : jQuery.isArray(value) ? value : [value];
      _ref = this.segments();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        $element = _ref[_i];
        if (isInputElement($element[0])) {
          $element.val(value);
        } else {
          $element.children().detach();
          (_ref1 = $element.empty()).append.apply(_ref1, array);
        }
      }
      return this;
    }
  }
});

/*
Return true if the given element is an input element with a val().
Exception: buttons are not considered input elements, because typically
when one is setting their contents, one wants to set their label, not
their "value".
*/


isInputElement = function(element) {
  var inputTags;

  inputTags = ["input", "select", "textarea"];
  return (jQuery.inArray(element.nodeName.toLowerCase(), inputTags)) >= 0;
};

/*
Let controls get notified when they are added to the document.
*/

/*
A (new) control is asking to have a callback invoked when the control
has been inserted into the document body. This is useful because
the initialize event is often invoked before the control has actually
been added to the document, and therefore doesn't have height or width,
doesn't have any externally-imposed styles applied to it, etc.

If the control is already in the document, the callback is executed
immediately.

If no callback function is supplied, this returns true if all controls
are in the document, and false if not.

inDocumentCallbacks will be invoked in reserve document order to ensure that
the callback of a child will be invoked before the callback of a parent.
This lets the parent proceed knowing that its children have already had
the chance to set themselves up.
*/

var elementInserted, elementInsertionInterval, inDocumentCallbacks, inDocumentListening, inDocumentListeningDeferred, isElementInDocument, mutationEvents, removeElementFromInDocumentCallbacks, startInDocumentListening, stopInDocumentListening;

Control.prototype.inDocument = function(callback) {
  var element, i, newCallbacks, _i, _j, _len, _len1;

  if (callback === void 0) {
    if (this.length === 0) {
      return false;
    }
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      element = this[_i];
      if (!isElementInDocument(element)) {
        return false;
      }
    }
    return true;
  } else {
    newCallbacks = [];
    for (i = _j = 0, _len1 = this.length; _j < _len1; i = ++_j) {
      element = this[i];
      if (isElementInDocument(element)) {
        callback.call(new this.constructor(element));
      } else {
        newCallbacks.push({
          element: element,
          callback: callback
        });
      }
    }
    if (newCallbacks.length > 0) {
      inDocumentCallbacks.unshift.apply(inDocumentCallbacks, newCallbacks);
      if (!inDocumentListening) {
        startInDocumentListening();
      }
    }
    return this;
  }
};

/*
An element has been added to the document; see if it's a control that's been
waiting to be notified of that event via an inDocument() callback.
*/


elementInserted = function(event) {
  var callback, callbacksReady, control, element, i, _i, _len, _results;

  callbacksReady = [];
  i = 0;
  while (i < inDocumentCallbacks.length) {
    element = inDocumentCallbacks[i].element;
    if (isElementInDocument(element)) {
      callbacksReady.push(inDocumentCallbacks[i]);
      inDocumentCallbacks.splice(i, 1);
    } else {
      i++;
    }
  }
  if (inDocumentCallbacks.length === 0) {
    stopInDocumentListening();
  }
  _results = [];
  for (_i = 0, _len = callbacksReady.length; _i < _len; _i++) {
    callback = callbacksReady[_i];
    control = (new Control(callback.element)).control();
    _results.push(callback.callback.call(control));
  }
  return _results;
};

Control._elementInserted = elementInserted;

elementInsertionInterval = null;

inDocumentCallbacks = [];

inDocumentListening = false;

inDocumentListeningDeferred = false;

/*
Return true if the document body contains the indicated element, or if
if the element *is* the document body.
*/


isElementInDocument = function(element) {
  return (typeof document !== "undefined" && document !== null ? document.body : void 0) === element || jQuery.contains(document.body, element);
};

/*
Return true if we can rely on DOM mutation events to detect DOM changes.
*/


mutationEvents = function() {
  return !Control.browser.msie || parseInt(Control.browser.version) >= 9;
};

/*
Remove the given element from the list of callbacks, effectively canceling its
inDocument behavior. If the element is not in the list, this has no effect.
*/


removeElementFromInDocumentCallbacks = function(element) {
  var i, _results;

  i = 0;
  _results = [];
  while (i < inDocumentCallbacks.length) {
    if (inDocumentCallbacks[i].element === element) {
      _results.push(inDocumentCallbacks.splice(i, 1));
    } else {
      _results.push(i++);
    }
  }
  return _results;
};

/*
Start listening for insertions of elements into the document body.

On modern browsers, we use the DOMNodeInserted mutation event (which, as of
7/2011, had better browser coverage than DOMNodeinDocument).
Mutation events are slow, but the only way to reliably detect insertions
that are created outside the document and then later added in. The events
aren't used when we can avoid it, and the event is unbound once all known
pending controls have been added.
 
IE8 doesn't support mutation events, so we have to set up our own polling
interval to check to see whether a control has been added. Again, we avoid
doing this at all costs, but this apparently is the only way we can
determine when elements have been added in IE8.
*/


startInDocumentListening = function() {
  if (mutationEvents()) {
    if (document.body) {
      jQuery("body").on("DOMNodeInserted", elementInserted);
      return inDocumentListening = true;
    } else if (!inDocumentListeningDeferred) {
      jQuery("body").ready(function() {
        elementInserted();
        if (inDocumentCallbacks.length > 0) {
          startInDocumentListening();
        }
        return inDocumentListeningDeferred = false;
      });
      return inDocumentListeningDeferred = true;
    }
  } else {
    return elementInsertionInterval = window.setInterval(function() {
      return elementInserted();
    }, 10);
  }
};

/*
Stop listening for element insertion events.
*/


stopInDocumentListening = function() {
  if (mutationEvents()) {
    jQuery("body").off("DOMNodeInserted", Control.elementInserted);
    return inDocumentListening = false;
  } else {
    window.clearInterval(elementInsertionInterval);
    return elementInsertionInterval = null;
  }
};

/*
Control JSON: a JSON scheme for defining a control class.
*/

/*
Apply the indicated JSON to the control. Each key in the JSON will
invoke the corresponding setter function in a function chain. E.g.,
the JSON dictionary

     {
         foo: "Hello",
         bar: "World"
     }

will invoke this.foo( "Hello" ).bar( "World" ).

If a dictionary value is itself a JSON object, it will be reconstituted
into HTML, or controls, or an array.

This is similar to properties(), but that function doesn't attempt any
processing of the values.

The logicalParent parameter is intended for internal use only.
*/

var copyExcludingKeys, evaluateControlJson, evaluateControlJsonProperties, evaluateControlJsonValue;

Control.prototype.json = function(json, logicalParent) {
  var control, i, properties, _i, _len, _ref;

  if (logicalParent == null) {
    logicalParent = this;
  }
  _ref = this.segments();
  for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    control = _ref[i];
    properties = evaluateControlJsonProperties(json, logicalParent.nth(i));
    control.properties(properties);
  }
  return this;
};

/*
Return a copy of the given object, skipping the indicated keys.
Keys should be provided as a dictionary with true values. E.g., the dictionary
{ a: true, b: true } specifies that keys "a" and "b" should be excluded
from the result.
*/


copyExcludingKeys = function(obj, excludeKeys) {
  var key, result;

  result = {};
  for (key in obj) {
    if (!excludeKeys[key]) {
      result[key] = obj[key];
    }
  }
  return result;
};

/*
Create the control from the given JSON. This will be of three forms.
The first form creates a control:

 {
   control: "MyButton",
   ref: "foo",     
   content: "Hello, world."
 }

The special "control" property determines the class of the control. 
The second form creates a plain HTML element:

 {
   html: "<div/>",
   ref: "foo"
 }

The html can be any HTML string supported by jQuery. It can also be an HTML
tag singleton without braces: e.g., "div" instead of needing "<div>" or
"<div/>". In normal jQuery, a tag like "div" would be a selector, and would
not create an element. But in the context of creating controls, it seems
more useful to interpret this to create an element of the indicated type.

The "ref" property is special, in that it is handled by the logical parent
of the element being defined rather than by the element itself. The logical
parent is the control whose definition included the JSON being processed here.

The third form is any other JSON dictionary object, returned as is.
*/


evaluateControlJson = function(json, logicalParent) {
  var control, html, properties, reservedKeys, stripped;

  if (json.html != null) {
    reservedKeys = {
      html: true
    };
  } else if (json.control != null) {
    reservedKeys = {
      control: true
    };
  } else {
    return json;
  }
  reservedKeys.ref = true;
  stripped = copyExcludingKeys(json, reservedKeys);
  properties = evaluateControlJsonProperties(stripped, logicalParent);
  control = void 0;
  if (json.html != null) {
    html = json.html;
    if (/^\w+$/.test(html)) {
      html = "<" + html + ">";
    }
    control = (new Control(html)).properties(properties);
  } else {
    control = Control.getClass(json.control).create(properties);
  }
  if (json.ref) {
    logicalParent.referencedElement(json.ref, control);
  }
  return control;
};

/*
For each key in the given JSON object, evaluate its value.

If the JSON is a scalar value (e.g., a string) or array, this will implicitly
be taken as a content property. E.g., a json argument of "Hello" would have
the same as { content: "Hello" }.
*/


evaluateControlJsonProperties = function(json, logicalParent) {
  var key, properties;

  if (!jQuery.isPlainObject(json)) {
    json = {
      content: json
    };
  }
  properties = {};
  for (key in json) {
    properties[key] = evaluateControlJsonValue(json[key], logicalParent);
  }
  return properties;
};

/*
Determine the value of the given JSON object found during the processing
of control JSON.

If the supplied json is a JavaScript object, it will be treated as a control
and created from that object's properties.
If it's an array, its items will be mapped to their values using this same
function.
Otherwise, the object is returned as is.

The "logical parent" is the control whose JSON defined the elements being
created. The logical parent for a given element may not be the element's
immediate parent in the DOM; it might be higher up.
*/


evaluateControlJsonValue = function(value, logicalParent) {
  var item, itemValue, _i, _len, _results;

  if (jQuery.isArray(value)) {
    _results = [];
    for (_i = 0, _len = value.length; _i < _len; _i++) {
      item = value[_i];
      _results.push((itemValue = evaluateControlJsonValue(item, logicalParent), itemValue instanceof jQuery ? itemValue[0] : itemValue));
    }
    return _results;
  } else if (jQuery.isPlainObject(value)) {
    return evaluateControlJson(value, logicalParent);
  } else {
    return value;
  }
};

/*
Layout helpers.
*/

/*
See if the control's size has changed since the last time we checked and,
if so, trigger the sizeChanged event.

A control can use this method to let layout-performing ancestors know
that the control has changed its size, in case the ancestor will now
need to update the layout.
*/

var updateSavedSize;

Control.prototype.checkForSizeChange = function() {
  if (updateSavedSize(this)) {
    this.trigger("sizeChanged");
  }
  return this;
};

/*
Layout event.

Elements can use the layout event if they want to perform custom layout when
their size changes. The layout contract is weak: it's generally triggered
when the window size changes AND the element's size has actually changed in
response.
 
The layout event will *not* automatically fire if the element's size has
changed in response to other activity, such as a child element growing in
size. Supporting that generally would require setting up an expensive poll
interval. However, a contained element that want to let their containers
know about changes in the contained element's size can do so by triggering
a layout event that will bubble up to the container.
*/


jQuery.event.special.layout = {
  /*
  Add a layout event handler.
  */

  add: function(handleObj) {
    var layout;

    layout = jQuery.event.special.layout;
    layout._trackedElements = layout._trackedElements.add(this);
    return (new Control(this)).inDocument(function() {
      /*
      Directly invoke the handler instead of triggering the event.
      If add() is invoked on an element that's already in the document,
      inDocument() will fire immediately, which means the handler won't
      be wired up yet.
      */

      var event, handler;

      handler = handleObj.handler;
      event = new jQuery.Event("layout");
      return handler.call(this, event);
    });
  },
  /*
  Handle the layout event.
  */

  handle: function(event) {
    var control;

    control = new Control(this);
    if (!control.inDocument()) {
      return;
    }
    if (!control.checkForSizeChange()) {
      return;
    }
    return event.handleObj.handler.apply(this, arguments);
  },
  /*
  Called the first time the layout event is added to an element.
  */

  setup: function() {
    var layout;

    layout = jQuery.event.special.layout;
    if (!layout._trackingResizeEvent) {
      $(window).resize(function() {
        return layout._windowResized();
      });
      return layout._trackingResizeEvent = true;
    }
  },
  /*
  The last layout event handler for an element has been removed.
  */

  teardown: function() {
    return jQuery.event.special.layout._trackedElements = jQuery.event.special.layout._trackedElements.not(this);
  },
  /*
  The set of elements receiving layout events.
  */

  _trackedElements: $(),
  /*
  The window has been resized.
  */

  _windowResized: function() {
    return jQuery.event.special.layout._trackedElements.trigger("layout");
  }
};

/*
Compare the control's current size with its previously recorded size.
If the size has not changed, return false. If the size has changed,
update the recorded size and return true.
*/


updateSavedSize = function(control) {
  var previousSize, size, _ref;

  previousSize = (_ref = control.data("_size")) != null ? _ref : {};
  size = {
    height: control.height(),
    width: control.width()
  };
  if (size.height === previousSize.height && size.width === previousSize.width) {
    return false;
  } else {
    control.data("_size", size);
    return true;
  }
};

/*
Localization
*/

/*
The control's culture.
If jQuery Globalize is present, this defaults to the current culture.
This can be overridden on a per-control basis, e.g., for testing purposes.

Control classes can override this method to respond immediately to an
explicit change in culture. They should invoke their base class' culture
method, do whatever work they want ( if the culture parameter is defined ),
then return the result of the base class call.
*/
Control.prototype.culture = function(culture) {
  var controlCulture, cultureDataMember;

  cultureDataMember = "_culture";
  controlCulture = void 0;
  if (culture === void 0) {
    controlCulture = this.data(cultureDataMember);
    return controlCulture != null ? controlCulture : (window.Globalize ? Globalize.culture() : null);
  } else {
    controlCulture = (typeof culture === "string" ? Globalize.findClosestCulture(culture) : culture);
    return this.data(cultureDataMember, controlCulture);
  }
};

/*
Helpers to efficiently define control class properties.
QuickUI properties are jQuery-style getter/setter functions.
*/

var symbolCounter,
  __slice = [].slice;

jQuery.extend(Control, {
  /*
  Given an array of functions, repeatedly invoke them as a chain.
  
  This function allows the compact definition of getter/setter functions
  for Control classes that are delegated to aspects of the control or
  elements within its DOM.
  
  For example:
  
      MyControl.prototype.foo = Control.chain( "$foo", "content" );
  
  will create a function foo() on all MyControl instances that sets or gets
  the content of the elements returned by the element function $foo(),
  which in turn likely means any element with id "#foo" inside the control.
  
  The parameters to chain are the names of functions that are invoked in
  turn to produce the result. The last parameter may be an optional side
  effect function that will be invoked whenever the chain function is
  invoked as a setter.
  
  The function names passed as parameters may also define an optional
  string-valued parameter that will be passed in. So chain( "css/display" )
  creates a curried setter/getter function equivalent to css( "display", value ).
  */

  chain: function() {
    var arg, args, functionNames, functionParams, i, parts, sideEffectFn, _i, _len;

    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (jQuery.isFunction(args[args.length - 1])) {
      sideEffectFn = args.pop();
    }
    functionNames = [];
    functionParams = [];
    for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
      arg = args[i];
      parts = arg.split("/");
      functionNames[i] = parts.shift();
      functionParams[i] = parts;
    }
    return function(value) {
      var fn, functionName, length, params, result, _j, _len1;

      result = this;
      length = functionNames.length;
      for (i = _j = 0, _len1 = functionNames.length; _j < _len1; i = ++_j) {
        functionName = functionNames[i];
        fn = result[functionName];
        if (fn === void 0) {
          throw "Control class " + this.className + " tried to chain to an undefined getter/setter function " + functionNames[i] + ".";
        }
        params = functionParams[i];
        if (i === length - 1 && value !== void 0) {
          params = params.concat([value]);
        }
        result = fn.apply(result, params);
      }
      if (value === void 0) {
        return result;
      } else {
        if (sideEffectFn) {
          sideEffectFn.call(this, value);
        }
        return this;
      }
    };
  },
  /*
  Return a function that applies another function to each control in a
  jQuery array.
  
  If the inner function returns a defined value other than "this", the function
  is assumed to be a property getter, and that result is returned immediately.
  Otherwise, "this" is returned to permit chaining.
  */

  iterator: function(fn) {
    return function() {
      var control, result, _i, _len, _ref;

      _ref = this.segments();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        control = _ref[_i];
        result = fn.apply(control, arguments);
        if (result !== void 0 && result !== control) {
          return result;
        }
      }
      return this;
    };
  },
  /*
  Generic factory for a property getter/setter.
  */

  property: function(sideEffectFn, defaultValue, converterFunction) {
    var backingPropertyName;

    backingPropertyName = "_property" + symbolCounter++;
    return function(value) {
      var args, control, oldValue, result, sideEffectWantsOldValue, _i, _len, _ref;

      result = void 0;
      if (value === void 0) {
        result = this.data(backingPropertyName);
        if (result === void 0) {
          return defaultValue;
        } else {
          return result;
        }
      } else {
        sideEffectWantsOldValue = (sideEffectFn != null ? sideEffectFn.length : void 0) > 1;
        _ref = this.segments();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          control = _ref[_i];
          if (sideEffectWantsOldValue) {
            oldValue = control.data(backingPropertyName);
          }
          result = converterFunction ? converterFunction.call(control, value) : value;
          control.data(backingPropertyName, result);
          if (sideEffectFn) {
            args = [result];
            if (sideEffectWantsOldValue) {
              args.push(oldValue);
            }
            sideEffectFn.apply(control, args);
          }
        }
        return this;
      }
    };
  }
});

/*
Factories for getter/setters of various types.
*/


jQuery.extend(Control.property, {
  bool: function(sideEffectFn, defaultValue) {
    return Control.property(sideEffectFn, defaultValue, function(value) {
      return String(value) === "true";
    });
  },
  /*
  A class-valued property.
  This accepts either a function (the class) or a class name as a string.
  */

  "class": function(sideEffectFn, defaultValue) {
    return Control.property(sideEffectFn, defaultValue, Control.getClass);
  },
  date: function(sideEffectFn, defaultValue) {
    return Control.property(sideEffectFn, defaultValue, function(value) {
      if (value instanceof Date || (value == null)) {
        return value;
      } else {
        return new Date(Date.parse(value));
      }
    });
  },
  integer: function(sideEffectFn, defaultValue) {
    return Control.property(sideEffectFn, defaultValue, parseInt);
  }
});

symbolCounter = 0;

/*
Rehydration

This takes static HTML created in normal means for SEO purposes, and looks for
elements decorated with data- properties indicating which elements should be
reconstituted as live QuickUI controls.
*/

/*
Rehydrate controls from static HTML.
*/

var classPropertyNameMap, getCompoundPropertiesFromChildren, getPropertiesFromAttributes, propertyNameMaps, rehydrateElement, restorePropertyCase;

Control.prototype.rehydrate = function() {
  var $e, controls, i, subcontrols, _i, _ref;

  subcontrols = this.find("[data-control]").get();
  if (subcontrols.length > 0) {
    for (i = _i = _ref = subcontrols.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
      rehydrateElement(subcontrols[i]);
    }
  }
  controls = (function() {
    var _j, _len, _ref1, _results;

    _ref1 = this.segments();
    _results = [];
    for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
      $e = _ref1[_j];
      _results.push($e.data("control") ? rehydrateElement($e[0]) : $e);
    }
    return _results;
  }).call(this);
  return (new Control(controls)).cast();
};

/*
Rehydrate the given element as a control.
*/


rehydrateElement = function(element) {
  var $element, className, controlClass, lowerCaseProperties, properties;

  $element = $(element);
  className = $element.data("control");
  $element.removeAttr("data-control");
  controlClass = Control.getClass(className);
  lowerCaseProperties = jQuery.extend({}, getPropertiesFromAttributes(element), getCompoundPropertiesFromChildren(element));
  properties = restorePropertyCase(controlClass, lowerCaseProperties);
  return controlClass.createAt(element, properties);
};

/*
Return the properties indicated on the given element's attributes.
*/


getPropertiesFromAttributes = function(element) {
  var $element, attribute, key, match, properties, propertyName, regexDataProperty, _i, _len, _ref;

  properties = {};
  regexDataProperty = /^data-(.+)/;
  _ref = element.attributes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    attribute = _ref[_i];
    match = regexDataProperty.exec(attribute.name);
    if (match) {
      propertyName = match[1];
      if (propertyName !== "control") {
        properties[propertyName] = attribute.value;
      }
    }
  }
  $element = jQuery(element);
  for (key in properties) {
    $element.removeAttr("data-" + key);
  }
  return properties;
};

/*  
Return any compound properties found in the given element's children.
*/


getCompoundPropertiesFromChildren = function(element) {
  var $compound, $compoundElements, $value, properties, propertyName, _i, _len, _ref;

  properties = {};
  $compoundElements = new Control(element).children().filter("[data-property]");
  _ref = $compoundElements.segments();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    $compound = _ref[_i];
    propertyName = $compound.attr("data-property");
    if (propertyName !== "control") {
      $value = $compound.content();
      properties[propertyName] = $value;
      if ($value instanceof jQuery) {
        $value.detach();
      }
    }
  }
  $compoundElements.remove();
  return properties;
};

/*
Map the given property dictionary, in which all property names may be in
lowercase, to the equivalent mixed case names. Properties which are not
found in the control class are dropped.
*/


restorePropertyCase = function(controlClass, properties) {
  var map, mixedCaseName, propertyName, result;

  if (jQuery.isEmptyObject(properties)) {
    return properties;
  }
  map = classPropertyNameMap(controlClass);
  result = {};
  for (propertyName in properties) {
    mixedCaseName = map[propertyName.toLowerCase()];
    if (mixedCaseName) {
      result[mixedCaseName] = properties[propertyName];
    }
  }
  return result;
};

/*
Cached maps for property names in rehydrated control classes. See below.
*/


propertyNameMaps = {};

/*
Return a dictionary for the given class which maps the lowercase forms of
its properties' names to their full mixed-case property names.
*/


classPropertyNameMap = function(controlClass) {
  var className, lowerCaseName, map, mixedCaseName;

  controlClass.initialize();
  className = controlClass.prototype.className;
  if (!propertyNameMaps[className]) {
    map = {};
    for (mixedCaseName in controlClass.prototype) {
      lowerCaseName = mixedCaseName.toLowerCase();
      map[lowerCaseName] = mixedCaseName;
    }
    propertyNameMaps[className] = map;
  }
  return propertyNameMaps[className];
};

/*
Auto-loader for rehydration.
Set data-create-controls="true" on the body tag to have the current
page automatically rehydrated on load.
*/


jQuery(function() {
  var $body;

  $body = new Control("body");
  if ($body.data("create-controls")) {
    return $body.rehydrate();
  }
});

/*
Helper functions for working with control styles.
*/
Control.prototype.extend({
  /*
  Get/set whether the indicated class(es) are applied to the elements.
  This effectively combines $.hasClass() and $.toggleClass() into a single
  getter/setter.
  */

  applyClass: function(classes, value) {
    if (value === void 0) {
      return this.hasClass(classes);
    } else {
      return this.toggleClass(classes, String(value) === "true");
    }
  },
  /*
  The set of classes on the control's element.
  If no value is supplied, this gets the current list of classes.
  If a value is supplied, the specified class name(s) are *added*
  to the element. This is useful for allowing a class to be added
  at design-time to an instance, e.g., <Foo class="bar"/>. The
  resulting element will end up with "bar" as a class, as well as
  the control's class hierarchy: <div class="Foo Control bar">.
  */

  "class": function(classList) {
    if (classList === void 0) {
      return this.attr("class");
    } else {
      return this.toggleClass(classList, true);
    }
  },
  /*
  True if the control wants its generic appearance. The default value of this
  property is the control class' genericDefault member.
  */

  generic: function(generic) {
    return this.applyClass("generic", generic);
  },
  /*
  Sets/gets the style of matching elements.
  This lets one specify a style attribute in Control JSON for a control instance;
  the style will apply to the control's root element.
  */

  style: function(style) {
    return this.attr("style", style);
  },
  /*
  Toggle the element's visibility.
  Like $.toggle(), but if no value is supplied, the current visibility is returned
  (rather than toggling the element's visibility).
  */

  visibility: function(value) {
    if (value === void 0) {
      return this.is(":visible");
    } else {
      return this.toggle(String(value) === "true");
    }
  }
});

/*
Helper function by which a method can invoke the identically-named method
on a base class. Signficantly, it is not necessary for the invoking method to
pass in the current class, the base class, or the method name.

This function exists for use in plain JavaScript controls. CoffeeScript-based
controls have access to that langauge's "super" keyword.
*/

/*
Call a function of the same name in a superclass.

E.g., if A is a superclass of B, then:

     A.prototype.calc = function ( x ) {
         return x 2;
     }
     B.prototype.calc = function ( x ) {
         return this._super( x ) + 1;
     }

     var b = new B();
     b.calc( 3 );         # = 7
  
This assumes a standard prototype-based class system in which all classes have
a member called "superclass" pointing to their parent class, and all instances
have a member called "constructor" pointing to the class which created them.

This routine has to do some work to figure out which class defined the
calling function. It will have to walk up the class hierarchy and,
if we're running in IE, do a bunch of groveling through function
definitions. To speed things up, the first call to _super() within a
function creates a property called "_superFn" on the calling function;
subsequent calls to _super() will use the memoized answer.

Some prototype-based class systems provide a _super() function through the
use of closures. The closure approach generally creates overhead whether or
not _super() will ever be called. The approach below adds no overhead if
_super() is never invoked, and adds minimal overhead if it is invoked.
This code relies upon the JavaScript .caller method, which many claims
has slow performance because it cannot be optimized. However, "slow" is
a relative term, and this approach might easily have acceptable performance
for many applications.
*/

var findMethodImplementation,
  __hasProp = {}.hasOwnProperty;

Control.prototype._super = function() {
  /*
  TODO: As of 1.3.1, CoffeeScript doesn't permit the creation of named
  functions. So the standard approach below doesn't work, and we have to resort
  to using the deprecated arguments.callee. Need to work around this.
  
  if _super and _super.caller
    _super.caller # Modern browser
  else
    arguments.callee.caller # IE9 and earlier
  */

  var callerFn, callerFnName, classFn, classInfo, superFn;

  callerFn = arguments.callee.caller;
  if (!callerFn) {
    throw "Tried to invoke _super(), but couldn't find the calling function.";
  }
  superFn = callerFn._superFn;
  if (!superFn) {
    classInfo = findMethodImplementation(callerFn, this.constructor);
    if (classInfo) {
      classFn = classInfo.classFn, callerFnName = classInfo.fnName;
      superFn = classFn.__super__[callerFnName];
      callerFn._superFn = superFn;
    }
    if (!superFn) {
      throw "Tried to invoke _super(), but couldn't find a function of the same name in the base class.";
    }
  }
  return superFn.apply(this, arguments);
};

/*
Find which class implements the given method, starting at the given point in the
class hierarchy and walking up. Returns the class that implements the function,
and the name of the class member that references it. Returns null if the
function's implementation could not be found.
*/


findMethodImplementation = function(methodFn, classFn) {
  var key, value, _ref;

  _ref = classFn.prototype;
  for (key in _ref) {
    if (!__hasProp.call(_ref, key)) continue;
    value = _ref[key];
    if (value === methodFn) {
      return {
        classFn: classFn,
        fnName: key
      };
    }
  }
  if (classFn.__super__ != null) {
    return findMethodImplementation(methodFn, classFn.__super__.constructor);
  } else {
    return null;
  }
};

/*
Utilities
*/

var createElementReferenceFunction;

jQuery.extend(Control, {
  /*
  Given a value, returns a corresponding class:
  - A string value returns the global class with that string name.
  - A function value returns that function as is.
  - An object value returns a new anonymous class created from that JSON.
  */

  getClass: function(value) {
    var classFn;

    if (value === null || value === "") {
      return null;
    } else if (jQuery.isPlainObject(value)) {
      return Control.sub(value);
    }
    classFn = jQuery.isFunction(value) ? value : window[value];
    if (!classFn) {
      throw "Unable to find a class called " + value + ".";
    }
    return classFn;
  },
  isControl: function(element) {
    return Control(element).control() !== void 0;
  }
});

/*
Selector for ":control": reduces the set of matched elements to the ones
which are controls.
 
With this, $foo.is( ":control" ) returns true if at least one element in $foo
is a control, and $foo.filter( ":control" ) returns just the controls in $foo.
*/


jQuery.expr[":"].control = function(elem) {
  var controlClass;

  controlClass = (new Control(elem)).controlClass();
  if (controlClass) {
    return controlClass === Control || controlClass.prototype["instanceof"](Control);
  } else {
    return false;
  }
};

Control.prototype.extend({
  /*
  Return the array of elements cast to their closest JavaScript class ancestor.
  E.g., a jQuery $( ".foo" ) selector might pick up instances of control classes
  A, B, and C. If B and C are subclasses of A, this will return an instance of
  class A. So Control( ".foo" ).cast() does the same thing as A( ".foo" ), but without
  having to know the type of the elements in advance.
  
  The highest ancestor class this will return is the current class, even for plain
  jQuery objects, in order to allow Control methods ( like content() ) to be applied to
  the result.
  */

  cast: function(defaultClass) {
    var $e, elementClass, setClass, _i, _len, _ref, _ref1;

    defaultClass = defaultClass || this.constructor;
    setClass = void 0;
    _ref = this.segments();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      $e = _ref[_i];
      elementClass = (_ref1 = $e.controlClass()) != null ? _ref1 : defaultClass;
      if (setClass === void 0 || setClass.prototype instanceof elementClass) {
        setClass = elementClass;
      }
    }
    if (setClass == null) {
      setClass = defaultClass;
    }
    return new setClass(this);
  },
  /*
  Execute a function once for each control in the array. The callback should
  look like
  
    $controls.eachControl( function( index, control ) {
      ...
    });
    
  This is similar to $.each(), but preserves type, so "this" and the control
  parameter passed to the callback are of the correct control class.
  
  NB: Unlike Control.segments(), this looks up the specific control class for each
  element being processed, rather than assuming the containing control's class
  is shared by all elements. If eachControl() is applied to a mixture of controls,
  the callback will be invoked with each control in turn using that specific
  control's class.
  */

  eachControl: function(fn) {
    var control, element, i, result, _i, _len;

    for (i = _i = 0, _len = this.length; _i < _len; i = ++_i) {
      element = this[i];
      control = (new Control(element)).cast();
      result = fn.call(control, i, control);
      if (result === false) {
        break;
      }
    }
    return this;
  },
  id: function(id) {
    return this.attr("id", id);
  },
  /*
  Experimental function like eq, but faster because it doesn't manipulate
  the selector stack.
  */

  nth: function(index) {
    return new this.constructor(this[index]);
  },
  /*
  Invoke the indicated setter functions on the control to
  set control properties. E.g.,
  
     $c.properties( { foo: "Hello", bar: 123 } );
  
  is shorthand for $c.foo( "Hello" ).bar( 123 ).
  */

  properties: function(properties) {
    var propertyName, value;

    for (propertyName in properties) {
      if (this[propertyName] === void 0) {
        throw "Tried to set undefined property " + this.className + "." + propertyName + "().";
      }
      value = properties[propertyName];
      this[propertyName].call(this, value);
    }
    return this;
  },
  /*
  Get/set the given property on multiple elements at once. If called
  as a getter, an array of the property's current values is returned.
  If called as a setter, that property of each element will be set to
  the corresponding defined member of the values array. (Array values
  which are undefined will not be set.)
  */

  propertyVector: function(propertyName, values) {
    var $control, i, length, propertyFn, _i, _j, _len, _len1, _ref, _ref1, _results;

    propertyFn = this[propertyName];
    if (values === void 0) {
      _ref = this.segments();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        $control = _ref[_i];
        _results.push(propertyFn.call($control));
      }
      return _results;
    } else {
      length = this.length;
      _ref1 = this.segments();
      for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
        $control = _ref1[i];
        if (i >= length) {
          break;
        }
        if (values[i] !== void 0) {
          propertyFn.call($control, values[i]);
        }
      }
      return this;
    }
  },
  /*
  Save or retrieve an element associated with the control using the given ref
  key. The getter form of this maps the array of control(s) to a collection of
  the corresponding element(s) that were previously saved under the given ref.
  The setter form has several effects:
  1. It saves a pointer to the indicated element in the control's data.
  2. It adds the ref as a CSS class to the target element.
  3. It generates an element reference function for the present control's class
     that permits future access to referenced elements.
  This function is generally for internal use, and is invoked during processing
  of Control JSON, or (in its getter form) from the generated element reference
  function mentioned in point #3.
  */

  referencedElement: function(ref, elements) {
    var $control, $result, i, _i, _len, _ref;

    if (elements === void 0) {
      elements = (function() {
        var _i, _len, _ref, _results;

        _ref = this.segments();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          $control = _ref[_i];
          if (($control.data(ref)) !== void 0) {
            _results.push($control.data(ref));
          }
        }
        return _results;
      }).call(this);
      $result = (new Control(elements)).cast();
      $result.prevObject = this;
      return $result;
    } else {
      createElementReferenceFunction(this.constructor, ref);
      elements.addClass(ref);
      _ref = this.segments();
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        $control = _ref[i];
        $control.data(ref, elements[i]);
      }
      return this;
    }
  },
  /*
  Return the controls in "this" as an array of subarrays, each of which holds
  a single control of the same class as the current control. E.g., if "this"
  contains a control object with
  
    [ control1, control2, control3, ... ]
    
  Then calling segments() returns
  
    [ [control1], [control2], [control3], ... ]
  
  This is useful in for loops and list comprehensions, and avoids callbacks.
  It is more sophisticated than simply looping over the control as a jQuery
  object, because that just loops over plain DOM elements, whereas segements()
  lets us loop over jQuery/Control objects that retain type information and,
  thus, direct access to class members.
  */

  segments: function() {
    var element, _i, _len, _results;

    _results = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      element = this[_i];
      _results.push(new this.constructor(element));
    }
    return _results;
  },
  /*
  The tabindex of the control.
  */

  tabindex: function(tabindex) {
    if (tabindex === void 0) {
      return this.prop("tabindex");
    } else {
      return this.prop("tabindex", tabindex);
    }
  },
  /*
  Extra information about an element; e.g., to show as a ToolTip. This maps
  to the standard HTML title property on the control's top-level element.
  */

  title: function(title) {
    if (title === void 0) {
      return this.prop("title");
    } else {
      return this.prop("title", title);
    }
  }
});

/*
Define a function on the given class that will retrieve elements with the given
reference. Example: defining an element reference function on class Foo and
reference "bar" will create Foo.prototype.$bar(), which returns the element(s)
created with reference "bar".
This has no effect if the class already has a function with the given name.
*/


createElementReferenceFunction = function(classFn, ref) {
  var fnName;

  fnName = "$" + ref;
  if (!classFn.prototype[fnName]) {
    return classFn.prototype[fnName] = function(elements) {
      return this.referencedElement(ref, elements);
    };
  }
};

})();
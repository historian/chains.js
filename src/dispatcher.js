
var _kernel = function(dispatcher, stack){
  if (!stack) {
    stack = exports.stacks.serial([]);
  }

  return function(func){
    if (func == 'done') {
      dispatcher.push(stack, true);
    } else if (func._wrap) {
      return function(){
        var args = Array.prototype.slice.call(arguments, 0);
        return func.exec(dispatcher, [stack].concat(args));
      };
    } else if (func._disp) {
      return function(){
        var args = Array.prototype.slice.call(arguments, 0);
        return func.apply(dispatcher, [stack].concat(args));
      };
    } else {
      return dispatcher.kernel(stack.push(func));
    }
  };
};

var _compile_constructor = function(helpers, def){
  var func_name, code = "";
  
  code += "(function(){";
  code += "var done='done';";
  
  for (func_name in helpers) {
    code += "var "+func_name+" = this."+func_name+";"
  }
  
  code += "(";
  code += def.toString();
  code += ")();});";
  
  return eval(code);
};

var _wrapper_for_helper = function(dispatcher, helper){
  helper._disp = true;
  
  var wrapper = function(){
    var args = Array.prototype.slice.call(arguments, 0);
    var disp = arguments.callee.dispatcher;
    var func = arguments.callee.helper;
    return _kernel(disp)(func).apply(disp, args);
  };
  
  wrapper._wrap = true;
  wrapper.dispatcher = dispatcher;
  wrapper.helper = helper
  wrapper.exec = function(t, args){
    return this.helper.apply(t, args);
  };
  
  return wrapper;
};

var _wrap_helpers = function(dispatcher, helpers) {
  var func_name, func;
  for (func_name in helpers) {
    func = helpers[func_name];
    dispatcher[func_name] = _wrapper_for_helper(dispatcher, func);
  };
};

var _construct_dispatcher = function(helpers, def){
  var dispatcher = exports.stacks.cascade([]);
  var kernel = function(stack){
    var disp = arguments.callee.dispatcher;
    return _kernel(disp, stack);
  }
  
  kernel.dispatcher = dispatcher;
  
  dispatcher.kernel = kernel;
  
  _wrap_helpers(dispatcher, helpers);
  
  var constructor = _compile_constructor(helpers, def);
  
  constructor.call(dispatcher);
  
  return dispatcher;
};

var _define_dispatcher_class = function(helpers){
  var dispatcher_class = function(def){
    var helpers = arguments.callee.helpers;
    return _construct_dispatcher(helpers, def);
  };
  
  dispatcher_class.helpers = helpers;
  
  return dispatcher_class;
};

exports.dispatcher = function(parent, helpers){
  if (!helpers) {
    helpers = parent;
    parent = undefined;
  }

  var all_helpers = {}, name;

  if (parent && parent.helpers) {
    for (name in parent.helpers) {
      all_helpers[name] = parent.helpers[name];
    }
  }

  if (helpers) {
    for (name in helpers) {
      all_helpers[name] = helpers[name];
    }
  }

  return _define_dispatcher_class(all_helpers);
};

var dispatcher = exports.dispatcher;

exports.dispatcher.http = dispatcher({
  'method': function(stack, method) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if (e.method == method) { clb(ctx); }
      else { clb.pass(ctx); }
    }));
  },
  'path': function(stack, path) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if (e.path == path) { clb(ctx); }
      else { clb.pass(ctx); }
    }));
  },
  'host': function(stack, host) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if (e.host == host) { clb(ctx); }
      else { clb.pass(ctx); }
    }));
  },
  'get': function(stack, path){
    return (this.kernel)(stack)(this.method)('get')(this.path)(path);
  },
  'post': function(stack, path){
    return (this.kernel)(stack)(this.method)('post')(this.path)(path);
  },
  'put': function(stack, path){
    return (this.kernel)(stack)(this.method)('put')(this.path)(path);
  },
  'del': function(stack, path){
    return (this.kernel)(stack)(this.method)('delete')(this.path)(path);
  }
});

// <!--[jquery]-->

// ## jQuery Extentions

// ### dispatcher.body(ctx, [clb])

// Perform actions based on the id and the classes of the body element.
exports.dispatcher.body = dispatcher({

  // #### `(body_class)("class_name")`

  // check for a class name.
  'body_class': function(stack, class_name) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if ($('body').hasClass(class_name)) { clb(ctx); }
      else { clb.pass(ctx); }
    }));
  },

  // #### `(body_id)("identifier")`

  // check for an identifier.
  'body_id': function(stack, identifier) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if ($('body')[0].id == identifier) { clb(ctx); }
      else { clb.pass(ctx); }
    }));
  },

  // #### `(body)("css selector")`

  // continue only when body matches the CSS selector.
  'body': function(stack, selector) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if ($('body').first().filter(selector).length > 0) { clb(ctx); }
      else { clb.pass(ctx); }
    }));
  }
});

// <!--[jquery]-->

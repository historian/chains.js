
exports.dispatcher = function(parent, helpers){
  if (!helpers) {
    helpers = parent;
    parent = undefined;
  }
  
  var all_helpers = {}, name, disp;
  
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
  
  disp = function(def){
    var state = {
      dispatcher: exports.stacks.cascade([])
    };
    
    var kernel = state.dispatcher.kernel = function(stack){
      if (!stack) {
        stack = exports.stacks.serial([]);
      }
    
      return function(func){
        if (func == 'done') {
          state.dispatcher = state.dispatcher.push(stack, true);
        } else if (func._wrap) {
          return function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return func.exec(state.dispatcher, [stack].concat(args));
          };
        } else if (func._disp) {
          return function(){
            var args = Array.prototype.slice.call(arguments, 0);
            return func.apply(state.dispatcher, [stack].concat(args));
          };
        } else {
          return state.dispatcher.kernel(stack.push(func));
        }
      };
    };
    
    var func_name, func, wrapper, helpers = "", constants = "";
    for (func_name in all_helpers) {
      func = all_helpers[func_name];
      (function(func_name, func){
        func._disp = true;
        wrapper = function(){
          var args = Array.prototype.slice.call(arguments, 0);
          return kernel()(func).apply(state.dispatcher, args);
        };
        wrapper._wrap = true;
        wrapper.exec = function(t, args){
          return func.apply(t, args);
        };
        state.dispatcher[func_name] = wrapper;
        helpers += "var "+func_name+" = state.dispatcher."+func_name+";"
      })(func_name, func);
    }
    
    constants += "var done='done';";
    
    eval(constants+helpers+"(" + def.toString() + ")();");
    
    return state.dispatcher;
  };
  
  disp.helpers = all_helpers;
  
  return disp;
};

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

//--[jquery]

exports.dispatcher.body = dispatcher({
  'body_class': function(stack, class_name) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if ($('body').hasClass(class_name)) { clb(ctx); }
      else { clb.pass(ctx): }
    }));
  },
  'body_id': function(stack, identifier) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if ($('body')[0].id == identifier) { clb(ctx); }
      else { clb.pass(ctx): }
    }));
  },
  'body': function(stack, selector) {
    return (this.kernel)(stack.push(function(ctx, clb){
      if ($('body').first().filter(selector).length > 0) { clb(ctx); }
      else { clb.pass(ctx): }
    }));
  }
});

//--[jquery]

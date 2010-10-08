
(function($){

  var exports = $;

  exports.dispatcher = function(def){
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
    for (func_name in exports.dispatcher.helpers) {
      func = exports.dispatcher.helpers[func_name];
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

  exports.dispatcher.helpers = {
    'method': function(stack, method) {
      return (this.kernel)(stack.push(function(e, clb){
        if (e.method == method) { clb(e); }
        else { clb.pass(e); }
      }));
    },
    'path': function(stack, path) {
      return (this.kernel)(stack.push(function(e, clb){
        if (e.path == path) { clb(e); }
        else { clb.pass(e); }
      }));
    },
    'host': function(stack, host) {
      return (this.kernel)(stack.push(function(e, clb){
        if (e.host == host) { clb(e); }
        else { clb.pass(e); }
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
  };

})(jQuery);


(function(exports){

  var build_callback;

  // export stacks in a property called _stacks_
  exports['stacks'] = {};

  // ### stacks.sync(function)

  // `sync(function(ctx){ return ctx; })` turns a non-callback function into a callback function by wrapping it.
  exports['stacks']['sync'] = function(func){
    return function(ctx, clb) {
      clb(func.call(this, ctx));
    };
  };


  // ### stacks.serial([steps, ...])

  // execute a list of steps one after the other.
  exports['stacks']['serial'] = (function(){
    var _perform_step, _build, _toString, _push;

    // execute a step.
    _perform_step = function(state) {
      if (state.steps.length == 0) {
        if (state.clb) {
          state.clb.call(this, state.ctx);
        }

      } else {
        var step = state.steps.shift();

        var _clb = build_callback(this, state, function(state){
          if (!state.pass) {
            _perform_step.call(this, state);
          } else {
            state.steps = [];
            _perform_step.call(this, state);
          }
        });

        step.call(this, state.ctx, _clb);
      }
    };

    // build a serial.
    _build = function(class_state){
      var serial, state = { steps: [] };
      for (i in class_state.steps) {
        state.steps[i] = class_state.steps[i];
      }

      serial = function(ctx, clb){
        var instance_state = { steps: [], ctx: ctx, clb: clb }, i;

        for (i in state.steps) {
          instance_state.steps[i] = state.steps[i];
        }

        _perform_step.call(this, instance_state);
      };

      serial.state       = state;
      serial['toString'] = _toString
      serial['push']     = _push;

      return serial;
    };

    // custom to toString()
    _toString = function(){
      return "serial:["+this.state.steps.toString()+"]";
    };

    // allow pushing a new step to the _serial_
    _push = function(step){
      var s = _build(this.state);
      s.state.steps.push(step);
      return s;
    };

    // The constructor. `steps` is an array of functions.
    return function(steps){
      return _build({ steps: steps });
    };
  })();


  // ### stacks.parallel([steps, ...])

  // execute a list of steps in parallel.
  exports['stacks']['parallel'] = (function(){
    var _perform_step, _build, _toString, _push;

    _perform_step = function(step, state){
      var _clb = build_callback(this, state, function(state){
        state.length -= 1;

        if (state.length == 0) {
          if (state.clb) {
            state.clb.call(this, state.ctx);
          }
        }
      });

      step.call(this, state.ctx, _clb);
    };

    _build = function(class_state){
      var parallel, state = { steps: [] };
      for (i in class_state.steps) {
        state.steps[i] = class_state.steps[i];
      }

      parallel = function(ctx, clb){
        var instance_state = { steps: {}, ctx: ctx, clb: clb }, step, i;

        instance_state.length = state.steps.length;
        for (i in state.steps) {
          instance_state.steps[i] = state.steps[i];
        }

        for(i in instance_state.steps) {
          _perform_step.call(this, instance_state.steps[i], instance_state);
        }
      };

      parallel.state       = state;
      parallel['toString'] = _toString
      parallel['push']     = _push;

      return parallel;
    };

    _toString = function(){
      return "parallel:["+this.state.steps.toString()+"]";
    };

    _push = function(step){
      var s = _build(this.state);
      s.state.steps.push(step);
      return s;
    };

    return function(steps){
      return _build({ steps: steps });
    };
  })();

  // ### stacks.cascade([steps, ...])

  // execute a step and only continue to the next step if the previous step call `clb.pass()`.
  exports['stacks']['cascade'] = function(){
    var state = {};

    if ((arguments.length == 1) && (arguments[0] instanceof Array)) {
      state.stacks = arguments[0];
    } else {
      state.stacks = Array.prototype.slice.call(arguments, 0);
    }

    var perform_stack, continue_chain;

    perform_stack = function(stack, rest, ctx, clb) {
      var _this = this;
      var _clb = function(_ctx){
        continue_chain.call(_this, 'done', _ctx || ctx, clb);
      };
      _clb['pass'] = function(_ctx){
        continue_chain.call(_this, rest, _ctx || ctx, clb);
      };
      stack.call(_this, ctx, _clb);
    };

    continue_chain = function(rest, ctx, clb) {
      if (rest == 'done') {
        if (clb) { clb.call(this, ctx); }
      } else if (rest.length == 0) {
        if (clb && clb['pass']) { clb['pass'](ctx); }
      } else {
        perform_stack.call(this, rest.shift(), rest, ctx, clb);
      }
    };

    var build;
    build = function(_state){
      var state = {stacks:[]};
      for (i in _state.stacks) { state.stacks[i] = _state.stacks[i]; }

      var cascade = function(ctx, clb){
        var _stacks = [], i;
        for (i in state.stacks) { _stacks[i] = state.stacks[i]; }
        continue_chain.call(this, _stacks, ctx, clb);
      };

      cascade.state = state;

      cascade['toString'] = function(){
        return "cascade:["+cascade.state.stacks.toString()+"]";
      };

      cascade['push'] = function(stack, by_ref){
        if (by_ref) {
          state.stacks.push(stack);
          return this;
        } else {
          var c = build(state);
          c.state.stacks.push(stack);
          return c;
        }
      };

      return cascade;
    };

    return build(state);
  };




  build_callback = function(_this, _state, _done){
    var _clb = function(_ctx){
      _state.ctx  = _ctx || _state.ctx;
      _state.pass = false;
      _done.call(_this, _state);
    };

    _clb['pass'] = function(_ctx){
      _state.ctx  = _ctx || _state.ctx;
      _state.pass = true;
      if (_state.clb && _state.clb['pass']) {
        _state.clb['pass'](_state.ctx);
      } else {
        _done.call(_this, _state);
      }
    };

    return _clb;
  };

})(this);


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
    var _perform_step, _build, _toString, _push, _call;

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
      var serial = function(ctx, clb){
        var class_state = arguments.callee.state;
        _call.call(this, class_state, ctx, clb);
      };

      serial.state       = { steps: [] };
      serial['toString'] = _toString
      serial['push']     = _push;

      for (i in class_state.steps) {
        serial.state.steps[i] = class_state.steps[i];
      }

      return serial;
    };

    _call = function(class_state, ctx, clb){
      var instance_state = { steps: [], ctx: ctx, clb: clb }, i;

      for (i in class_state.steps) {
        instance_state.steps[i] = class_state.steps[i];
      }

      _perform_step.call(this, instance_state);
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
    var _perform_step, _build, _toString, _push, _call;

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
      var parallel = function(ctx, clb){
        var class_state = arguments.callee.state;
        _call.call(this, class_state, ctx, clb);
      };

      parallel.state       = { steps: [] };
      parallel['toString'] = _toString
      parallel['push']     = _push;

      for (i in class_state.steps) {
        parallel.state.steps[i] = class_state.steps[i];
      }

      return parallel;
    };

    _call = function(class_state, ctx, clb){
      var instance_state = { steps: {}, ctx: ctx, clb: clb }, step, i;

      instance_state.length = class_state.steps.length;
      for (i in class_state.steps) {
        instance_state.steps[i] = class_state.steps[i];
      }

      for(i in instance_state.steps) {
        _perform_step.call(this, instance_state.steps[i], instance_state);
      }
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
  exports['stacks']['cascade'] = (function(){
    var _build, _toString, _push, _call, _perform_step;

    _perform_step = function(state) {
      if (state.done) {
        if (state.clb) {
          state.clb.call(this, state.ctx);
        }

      } else if (state.steps.length == 0) {
        if (state.clb && state.clb['pass']) {
          state.clb['pass'](state.ctx);
        }

      } else {
        var step = state.steps.shift();

        var _clb = build_callback(this, state, function(state){
          if (!state.pass) {
            state.done = true;
            _perform_step.call(this, state);
          } else {
            _perform_step.call(this, state);
          }
        });

        step.call(this, state.ctx, _clb);
      }
    };

    _build = function(class_state){
      var cascade = function(ctx, clb){
        var class_state = arguments.callee.state;
        _call.call(this, class_state, ctx, clb);
      };

      cascade.state       = { steps: [] };
      cascade['toString'] = _toString;
      cascade['push']     = _push;

      for (i in class_state.steps) {
        cascade.state.steps[i] = class_state.steps[i];
      }

      return cascade;
    };

    _call = function(class_state, ctx, clb){
      var instance_state = { steps: [], ctx: ctx, clb: clb, done: false }, i;

      for (i in class_state.steps) {
        instance_state.steps[i] = class_state.steps[i];
      }

      _perform_step.call(this, instance_state);
    };

    _toString = function(){
      return "cascade:["+this.state.steps.toString()+"]";
    };

    _push = function(step, by_ref){
      if (by_ref) {
        this.state.steps.push(step);
        return this;
      } else {
        var c = _build(this.state);
        c.state.steps.push(step);
        return c;
      }
    };

    return function(steps){
      return _build({ steps: steps });
    };
  })();


  exports['stacks']['image'] = function(url, prefix){
    if (!prefix) prefix = 'images';
    return function(ctx, clb) {
      var image = new Image();
      image['onload'] = function(){
        if (!ctx[prefix]) ctx[prefix] = [];
        image['status'] = 'success';
        ctx[prefix].push(image);
        clb(ctx);
      };
      image['onerror'] = function(){
        if (!ctx[prefix]) ctx[prefix] = [];
        image['status'] = 'error';
        ctx[prefix].push(image);
        clb(ctx);
      };
      image['onabort'] = function(){
        if (!ctx[prefix]) ctx[prefix] = [];
        image['status'] = 'abort';
        ctx[prefix].push(image);
        clb(ctx);
      };
      image['src'] = url;
    };
  };

  exports['stacks']['images'] = function(urls, prefix){
    var i, images = [];
    for (i in urls)
      images.push(exports['stacks']['image'](urls[i], prefix));
    return exports['stacks']['parallel'](images);
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

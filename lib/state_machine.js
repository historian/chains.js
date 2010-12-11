// TODO
// - memoize the stacks.serial for each transition in the state_machine.


module.exports = function(def){

  var state_machine = function(){};

  state_machine.current_state = def.initial;
  state_machine.use_queue     = def.use_queue || false;
  state_machine.queue         = [];
  state_machine.transitioning = false;

  var name, state_func;
  for (name in def.states) {

    state_func = function(ctx, clb){
      var state_machine  = arguments.callee.state_machine;
      var old_state_name = state_machine.current_state;
      var old_state      = state_machine['to_'+old_state_name];
      var new_state      = arguments.callee;
      var transition     = old_state.transitions[new_state.state_name];

      if (state_machine.transitioning) {
        if (state_machine.use_queue) {
          state_machine.queue.push([ new_state.state_name, this, ctx, clb ]);
          return true;
        } else {
          return false;
        }
      }

      if (typeof(transition) == 'function') {
        transition = transition(ctx);
      }

      if (transition) {
        var s_steps = [], p_steps;

        s_steps.push(function(ctx, clb){
          state_machine.transitioning = true;
          clb(ctx);
        });

        p_steps = [];
        if (old_state.before_leave)
          p_steps.push(old_state.before_leave);

        if (new_state.before_enter)
          p_steps.push(new_state.before_enter);

        if (p_steps.length > 0)
          s_steps.push(exports.stacks.parallel(p_steps));

        p_steps = [];
        if (old_state.leave)
          p_steps.push(old_state.leave);

        if (new_state.enter)
          p_steps.push(new_state.enter);

        if (p_steps.length > 0)
          s_steps.push(exports.stacks.parallel(p_steps));

        s_steps.push(function(ctx, clb){
          state_machine.current_state = new_state.state_name;
          clb(ctx);
        });

        p_steps = [];
        if (old_state.after_leave)
          p_steps.push(old_state.after_leave);

        if (new_state.after_enter)
          p_steps.push(new_state.after_enter);

        if (p_steps.length > 0)
          s_steps.push(exports.stacks.parallel(p_steps));

        s_steps.push(function(ctx, clb){
          state_machine.transitioning = false;
          clb(ctx);
        });

        s_steps.push(function(ctx, clb){
          if (state_machine.queue.length > 0) {
            var next = state_machine.queue.shift();
            state_machine['to_'+next[0]].call(next[1], next[2], next[3]);
          }
          clb(ctx);
        });

        exports.stacks.serial(s_steps).call(this, ctx, clb);
        return true;
      } else {
        return false;
      }
    };

    state_func.state_name    = name;
    state_func.state_machine = state_machine;
    state_func.before_enter  = def.states[name].before_enter;
    state_func.before_leave  = def.states[name].before_leave;
    state_func.enter         = def.states[name].enter;
    state_func.leave         = def.states[name].leave;
    state_func.after_enter   = def.states[name].after_enter;
    state_func.after_leave   = def.states[name].after_leave;
    state_func.transitions   = def.transitions[name];

    state_machine['to_'+name] = state_func;
  }

  return state_machine;
};


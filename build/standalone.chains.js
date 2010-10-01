
(function(exports){
  
  
exports.sync = function(func){
  return function(ctx, clb) {
    var new_ctx = func.call(this, ctx);
    clb(new_ctx);
  };
};

exports.serial = function(){
  var steps;
  
  if ((arguments.length == 1) && (arguments[0] instanceof Array)) {
    steps = arguments[0];
  } else {
    steps = Array.prototype.slice.call(arguments, 0);
  }
  
  var perform_step, continue_chain;
  
  perform_step = function(step, rest, ctx, clb) {
    var _this = this;
    step.call(_this, ctx, function(ctx){
      continue_chain.call(_this, rest, ctx, clb);
    });
  };
  
  continue_chain = function(rest, ctx, clb) {
    if (rest.length == 0) {
      if (clb) { clb.call(this, ctx); }
    } else {
      perform_step.call(this, rest.shift(), rest, ctx, clb);
    }
  };
  
  return function(ctx, clb){
    var _steps = [], i;
    for (i in steps) { _steps.push(steps[i]); }
    continue_chain.call(this, _steps, ctx, clb);
  };
};

exports.parallel = function(){
  var steps;
  
  if ((arguments.length == 1) && (arguments[0] instanceof Array)) {
    steps = arguments[0];
  } else {
    steps = Array.prototype.slice.call(arguments, 0);
  }
  
  var emit_step = function(steps, step_id, ctx, clb){
    var _this = this;
    steps[step_id].call(_this, ctx, function(){
      delete steps[step_id];
      steps.length -= 1;
      
      if ((steps.length <= 0) && (clb)) {
        clb.call(_this, ctx, clb);
      }
    });
  };
  
  var emit_steps = function(steps, ctx, clb){
    var step, i;
    for(i in steps) {
      if (i != 'length')
        emit_step.call(this, steps, i, ctx, clb);
    } 
  };
  
  return function(ctx, clb){
    var _steps = {}, i;
    _steps.length = steps.length;
    for (i in steps) { _steps[i] = steps[i]; }
    emit_steps.call(this, _steps, ctx, clb);
  };
}

  
})(this);

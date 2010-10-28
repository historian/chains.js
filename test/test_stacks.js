module("stacks.js");

test("serial with one step", function(){

  var serial = $.stacks.serial([
    function(ctx, clb){
      ok(true, "step was called");
      clb(ctx);
    }
  ]);

  expect(1);
  serial();

});


test("serial with two steps", function(){

  var serial = $.stacks.serial([
    function(ctx, clb){
      ok(true, "first step was called");
      clb(ctx);
    },
    function(ctx, clb){
      ok(true, "second step was called");
      clb(ctx);
    }
  ]);

  expect(2);
  serial();

});


test("serial passes context through callback", function(){

  var ctx = "hello foo";

  var serial = $.stacks.serial([
    function(ctx, clb){
      equals(ctx, "hello foo", "equals 'hello foo'");
      clb(ctx.replace("foo", "bar"));
    },
    function(ctx, clb){
      equals(ctx, "hello bar", "equals 'hello bar'");
      clb(ctx.replace("bar", "baz"));
    }
  ]);

  expect(3);
  serial(ctx, function(ctx){
    equals(ctx, "hello baz", "equals 'hello baz'");
  });

});


test("serial passes context through callback (async)", function(){

  var ctx = "hello foo";

  var serial = $.stacks.serial([
    function(ctx, clb){
      equals(ctx, "hello foo", "equals 'hello foo'");
      setTimeout(function(){
        clb(ctx.replace("foo", "bar"));
      }, 10);
    },
    function(ctx, clb){
      equals(ctx, "hello bar", "equals 'hello bar'");
      setTimeout(function(){
        clb(ctx.replace("bar", "baz"));
      }, 10);
    }
  ]);

  stop(50);

  expect(3);
  serial(ctx, function(ctx){
    equals(ctx, "hello baz", "equals 'hello baz'");
    start();
  });

});

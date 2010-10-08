# Chains.js

**Chains.js** is a micro framework for scheduling and dispatching asynchronous actions.

## stacks.js

**stacks.js** provides three standard behaviors (`serial`, `parallel`, `cascade`)

## dispatcher.js

**dispatcher.js** provides a simple interface for dispatching messages to specific chains.

    var app = dispatcher(function(){
      (get)('/')(function(e, clb){
        console.log("GET /");
        clb();
      })(done);
    
      var project = (get)('/projects');
    
      (project)(host)('hello.com')(function(e, clb){
        console.log("GET /projects {Host: hello.com}");
        clb();
      })(done);
    
      (project)(host)('bye.com')(function(e, clb){
        console.log("GET /projects {Host: bye.com}");
        clb();
      })(done);
    });
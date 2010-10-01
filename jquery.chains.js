
(function($){
  
  $.chains = {};
  var exports = $.chains;
  
  %%% import %%%
  
  exports.ajax = function(options){
    var key = options.key || 'response';
    delete options['key'];
    return function(ctx, clb) {
      $.extend(options, {
        success: function(data, textStatus, XMLHttpRequest){
          ctx[key] = {
            success:        true,
            data:           data,
            textStatus:     textStatus,
            XMLHttpRequest: XMLHttpRequest
          };
          clb(ctx);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
          ctx[key] = {
            success:        false,
            errorThrown:    errorThrown,
            textStatus:     textStatus,
            XMLHttpRequest: XMLHttpRequest
          };
          clb(ctx);
        }
      })
      $.ajax(options);
    };
  };
  
  exports.batch_ajax = function(options){
    var key, opts, ajax = [];
    for(key in options) {
      opts = options[key];
      opts.key = key;
      ajax.push(exports.ajax(opts));
    }
    return exports.parallel(ajax);
  };
  
  exports.image = function(url, prefix){
    if (!prefix) prefix = 'images';
    return function(ctx, clb) {
      var image = new Image();
      image.onload = function(){
        if (!ctx[prefix]) ctx[prefix] = [];
        image.status = 'success';
        ctx[prefix].push(image);
        clb(ctx);
      };
      image.onerror = function(){
        if (!ctx[prefix]) ctx[prefix] = [];
        image.status = 'error';
        ctx[prefix].push(image);
        clb(ctx);
      };
      image.onabort = function(){
        if (!ctx[prefix]) ctx[prefix] = [];
        image.status = 'abort';
        ctx[prefix].push(image);
        clb(ctx);
      };
      image.src = url;
    };
  };
  
  exports.images = function(urls, prefix){
    var i, images = [];
    for (i in urls)
      images.push(exports.image(urls[i], prefix));
    return exports.parallel(images);
  };
  
})(jQuery);

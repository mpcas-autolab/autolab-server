

var div = document.getElementById('first_block').children;
var max_rotate = 7;

for (var i = 0; i <div.length; i++){
    div[i].style.webkitTransform = 'rotate(' + (Math.random()*max_rotate*2 - max_rotate) + 'deg)'; 
    div[i].style.mozTransform    = 'rotate(' + (Math.random()*max_rotate*2 - max_rotate) + 'deg)'; 
    div[i].style.msTransform     = 'rotate(' + (Math.random()*max_rotate*2 - max_rotate) + 'deg)'; 
    div[i].style.oTransform      = 'rotate(' + (Math.random()*max_rotate*2 - max_rotate) + 'deg)'; 
    div[i].style.transform       = 'rotate(' + (Math.random()*max_rotate*2 - max_rotate) + 'deg)';  
}
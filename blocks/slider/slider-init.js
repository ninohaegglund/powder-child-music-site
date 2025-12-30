document.addEventListener('DOMContentLoaded', function(){
  var sliders = document.querySelectorAll('.powder-slider');
  sliders.forEach(function(root){
    // prevent double-init
    if (root.__powder_slider_inited) return; root.__powder_slider_inited = true;

    // wrap existing children into slides container
    var slidesWrap = document.createElement('div');
    slidesWrap.className = 'powder-slider__slides';
    while(root.firstChild){ slidesWrap.appendChild(root.firstChild); }
    root.appendChild(slidesWrap);

    var slides = slidesWrap.children;
    if (!slides || slides.length === 0) return;

    // add controls
      var prev = document.createElement('button'); prev.className='powder-slider__nav powder-slider__nav--prev'; prev.type='button'; prev.innerText='‹';
      var next = document.createElement('button'); next.className='powder-slider__nav powder-slider__nav--next'; next.type='button'; next.innerText='›';
      root.appendChild(prev); root.appendChild(next);

      // create nav dots
      var dotsWrap = document.createElement('div');
      dotsWrap.className = 'powder-slider__dots';
      dotsWrap.setAttribute('role', 'tablist');
      var dots = [];
      for (var i = 0; i < slides.length; i++) {
        (function(i){
          var b = document.createElement('button');
          b.className = 'powder-slider__dot';
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
          b.setAttribute('data-index', String(i));
          b.addEventListener('click', function(){ index = i; update(); });
          dotsWrap.appendChild(b);
          dots.push(b);
        })(i);
      }
      root.appendChild(dotsWrap);

    var index = 0;
      function update(){
        slidesWrap.style.transform = 'translateX(' + (-index*100) + '%)';
        prev.disabled = index === 0;
        next.disabled = index === slides.length - 1;
        // update dots
        if (dots && dots.length) {
          for (var d = 0; d < dots.length; d++) {
            var el = dots[d];
            if (d === index) {
              el.classList.add('is-active');
              el.setAttribute('aria-current','true');
            } else {
              el.classList.remove('is-active');
              el.removeAttribute('aria-current');
            }
          }
        }
      }

    prev.addEventListener('click', function(){ index = Math.max(0, index - 1); update(); });
    next.addEventListener('click', function(){ index = Math.min(slides.length - 1, index + 1); update(); });

    // keyboard support
    root.addEventListener('keydown', function(e){ if(e.key === 'ArrowLeft'){ prev.click(); } if(e.key === 'ArrowRight'){ next.click(); } });

    // allow focusing slides container for keyboard events
    root.tabIndex = 0;
    update();
  });
});

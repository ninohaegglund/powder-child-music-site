(function(){
  // Simple JS-only floating panel for artist-term disclosures.
  // Submits via GET (page reload) to preserve current server behavior.
  function initArtistPanels(){
    document.querySelectorAll('.artist-terms--disclosure').forEach(function(form){
      var details = form.querySelector('details');
      var summary = details ? details.querySelector('summary') : null;
      // If structure differs, try a fallback trigger inside the form
      if (!summary) summary = form.querySelector('.artist-terms__trigger') || form.querySelector('button');
      // collect original option inputs (may be absent if display is dropdown)
      var origOptions = form.querySelectorAll('.artist-terms__option input');
      if (!summary) return;

      // Create portal panel
      var panel = document.createElement('div');
      panel.className = 'js-artist-panel';
      panel.style.position = 'absolute';
      panel.style.zIndex = 1100;
      panel.style.minWidth = '260px';
      panel.style.maxHeight = '60vh';
      panel.style.overflow = 'auto';
      panel.style.background = '#fff';
      panel.style.border = '1px solid #ddd';
      panel.style.borderRadius = '6px';
      panel.style.padding = '10px';
      panel.style.display = 'none';
      panel.innerHTML = '<div class="js-artist-panel__list" aria-expanded="false"></div>' +
                        '<div style="text-align:right;margin-top:8px">' +
                          '<button class="js-artist-apply">Tillämpa</button>' +
                        '</div>';
      document.body.appendChild(panel);

      var list = panel.querySelector('.js-artist-panel__list');

      // If there are rendered checkbox options, copy them. Otherwise, try to build from labels/selects.
      if (origOptions && origOptions.length) {
        origOptions.forEach(function(inp){
          var label = inp.closest('label');
          var text = label ? label.textContent.trim() : (inp.value || '');
          var id = 'js-' + Math.random().toString(36).slice(2,8);
          var l = document.createElement('label');
          l.style.display = 'block';
          l.style.margin = '6px 0';
          var cloned = inp.cloneNode(false);
          cloned.id = id;
          cloned.name = inp.name;
          cloned.checked = inp.checked;
          l.appendChild(cloned);
          l.appendChild(document.createTextNode(' ' + text));
          list.appendChild(l);
        });
      } else {
        // try selects inside the form (dropdown case) to build options
        var sel = form.querySelector('select');
        if (sel) {
          Array.from(sel.options).forEach(function(opt){
            var l = document.createElement('label');
            l.style.display = 'block';
            l.style.margin = '6px 0';
            var input = document.createElement('input');
            input.type = 'radio';
            input.name = sel.name;
            input.value = opt.value;
            if (opt.selected) input.checked = true;
            l.appendChild(input);
            l.appendChild(document.createTextNode(' ' + opt.text));
            list.appendChild(l);
          });
        }
      }

      function positionPanel(){
        var r = summary.getBoundingClientRect();
        // prefer matching the trigger width when possible
        var desiredWidth = Math.max(260, Math.min(400, Math.round(r.width))); // keep it reasonable
        panel.style.width = desiredWidth + 'px';

        var left = Math.round(r.left + window.scrollX);
        // prevent overflow to the right
        var maxLeft = document.documentElement.clientWidth - panel.offsetWidth - 8;
        if (left > maxLeft) left = Math.max(8, maxLeft);
        panel.style.left = Math.max(8, left) + 'px';

        panel.style.top = Math.round(r.bottom + 8 + window.scrollY) + 'px';
      }

      // open/close helpers that animate via CSS class
      function openPanel(){
        // hide other panels
        document.querySelectorAll('.js-artist-panel').forEach(function(other){ if (other !== panel){ other.classList.remove('is-open'); other.style.display = 'none'; } });
        panel.style.display = 'block';
        // allow style to apply then add class to trigger transition
        requestAnimationFrame(function(){ panel.classList.add('is-open'); });
        panel.querySelector('.js-artist-panel__list').setAttribute('aria-expanded','true');
        positionPanel();
      }

      function closePanel(){
        panel.classList.remove('is-open');
        panel.querySelector('.js-artist-panel__list').setAttribute('aria-expanded','false');
        // remove from flow after transition, but only if panel remains closed when transition ends
        var onEnd = function(e){
          if (e.propertyName === 'opacity' && !panel.classList.contains('is-open')) {
            panel.style.display = 'none';
            panel.removeEventListener('transitionend', onEnd);
          }
        };
        panel.addEventListener('transitionend', onEnd);
        // safety fallback
        setTimeout(function(){ if (!panel.classList.contains('is-open')) panel.style.display = 'none'; }, 350);
      }

      summary.addEventListener('click', function(ev){
        ev.preventDefault();
        if (panel.classList.contains('is-open')) { closePanel(); return; }
        // sync checked states from originals
        list.querySelectorAll('input').forEach(function(ci){
          var orig = form.querySelector('input[name="' + ci.name + '"][value="' + (ci.value || '') + '"]');
          if (orig) ci.checked = orig.checked;
        });
        openPanel();
      });

      // allow Esc to close
      document.addEventListener('keydown', function onEsc(e){
        if (e.key === 'Escape' && panel.classList.contains('is-open')) {
          closePanel();
        }
      });

      panel.querySelector('.js-artist-apply').addEventListener('click', function(){
        // copy selections back to original inputs and submit via GET
        var sample = list.querySelector('input[name]');
        if (!sample) { panel.style.display = 'none'; return; }
        var key = sample.name; // may include []

        // gather checked values
        var checked = Array.from(list.querySelectorAll('input:checked')).map(function(ci){ return ci.value; });

        // rebuild querystring preserving other params
        var params = new URLSearchParams(window.location.search);
        var baseParams = [];
        for (const [k,v] of params) {
          if (k === key) continue;
          baseParams.push([k,v]);
        }
        var newParams = new URLSearchParams();
        baseParams.forEach(function(p){ newParams.append(p[0], p[1]); });
        checked.forEach(function(val){ newParams.append(key, val); });

        var url = window.location.pathname + (newParams.toString() ? ('?' + newParams.toString()) : '');
        window.location.href = url;
      });

      // close on outside click (use closePanel so class toggles remain consistent)
      document.addEventListener('pointerdown', function(ev){
        if (panel.classList.contains('is-open') && !panel.contains(ev.target) && !summary.contains(ev.target)) closePanel();
      }, { passive: true });

      window.addEventListener('resize', function(){ if (panel.classList.contains('is-open')) positionPanel(); });
      window.addEventListener('scroll', function(){ if (panel.classList.contains('is-open')) positionPanel(); }, { passive: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initArtistPanels);
  else initArtistPanels();
})();

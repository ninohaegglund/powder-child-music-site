(function(){
  function initArtistPanels(){
    document.querySelectorAll('.artist-terms--disclosure').forEach(function(form){
      var details = form.querySelector('details');
      var summary = details ? details.querySelector('summary') : null;
      if (!summary) summary = form.querySelector('.artist-terms__trigger') || form.querySelector('button');
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
      var originalSummaryText = summary.textContent.trim();
      try { summary.dataset.orig = originalSummaryText; } catch (e) {}

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

    document.addEventListener('click', function(e){
      var toggle = e.target.closest && e.target.closest('.artist-toggle');
      if (!toggle) return;
      e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      try {
        var url = new URL(window.location.href);
        var isOnNow = url.searchParams.get('includes_equipment') !== null;
        if (isOnNow) {
          url.searchParams.delete('includes_equipment');
        } else {
          url.searchParams.set('includes_equipment', 'true');
        }
        var href = url.href;

        toggle.classList.add('is-loading');

        fetch(href, { method: 'GET', credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(function(resp){ if (!resp.ok) throw new Error('Network error'); return resp.text(); })
          .then(function(html){
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var newResults = doc.querySelector('.results');
            var curResults = document.querySelector('.results');
            if (newResults && curResults) {
              curResults.parentNode.replaceChild(newResults, curResults);
              history.pushState(null, '', href);
            } else {
              // fallback to full page reload
              window.location.href = href;
              return;
            }

            // update toggle active state based on new URL param
            var nowOn = (new URL(href)).searchParams.get('includes_equipment') !== null;
            document.querySelectorAll('.artist-toggle').forEach(function(t){
              if (nowOn) t.classList.add('is-active'); else t.classList.remove('is-active');
              t.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
              // update href attribute to reflect new state for non-JS fallbacks
              try { t.href = href; } catch (e) {}
            });

          })
          .catch(function(){ window.location.href = href; })
            .finally(function(){ toggle.classList.remove('is-loading'); });
        } catch (err) {
          return;
        }
      }, true); 

      function neutralizeArtistToggles(){
        document.querySelectorAll('.artist-toggle').forEach(function(t){
          try{
            var h = t.getAttribute('href');
            if (h) t.dataset.origHref = h;
            t.setAttribute('href', '#');
          } catch (e) { /* ignore */ }
        });
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', neutralizeArtistToggles);
      } else {
        neutralizeArtistToggles();
      }
        var desiredWidth = Math.max(260, Math.min(400, Math.round(r.width))); 
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
        var applyBtn = this;
        var sample = list.querySelector('input[name]');
        if (!sample) { closePanel(); return; }
        var key = sample.name; // may include []

        var checked = Array.from(list.querySelectorAll('input:checked')).map(function(ci){ return ci.value; });

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

        // show loading state
        var origText = applyBtn.textContent;
        applyBtn.disabled = true;
        applyBtn.textContent = 'Laddar...';

        fetch(url, { method: 'GET', credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(function(resp){ if (!resp.ok) throw new Error('Network error'); return resp.text(); })
          .then(function(html){
              try {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var newResults = doc.querySelector('.results');
                var curResults = document.querySelector('.results');
                if (newResults && curResults) {
                  curResults.parentNode.replaceChild(newResults, curResults);
                } else {
                  // fallback: reload page
                  window.location.href = url; return;
                }
                // update URL without reloading
                history.pushState(null, '', url);
                // sync checked state back to the original inputs in the form
                // uncheck all original inputs first
                var origInputs = form.querySelectorAll('input[name]');
                origInputs.forEach(function(oi){
                  if (oi.type === 'checkbox' || oi.type === 'radio') oi.checked = false;
                  else oi.value = '';
                });
                // set checked for matching values
                checked.forEach(function(val){
                  var match = form.querySelectorAll('input[name="' + key + '"][value="' + CSS.escape(val) + '"]');
                  if (match && match.length) {
                    match.forEach(function(m){ if (m.type==='checkbox' || m.type==='radio') m.checked = true; else m.value = val; });
                  } else {
                    var sel = form.querySelector('select[name="' + key + '"]');
                    if (sel) {
                      Array.from(sel.options).forEach(function(o){ o.selected = (o.value === val); });
                    }
                  }
                });

                // update the disclosure summary text to show count
                if (summary) {
                  var base = summary.dataset.orig || originalSummaryText || '';
                  var count = checked.length;
                  summary.textContent = base + (count > 0 ? ' (' + count + ')' : '');
                }

                // close panel
                closePanel();
              } catch (err) {
                console.error(err);
                window.location.href = url;
              }
          })
          .catch(function(){ window.location.href = url; })
          .finally(function(){ applyBtn.disabled = false; applyBtn.textContent = origText; });
      });

      // close on outside click
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

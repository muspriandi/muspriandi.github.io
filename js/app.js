/* ============================================================
 * App logic — one page, two modes:
 *
 *   1. Casual UI    — no query params: renders an encode/decode
 *                     card per section for humans.
 *
 *   2. Automation   — with query params, returns JSON only:
 *        index.html?type=<catalogcategory|item|variant>
 *                  &action=<enc|dec>
 *                  &value=<numbers or id>
 *      The JSON is written to the page body AND exposed as
 *      window.__sqidsResult so headless browsers can read it.
 *
 * Depends on: SECTIONS (js/config.js) and Sqids (js/sqids.js).
 * ============================================================ */
(function () {
  var container = document.getElementById('sections');

  function setResult(el, copyBtn, text, state) {
    el.textContent = text;
    el.classList.toggle('empty', state === 'empty');
    el.classList.toggle('error', state === 'error');
    copyBtn.hidden = state !== 'ok';
  }

  function parseNumbers(raw) {
    var parts = raw.split(/[\s,;]+/).filter(Boolean);
    var numbers = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^\d+$/.test(parts[i])) {
        throw new Error('"' + parts[i] + '" is not a non-negative integer');
      }
      var n = Number(parts[i]);
      if (!Number.isSafeInteger(n)) {
        throw new Error('"' + parts[i] + '" exceeds the maximum safe integer (' + Number.MAX_SAFE_INTEGER + ')');
      }
      numbers.push(n);
    }
    return numbers;
  }

  function sectionKey(name) {
    return name.toLowerCase().replace(/[\s_-]/g, '');
  }

  /* ----------------------------------------------------------
   * Automation mode
   * ---------------------------------------------------------- */
  function runHeadless(params) {
    var typeRaw = params.get('type');
    var actionRaw = params.get('action');
    var value = params.get('value');

    var out = { type: typeRaw, action: actionRaw, value: value, ok: false };
    try {
      var key = sectionKey(typeRaw || '');
      var sqids;
      if (key === 'custom') {
        // type=custom: alphabet & minlength come from the query, not SECTIONS.
        var options = {};
        var customAlphabet = params.get('alphabet');
        if (customAlphabet) options.alphabet = customAlphabet;
        var customMin = parseInt(params.get('minlength'), 10);
        if (!isNaN(customMin) && customMin > 0) options.minLength = customMin;
        out.alphabet = options.alphabet || '(default)';
        out.minLength = options.minLength || 0;
        sqids = new Sqids(options);
      } else {
        var section = SECTIONS.filter(function (s) { return sectionKey(s.name) === key; })[0];
        if (!section) {
          throw new Error('Unknown type "' + typeRaw + '". Expected one of: custom, ' +
            SECTIONS.map(function (s) { return sectionKey(s.name); }).join(', '));
        }
        sqids = new Sqids({ alphabet: section.alphabet, minLength: section.minLength });
      }

      if (value === null || value === '') throw new Error('Missing "value" parameter');

      var act = (actionRaw || '').toLowerCase();
      if (act === 'enc' || act === 'encode') {
        var numbers = parseNumbers(value);
        if (numbers.length === 0) throw new Error('No numbers provided to encode');
        out.action = 'enc';
        out.numbers = numbers;
        out.result = sqids.encode(numbers);
        out.ok = true;
      } else if (act === 'dec' || act === 'decode') {
        var decoded = sqids.decode(value);
        if (decoded.length === 0) {
          throw new Error('"' + value + '" is not a valid ID for type ' + section.name);
        }
        out.action = 'dec';
        out.result = decoded;
        out.canonical = sqids.encode(decoded) === value;
        out.ok = true;
      } else {
        throw new Error('Unknown action "' + actionRaw + '". Expected enc or dec.');
      }
    } catch (e) {
      out.ok = false;
      out.error = e.message;
    }

    window.__sqidsResult = out;
    var json = JSON.stringify(out, null, 2);
    document.title = (out.ok ? 'OK' : 'ERROR') + ' — Sqids Automation';
    document.body.innerHTML =
      '<pre id="output" class="json-output">' +
      json.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>';
    return out;
  }

  // Branch: automation mode short-circuits the UI.
  var params = new URLSearchParams(window.location.search);
  if (params.has('type') || params.has('action') || params.has('value')) {
    runHeadless(params);
    return;
  }

  /* ----------------------------------------------------------
   * Casual UI mode
   * ---------------------------------------------------------- */
  function bindCopy(button, resultEl) {
    button.addEventListener('click', function () {
      var text = resultEl.textContent.split('  (non-canonical')[0];
      navigator.clipboard.writeText(text).then(function () {
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(function () {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 1500);
      });
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function buildPane(labelText, placeholder, resultPlaceholder) {
    var pane = el('div');
    pane.appendChild(el('p', 'pane-label', labelText));
    var input = document.createElement('input');
    input.type = 'text';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.placeholder = placeholder;
    pane.appendChild(input);
    var row = el('div', 'result-row');
    var result = el('div', 'result empty', resultPlaceholder);
    var copy = el('button', 'copy', 'Copy');
    copy.hidden = true;
    row.appendChild(result);
    row.appendChild(copy);
    pane.appendChild(row);
    bindCopy(copy, result);
    return { pane: pane, input: input, result: result, copy: copy };
  }

  SECTIONS.forEach(function (section) {
    var sqids;
    var configError = null;
    try {
      sqids = new Sqids({ alphabet: section.alphabet, minLength: section.minLength });
    } catch (e) {
      configError = e.message;
    }

    var card = el('div', 'card');
    card.style.setProperty('--section-color', section.color);

    var header = el('div', 'section-header');
    header.appendChild(el('h2', null, section.name));
    header.appendChild(el('span', 'section-config',
      'minLength: ' + section.minLength + ' · alphabet: ' + section.alphabet.slice(0, 12) + '…'));
    card.appendChild(header);

    if (configError) {
      var err = el('div', 'result error', 'Invalid config for this section: ' + configError);
      card.appendChild(err);
      container.appendChild(card);
      return;
    }

    var panes = el('div', 'panes');
    var enc = buildPane('Encode — numbers → ID', 'e.g. 12', 'ID appears here');
    var dec = buildPane('Decode — ID → numbers', 'e.g. ' + sqids.encode([12]), 'Numbers appear here');
    panes.appendChild(enc.pane);
    panes.appendChild(dec.pane);
    card.appendChild(panes);
    container.appendChild(card);

    enc.input.addEventListener('input', function () {
      var raw = enc.input.value.trim();
      if (!raw) {
        setResult(enc.result, enc.copy, 'ID appears here', 'empty');
        return;
      }
      try {
        var id = sqids.encode(parseNumbers(raw));
        setResult(enc.result, enc.copy, id, 'ok');
      } catch (e) {
        setResult(enc.result, enc.copy, e.message, 'error');
      }
    });

    dec.input.addEventListener('input', function () {
      var raw = dec.input.value.trim();
      if (!raw) {
        setResult(dec.result, dec.copy, 'Numbers appear here', 'empty');
        return;
      }
      try {
        var numbers = sqids.decode(raw);
        if (numbers.length === 0) {
          setResult(dec.result, dec.copy, 'Not a valid ID for this section’s alphabet', 'error');
          return;
        }
        // Round-trip check: a canonical ID re-encodes to itself
        var canonical = sqids.encode(numbers);
        var text = numbers.join(', ');
        if (canonical !== raw) {
          text += '  (non-canonical: re-encodes to "' + canonical + '")';
        }
        setResult(dec.result, dec.copy, text, 'ok');
      } catch (e) {
        setResult(dec.result, dec.copy, e.message, 'error');
      }
    });
  });

  /* ----------------------------------------------------------
   * Custom section — user supplies alphabet + min length live.
   * Matches automation type=custom (&alphabet=&minlength=).
   * ---------------------------------------------------------- */
  (function buildCustomCard() {
    var card = el('div', 'card');
    card.style.setProperty('--section-color', '#7c3aed'); // violet

    var header = el('div', 'section-header');
    header.appendChild(el('h2', null, 'Custom'));
    header.appendChild(el('span', 'section-config', 'set your own alphabet & min length'));
    card.appendChild(header);

    function field(labelText, placeholder, numeric) {
      var wrap = el('div');
      wrap.appendChild(el('p', 'pane-label', labelText));
      var input = document.createElement('input');
      input.type = 'text';
      input.spellcheck = false;
      input.autocomplete = 'off';
      input.placeholder = placeholder;
      if (numeric) input.inputMode = 'numeric';
      wrap.appendChild(input);
      return { wrap: wrap, input: input };
    }

    var cfg = el('div', 'custom-config');
    var alpha = field('Alphabet (blank = default)',
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', false);
    var minLen = field('Min length', '0', true);
    cfg.appendChild(alpha.wrap);
    cfg.appendChild(minLen.wrap);
    card.appendChild(cfg);

    var cfgError = el('div', 'result error');
    cfgError.hidden = true;
    cfgError.style.marginTop = '0.6rem';
    card.appendChild(cfgError);

    var panes = el('div', 'panes');
    var enc = buildPane('Encode — numbers → ID', 'e.g. 1, 2, 3', 'ID appears here');
    var dec = buildPane('Decode — ID → numbers', 'paste an ID', 'Numbers appear here');
    panes.appendChild(enc.pane);
    panes.appendChild(dec.pane);
    card.appendChild(panes);
    container.appendChild(card);

    function buildSqids() {
      var options = {};
      var a = alpha.input.value.trim();
      if (a) options.alphabet = a;
      var ml = parseInt(minLen.input.value, 10);
      if (!isNaN(ml) && ml > 0) options.minLength = ml;
      return new Sqids(options);
    }

    function refresh() {
      var sqids;
      try {
        sqids = buildSqids();
        cfgError.hidden = true;
      } catch (e) {
        cfgError.textContent = 'Invalid config: ' + e.message;
        cfgError.hidden = false;
        setResult(enc.result, enc.copy, 'Fix the config above', 'empty');
        setResult(dec.result, dec.copy, 'Fix the config above', 'empty');
        return;
      }

      var rawE = enc.input.value.trim();
      if (!rawE) {
        setResult(enc.result, enc.copy, 'ID appears here', 'empty');
      } else {
        try {
          setResult(enc.result, enc.copy, sqids.encode(parseNumbers(rawE)), 'ok');
        } catch (e) {
          setResult(enc.result, enc.copy, e.message, 'error');
        }
      }

      var rawD = dec.input.value.trim();
      if (!rawD) {
        setResult(dec.result, dec.copy, 'Numbers appear here', 'empty');
      } else {
        try {
          var numbers = sqids.decode(rawD);
          if (numbers.length === 0) {
            setResult(dec.result, dec.copy, 'Not a valid ID for this alphabet', 'error');
          } else {
            var canonical = sqids.encode(numbers);
            var text = numbers.join(', ');
            if (canonical !== rawD) {
              text += '  (non-canonical: re-encodes to "' + canonical + '")';
            }
            setResult(dec.result, dec.copy, text, 'ok');
          }
        } catch (e) {
          setResult(dec.result, dec.copy, e.message, 'error');
        }
      }
    }

    alpha.input.addEventListener('input', refresh);
    minLen.input.addEventListener('input', refresh);
    enc.input.addEventListener('input', refresh);
    dec.input.addEventListener('input', refresh);
  })();
})();

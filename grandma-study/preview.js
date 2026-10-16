/* Preview adapter only. study.js remains the exact editable CHS source. */
(function () {
  'use strict';
  var button = document.getElementById('start-preview');
  var errorBox = document.getElementById('preview-error');
  var parameters = new URLSearchParams(window.location.search);
  var release = parameters.get('release');
  var seed = parameters.get('seed') || String(Date.now());
  var requestedStart = Number(parameters.get('startAt'));
  var startAt = Number.isInteger(requestedStart) && requestedStart >= 1 && requestedStart <= 64
    ? requestedStart : null;
  var sourcePath = 'study.js';
  window.GRANDMA_RESEARCHER_PREVIEW = true;
  window.GRANDMA_PREVIEW_START_AT = startAt;

  function seededRandom(seedText) {
    var state = 2166136261;
    for (var i = 0; i < seedText.length; i++) {
      state ^= seedText.charCodeAt(i);
      state = Math.imul(state, 16777619);
    }
    if (!state) { state = 1; }
    return function () {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  window.GRANDMA_PREVIEW_RESTART_AT = function (slideNumber) {
    var target = Math.max(1, Math.min(64, Math.floor(Number(slideNumber) || 1)));
    var url = new URL(window.location.href);
    url.searchParams.set('startAt', String(target));
    url.searchParams.set('seed', seed);
    window.location.assign(url.href);
  };

  if (release) {
    if (!/^grandma-v[0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(release)) {
      button.disabled = true;
      errorBox.textContent = 'This release name is not valid. Return to the study workspace and choose a release.';
      return;
    }
    sourcePath = 'releases/' + release + '.js';
  }
  document.getElementById('restart-preview').addEventListener('click', function () {
    var url = new URL(window.location.href);
    url.searchParams.delete('startAt');
    url.searchParams.set('seed', seed);
    window.location.assign(url.href);
  });

  button.addEventListener('click', function () {
    button.disabled = true;
    if (typeof window.initJsPsych !== 'function' || typeof window.jsPsychHtmlButtonResponse !== 'function' || typeof window.jsPsychSurveyText !== 'function') {
      errorBox.textContent = 'The preview libraries could not load. Check your connection and restart the preview.';
      return;
    }
    var realInit = window.initJsPsych;
    // The original code declares CHS trial types before assembling its timeline.
    // Placeholders let it assemble unchanged; these nodes never enter the preview.
    function ChsOnlyTrial() {}
    window.chsRecord = {
      VideoConfigPlugin: ChsOnlyTrial,
      VideoConsentPlugin: ChsOnlyTrial,
      StartRecordPlugin: ChsOnlyTrial,
      StopRecordPlugin: ChsOnlyTrial
    };
    window.chsSurvey = { ExitSurveyPlugin: ChsOnlyTrial };

    function previewTimeline(nodes) {
      return nodes.reduce(function (result, node) {
        if (node.type === ChsOnlyTrial) return result;
        if (Array.isArray(node.timeline)) {
          var children = previewTimeline(node.timeline);
          if (children.length) result.push(Object.assign({}, node, {timeline:children}));
        } else { result.push(node); }
        return result;
      }, []);
    }

    window.initJsPsych = function (options) {
      var previewOptions = Object.assign({}, options, {display_element:'jspsych-target'});
      var instance = realInit(previewOptions);
      var realRun = instance.run.bind(instance);
      instance.run = function (nodes) {
        document.getElementById('preview-start').hidden = true;
        return realRun(previewTimeline(nodes));
      };
      return instance;
    };

    var script = document.createElement('script');
    script.src = release ? sourcePath : sourcePath + '?preview=' + Date.now();
    var nativeRandom = Math.random;
    Math.random = seededRandom(seed);
    script.onload = function () { Math.random = nativeRandom; };
    script.onerror = function () {
      Math.random = nativeRandom;
      errorBox.textContent = 'The study source could not load. Return to the workspace and check that this release exists.';
      document.getElementById('preview-start').hidden = false;
    };
    window.addEventListener('error', function (event) {
      if (event.filename && /study\.js|grandma-v/.test(event.filename)) {
        errorBox.textContent = 'The study could not start: ' + event.message;
        document.getElementById('preview-start').hidden = false;
      }
    });
    document.head.appendChild(script);
  }, {once:true});

  if (startAt !== null) { button.click(); }
})();

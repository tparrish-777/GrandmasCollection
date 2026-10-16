/* Preview adapter only. study.js remains the exact editable CHS source. */
(function () {
  'use strict';
  var button = document.getElementById('start-preview');
  var errorBox = document.getElementById('preview-error');
  var parameters = new URLSearchParams(window.location.search);
  var release = parameters.get('release');
  var sourcePath = 'study.js';
  if (release) {
    if (!/^grandma-v[0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(release)) {
      button.disabled = true;
      errorBox.textContent = 'This release name is not valid. Return to the study workspace and choose a release.';
      return;
    }
    sourcePath = 'releases/' + release + '.js';
  }
  document.getElementById('restart-preview').addEventListener('click', function () { window.location.reload(); });

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
    script.src = sourcePath;
    script.onerror = function () {
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
})();

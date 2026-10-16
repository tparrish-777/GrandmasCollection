/*
  Grandma Study — CHS jsPsych wrapper with recording.
  Child-facing screens use a game-like, colorful UI.

  CROSS-PLATFORM IMAGE RELIABILITY:
  • A preconnect link warms up the CDN connection the moment the
    script loads, before any image requests fire.
  • All images are loaded via new Image() immediately after FAMILIES
    is defined — the browser caches everything during consent and
    webcam setup so no trial ever has a blank image.
  • Every <img> tag carries loading="eager" and an onerror fallback
    that swaps in a placeholder SVG instead of a broken icon.
  • CSS includes -webkit- prefixes so Safari animations work on Mac.
  • prefers-reduced-motion removes animations for accessibility.
  • A dedicated preloadTrial shows a progress bar and auto-advances
    when all images are cached, with a 12-second safety timeout.

  COUNTERBALANCING (4 conditions, randomly assigned per session):
    Condition A (0): Q1 (who is grandma?) first | original image sides
    Condition B (1): Q1 first                   | flipped  image sides
    Condition C (2): Q2 (which house?) first     | original image sides
    Condition D (3): Q2 first                    | flipped  image sides

  Within each condition:
    Set 1 families (Lisa Sophia Lucy Lauren) are shuffled randomly
    Set 2 families (Maisy Kylie Amanda Olivia) are shuffled randomly
    Which set appears first is also randomised
*/

// ================================================================
// WARM UP THE CDN CONNECTION IMMEDIATELY
// ================================================================
(function() {
  var pc       = document.createElement('link');
  pc.rel       = 'preconnect';
  pc.href      = 'https://raw.githubusercontent.com';
  pc.crossOrigin = 'anonymous';
  document.head.appendChild(pc);
})();

// ================================================================
// CHS WEBCAM MIRROR FIX
// ================================================================
var consentPlaybackStyle = document.createElement("style");
consentPlaybackStyle.textContent =
  "div#consent-video-trial video.webcam-feed[controls]," +
  "div#consent-video-trial video.webcam-feed[data-chs-playback-video='true'] {" +
  " transform: rotateY(0deg) !important;" +
  " direction: ltr !important;" +
  "}" +
  "div#consent-video-trial #lookit-jspsych-video-container:has(video.webcam-feed[controls])," +
  "div#consent-video-trial #lookit-jspsych-video-container:has(video.webcam-feed[data-chs-playback-video='true']) {" +
  " transform: none !important;" +
  " direction: ltr !important;" +
  "}";
document.head.appendChild(consentPlaybackStyle);

function normalizeConsentPlaybackVideo(video) {
  if (!video || !video.matches || !video.matches("video.webcam-feed")) return;
  var isPlayback = video.hasAttribute("controls") || video.controls || !!video.getAttribute("src");
  if (!isPlayback) return;
  video.setAttribute("data-chs-playback-video", "true");
  video.style.setProperty("transform", "rotateY(0deg)", "important");
  video.style.setProperty("direction", "ltr", "important");
  var container = video.parentElement;
  if (container && container.id === "lookit-jspsych-video-container") {
    container.style.setProperty("transform", "none", "important");
    container.style.setProperty("direction", "ltr", "important");
  }
}

function normalizeConsentPlaybackVideos() {
  Array.prototype.forEach.call(
    document.querySelectorAll("div#consent-video-trial video.webcam-feed"),
    normalizeConsentPlaybackVideo
  );
}

var consentPlaybackObserver = new MutationObserver(function(mutations) {
  normalizeConsentPlaybackVideos();
  mutations.forEach(function(mutation) {
    if (mutation.type === "attributes") {
      normalizeConsentPlaybackVideo(mutation.target);
    }
    Array.prototype.forEach.call(mutation.addedNodes || [], function(node) {
      if (!node || node.nodeType !== 1) return;
      normalizeConsentPlaybackVideo(node);
      if (node.querySelectorAll) {
        Array.prototype.forEach.call(
          node.querySelectorAll("video.webcam-feed"),
          normalizeConsentPlaybackVideo
        );
      }
    });
  });
});
consentPlaybackObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["controls", "src", "class", "style"],
  childList: true,
  subtree: true
});
normalizeConsentPlaybackVideos();

// ================================================================
// URL / CHS HELPERS
// ================================================================
function getUrlParam(name) {
  try {
    return new URLSearchParams(window.location.search).get(name) || "";
  } catch (e) {
    return "";
  }
}

function getChsResponseId() {
  var responseFromQuery = getUrlParam("response_uuid") || getUrlParam("response");
  if (responseFromQuery) return responseFromQuery;
  var parts = window.location.pathname.split("/");
  var previewIndex = parts.indexOf("preview");
  if (previewIndex > 0) return parts[previewIndex - 1] || "";
  return "";
}

function getChsChildId() {
  return getUrlParam("child") || "";
}

var chsResponseId = getChsResponseId();
var chsChildId    = getChsChildId();

// ================================================================
// GAME COLOR PALETTES
// ================================================================
var FAMILY_PALETTE = [
  { bg: '#fff0f3', accent: '#ff6b6b', grad: 'linear-gradient(135deg,#ff8a80,#e53935)' },
  { bg: '#fffde7', accent: '#f59e0b', grad: 'linear-gradient(135deg,#ffd54f,#ff8f00)' },
  { bg: '#f1f8e9', accent: '#66bb6a', grad: 'linear-gradient(135deg,#a5d6a7,#2e7d32)' },
  { bg: '#e3f2fd', accent: '#42a5f5', grad: 'linear-gradient(135deg,#90caf9,#1565c0)' },
  { bg: '#f3e5f5', accent: '#ab47bc', grad: 'linear-gradient(135deg,#ce93d8,#6a1b9a)' },
  { bg: '#fff3e0', accent: '#f97316', grad: 'linear-gradient(135deg,#ffcc80,#e65100)' },
  { bg: '#e0f7fa', accent: '#26c6da', grad: 'linear-gradient(135deg,#80deea,#00838f)' },
  { bg: '#fce4ec', accent: '#ec407a', grad: 'linear-gradient(135deg,#f48fb1,#880e4f)' }
];

// ================================================================
// CSS — game-like child-facing UI
// ================================================================
var grandmaStyle = document.createElement('style');
grandmaStyle.textContent =

  '@-webkit-keyframes mascot-bounce{' +
  '0%,100%{-webkit-transform:translateY(0);transform:translateY(0);}' +
  '50%{-webkit-transform:translateY(-14px);transform:translateY(-14px);}}' +
  '@keyframes mascot-bounce{' +
  '0%,100%{-webkit-transform:translateY(0);transform:translateY(0);}' +
  '50%{-webkit-transform:translateY(-14px);transform:translateY(-14px);}}' +

  '.gp-bar-outer{width:300px;height:20px;background:#e9ecef;' +
  'border-radius:10px;overflow:hidden;margin:0 auto;}' +
  '.gp-bar-inner{height:100%;width:0%;' +
  'background:-webkit-linear-gradient(left,#667eea,#764ba2);' +
  'background:linear-gradient(90deg,#667eea,#764ba2);' +
  'border-radius:10px;' +
  '-webkit-transition:width 0.35s ease;transition:width 0.35s ease;}' +

  '.game-progress{display:-webkit-flex;display:flex;-webkit-align-items:center;' +
  'align-items:center;-webkit-justify-content:space-between;' +
  'justify-content:space-between;padding:11px 22px;' +
  'border-radius:20px 20px 0 0;color:#fff;font-family:Arial,sans-serif;}' +
  '.progress-stars{display:-webkit-flex;display:flex;gap:3px;font-size:16px;line-height:1;}' +
  '.progress-label{font-size:13px;font-weight:700;opacity:0.95;' +
  'text-transform:uppercase;letter-spacing:0.04em;}' +
  '.progress-slide{font-size:13px;font-weight:700;opacity:0.95;' +
  'text-transform:uppercase;letter-spacing:0.04em;min-width:96px;text-align:right;}' +
  '.progress-emoji{font-size:22px;}' +
  '.progress-dots{display:-webkit-flex;display:flex;gap:7px;' +
  '-webkit-align-items:center;align-items:center;}' +
  '.pdot{width:12px;height:12px;border-radius:50%;' +
  'background:rgba(255,255,255,0.4);' +
  'box-shadow:0 0 0 2px rgba(255,255,255,0.35);}' +
  '.pdot-done{background:#fff;box-shadow:0 0 0 2px rgba(255,255,255,0.55);}' +
  '.pdot-now{width:17px;height:17px;background:#fff;' +
  'box-shadow:0 0 0 3px rgba(255,255,255,0.65);}' +

  '.story-card{background:#fff;border-radius:0 0 24px 24px;' +
  'padding:24px 30px 30px;' +
  'box-shadow:0 12px 40px rgba(0,0,0,0.12);text-align:center;}' +

  '.trial-image{max-width:880px;max-height:62vh;display:block;margin:0 auto;' +
  'object-fit:contain;border-radius:18px;' +
  'box-shadow:0 8px 28px rgba(0,0,0,0.13);border:4px solid #f0f0f0;}' +

  '.replay-btn{display:-webkit-inline-flex;display:inline-flex;' +
  '-webkit-align-items:center;align-items:center;gap:8px;' +
  'background:-webkit-linear-gradient(135deg,#f093fb 0%,#f5576c 100%);' +
  'background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);' +
  'color:#fff;border:none;border-radius:30px;padding:10px 26px;' +
  'margin:14px 4px 6px;font-size:16px;font-weight:700;cursor:pointer;' +
  'box-shadow:0 4px 15px rgba(245,87,108,0.4);' +
  '-webkit-transition:transform 0.15s,box-shadow 0.15s;' +
  'transition:-webkit-transform 0.15s,transform 0.15s,box-shadow 0.15s;}' +
  '.replay-btn:hover{' +
  '-webkit-transform:translateY(-2px);transform:translateY(-2px);' +
  'box-shadow:0 6px 20px rgba(245,87,108,0.5);}' +
  '.replay-btn:active{-webkit-transform:scale(0.97);transform:scale(0.97);}' +

  '.parent-note{background:#fff8e1;border:2px dashed #ffca28;border-radius:12px;' +
  'padding:14px 24px;margin:10px auto 0;max-width:960px;font-size:25px;font-weight:700;' +
  'text-align:left;color:#333;line-height:1.4;font-family:Arial,sans-serif;}' +

  '.pick-hint{background:#f0f7ff;border:2px solid #bfdbfe;border-radius:12px;' +
  'padding:8px 18px;display:inline-block;margin:4px auto 8px;' +
  'font-size:20px;font-weight:700;color:#1e40af;font-family:Arial,sans-serif;}' +

  '.choice-img-btn{width:auto;height:clamp(180px,32vh,360px);' +
  'object-fit:contain;cursor:pointer;' +
  'border:6px solid #e9ecef;border-radius:22px;background:#fafafa;padding:8px;display:block;' +
  '-webkit-transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);' +
  'transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);' +
  'box-shadow:0 6px 20px rgba(0,0,0,0.08);}' +
  '.choice-img-btn:hover{border-color:#a5b4fc;' +
  '-webkit-transform:translateY(-5px) scale(1.02);' +
  'transform:translateY(-5px) scale(1.02);' +
  'box-shadow:0 14px 35px rgba(99,102,241,0.22);}' +

  '.choice-cell{display:-webkit-inline-flex;display:inline-flex;' +
  '-webkit-flex-direction:column;flex-direction:column;' +
  '-webkit-align-items:center;align-items:center;cursor:pointer;' +
  '-webkit-transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);' +
  'transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);}' +
  '.choice-cell:hover{-webkit-transform:translateY(-5px) scale(1.02);' +
  'transform:translateY(-5px) scale(1.02);}' +
  '.choice-cell:hover .choice-frame{border-color:#a5b4fc;' +
  'box-shadow:0 14px 35px rgba(99,102,241,0.22);}' +
  '.choice-frame{position:relative;height:clamp(180px,32vh,340px);' +
  'border:6px solid #e9ecef;border-radius:22px;background:#fafafa;padding:8px;' +
  'box-shadow:0 6px 20px rgba(0,0,0,0.08);' +
  '-webkit-transition:border-color 0.2s,box-shadow 0.2s;' +
  'transition:border-color 0.2s,box-shadow 0.2s;}' +
  '.choice-frame-img{height:100%;width:auto;display:block;border-radius:14px;}' +
  '.choice-shape-badge{position:absolute;left:12px;top:12px;width:26%;' +
  'aspect-ratio:1/1;pointer-events:none;}' +

  '.choice-house-btn{position:relative;display:-webkit-inline-flex;display:inline-flex;' +
  '-webkit-flex-direction:column;flex-direction:column;' +
  '-webkit-align-items:center;align-items:center;cursor:pointer;' +
  '-webkit-transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);' +
  'transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);}' +
  '.choice-house-btn svg{height:clamp(200px,34vh,360px) !important;width:auto;display:block;}' +
  '.choice-house-btn:hover{-webkit-transform:translateY(-5px) scale(1.02);' +
  'transform:translateY(-5px) scale(1.02);}' +
  '.choice-label{font-family:Arial,sans-serif;font-weight:800;color:#1a1a1a;' +
  'font-size:clamp(15px,2.2vh,22px);line-height:1.1;text-align:center;' +
  'text-shadow:0 0 3px #fff,0 0 3px #fff,0 1px 2px rgba(255,255,255,.95);}' +
  '.choice-house-btn .choice-label{margin-bottom:3px;}' +
  '.choice-cell .choice-label{margin-bottom:6px;}' +

  '.is-selected{opacity:1 !important;' +
  'box-shadow:0 0 0 5px rgba(67,97,238,0.3),0 14px 35px rgba(67,97,238,0.22) !important;' +
  '-webkit-transform:translateY(-8px) scale(1.05) !important;' +
  'transform:translateY(-8px) scale(1.05) !important;}' +
  '.choice-img-btn.is-selected{border-color:#4361ee !important;}' +
  '.choice-cell.is-selected .choice-frame{border-color:#4361ee !important;}' +
  '.is-unselected{opacity:0.38 !important;' +
  '-webkit-transform:scale(0.96) !important;transform:scale(0.96) !important;}' +
  '.choice-hl-active{z-index:2;' +
  '-webkit-animation:choicehl .7s ease-in-out infinite;animation:choicehl .7s ease-in-out infinite;}' +
  '.choice-hl-dim{opacity:0.30 !important;' +
  '-webkit-transform:scale(0.96);transform:scale(0.96);}' +
  '@-webkit-keyframes choicehl{0%,100%{box-shadow:0 0 0 6px #ff3b6b,0 0 26px 8px rgba(255,59,107,.55);}' +
  '50%{box-shadow:0 0 0 6px #ffd23b,0 0 16px 5px rgba(255,210,59,.5);}}' +
  '@keyframes choicehl{0%,100%{box-shadow:0 0 0 6px #ff3b6b,0 0 26px 8px rgba(255,59,107,.55);}' +
  '50%{box-shadow:0 0 0 6px #ffd23b,0 0 16px 5px rgba(255,210,59,.5);}}' +

  '#jspsych-html-button-response-btngroup button{' +
  'background:-webkit-linear-gradient(135deg,#667eea 0%,#764ba2 100%) !important;' +
  'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%) !important;' +
  'color:#fff !important;border:none !important;border-radius:30px !important;' +
  'padding:13px 42px !important;font-size:17px !important;font-weight:700 !important;' +
  'cursor:pointer !important;' +
  'box-shadow:0 6px 20px rgba(102,126,234,0.38) !important;' +
  '-webkit-transition:-webkit-transform 0.15s,box-shadow 0.15s !important;' +
  'transition:transform 0.15s,box-shadow 0.15s !important;' +
  'margin-top:18px !important;}' +
  '#jspsych-html-button-response-btngroup button:hover:not(:disabled){' +
  '-webkit-transform:translateY(-3px) !important;' +
  'transform:translateY(-3px) !important;' +
  'box-shadow:0 10px 28px rgba(102,126,234,0.5) !important;}' +
  '#jspsych-html-button-response-btngroup button:disabled{' +
  'background:-webkit-linear-gradient(135deg,#cbd5e1,#94a3b8) !important;' +
  'background:linear-gradient(135deg,#cbd5e1,#94a3b8) !important;' +
  'box-shadow:none !important;cursor:not-allowed !important;opacity:0.65 !important;}' +

  '.game-title-screen{min-height:82vh;display:-webkit-flex;display:flex;' +
  '-webkit-flex-direction:column;flex-direction:column;' +
  '-webkit-align-items:center;align-items:center;' +
  '-webkit-justify-content:center;justify-content:center;text-align:center;' +
  'background:-webkit-linear-gradient(145deg,#fff9c4 0%,#e0f7fa 50%,#f3e5f5 100%);' +
  'background:linear-gradient(145deg,#fff9c4 0%,#e0f7fa 50%,#f3e5f5 100%);' +
  'padding:40px 20px;border-radius:24px;' +
  'box-shadow:0 20px 60px rgba(0,0,0,0.11);font-family:Arial,sans-serif;}' +
  '.game-mascot{font-size:80px;display:block;margin-bottom:8px;' +
  '-webkit-animation:mascot-bounce 1.8s ease-in-out infinite;' +
  'animation:mascot-bounce 1.8s ease-in-out infinite;}' +
  '.game-title{font-size:44px;font-weight:900;color:#1a237e;' +
  'text-shadow:3px 3px 0 rgba(0,0,0,0.07);line-height:1.1;margin:0 0 6px;}' +
  '.game-subtitle{font-size:20px;color:#7c3aed;font-weight:700;margin:0 0 22px;}' +
  '.game-stars-row{font-size:34px;margin-bottom:20px;letter-spacing:5px;}' +
  '.game-parent-box{background:rgba(255,255,255,0.85);border:3px solid #fbbf24;' +
  'border-radius:18px;padding:18px 28px;max-width:520px;width:100%;' +
  'font-size:16px;line-height:1.65;color:#374151;margin-bottom:26px;' +
  'box-shadow:0 4px 16px rgba(0,0,0,0.07);text-align:left;}' +

  '@media (prefers-reduced-motion: reduce){' +
  '.game-mascot{-webkit-animation:none !important;animation:none !important;}' +
  '.choice-img-btn{-webkit-transition:border-color 0.1s,opacity 0.1s !important;' +
  'transition:border-color 0.1s,opacity 0.1s !important;}' +
  '.choice-img-btn:hover{-webkit-transform:none !important;transform:none !important;}' +
  '.is-selected{-webkit-transform:none !important;transform:none !important;}' +
  '.is-unselected{-webkit-transform:none !important;transform:none !important;}' +
  '.choice-cell:hover,.choice-house-btn:hover{' +
  '-webkit-transform:none !important;transform:none !important;}' +
  '.choice-hl-active{-webkit-animation:none !important;animation:none !important;' +
  'box-shadow:0 0 0 6px #ff3b6b !important;}' +
  '.replay-btn{-webkit-transition:none !important;transition:none !important;}' +
  '.replay-btn:hover{-webkit-transform:none !important;transform:none !important;}' +
  '#jspsych-html-button-response-btngroup button{' +
  '-webkit-transition:none !important;transition:none !important;}' +
  '#jspsych-html-button-response-btngroup button:hover:not(:disabled){' +
  '-webkit-transform:none !important;transform:none !important;}' +
  '.gp-bar-inner{-webkit-transition:none !important;transition:none !important;}' +
  '}' +

  // ----------------------------------------------------------------
  // TRIAL LAYOUT (fits on one screen, no scrolling)
  // The story/question screens are sized so everything — the "Slide N
  // of M" counter, the picture, the caption, and the Continue/Next
  // button — is visible at once without scrolling. The picture is
  // CAPPED (not stretched) so the screen never zooms in too far, which
  // keeps it simple for young children. Scoped to body.grandma-trial-
  // phase (toggled per trial in on_trial_start) so it only affects the
  // story/question trials, not consent/survey/debrief.
  // ----------------------------------------------------------------
  ':root{--admin-bar-h:0px;}' +

  'body.grandma-trial-phase{padding-top:var(--admin-bar-h);}' +
  'body.grandma-trial-phase .jspsych-content-wrapper{' +
  'justify-content:flex-start !important;align-items:stretch !important;}' +
  'body.grandma-trial-phase #jspsych-content{' +
  'max-width:100% !important;width:100% !important;padding:0 !important;}' +

  '.trial-viewport{box-sizing:border-box;width:100%;' +
  'display:-webkit-flex;display:flex;' +
  '-webkit-flex-direction:column;flex-direction:column;' +
  '-webkit-align-items:center;align-items:center;padding:0 14px;}' +
  '.trial-inner{width:100%;max-width:1040px;margin:0 auto;' +
  'display:-webkit-flex;display:flex;' +
  '-webkit-flex-direction:column;flex-direction:column;}' +
  '.story-card-fill{border-radius:0 0 24px 24px;padding:12px 26px 16px;}' +
  '.slide-image-wrap{display:-webkit-flex;display:flex;' +
  '-webkit-align-items:center;align-items:center;' +
  '-webkit-justify-content:center;justify-content:center;margin-bottom:4px;}' +
  '.slide-image-wrap .trial-image{max-width:100%;max-height:46vh;' +
  'width:auto;height:auto;margin:0;}' +
  '.choice-row-fill{display:-webkit-flex;display:flex;' +
  '-webkit-justify-content:center;justify-content:center;' +
  '-webkit-align-items:center;align-items:center;gap:64px;margin-top:2px;}' +
  '.slide-btn-row{-webkit-flex:0 0 auto;flex:0 0 auto;}' +

  // Character spotlight highlight (narrated slides)
  '.hl-holder{position:relative;display:-webkit-inline-box;display:inline-block;' +
  'line-height:0;width:-webkit-fit-content;width:fit-content;max-width:100%;' +
  'overflow:hidden;border-radius:18px;border:4px solid #f0f0f0;' +
  'box-shadow:0 8px 28px rgba(0,0,0,0.13);}' +
  '.hl-holder .trial-image{border:none !important;box-shadow:none !important;' +
  'border-radius:0 !important;max-height:46vh;}' +
  '.hl-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;}' +
  '.hl-shape{position:absolute;-webkit-transform:translate(-50%,-50%);' +
  'transform:translate(-50%,-50%);aspect-ratio:1/1;pointer-events:none;}' +
  '.hl-box{position:absolute;border:6px solid transparent;border-radius:12px;' +
  'box-sizing:border-box;opacity:0;' +
  '-webkit-transition:opacity .25s ease;transition:opacity .25s ease;}' +
  '.hl-box.hl-active{opacity:1;border-color:#ff3b6b;' +
  'box-shadow:0 0 0 3px rgba(255,255,255,.9),0 0 0 9999px rgba(15,18,30,.6);' +
  '-webkit-animation:hl-flash .7s ease-in-out infinite;' +
  'animation:hl-flash .7s ease-in-out infinite;}' +
  '@-webkit-keyframes hl-flash{0%,100%{border-color:#ff3b6b;}50%{border-color:#ffd23b;}}' +
  '@keyframes hl-flash{0%,100%{border-color:#ff3b6b;}50%{border-color:#ffd23b;}}' +
  '@media (prefers-reduced-motion: reduce){.hl-box.hl-active{' +
  '-webkit-animation:none !important;animation:none !important;' +
  'border-color:#ff3b6b !important;}}' +

  // ----------------------------------------------------------------
  // GROWN-UP HANDOFF (reward) SCREEN — shown right before the email page
  // ----------------------------------------------------------------
  '@-webkit-keyframes star-pop{0%{-webkit-transform:scale(0) rotate(-25deg);opacity:0;}' +
  '60%{-webkit-transform:scale(1.25) rotate(8deg);opacity:1;}' +
  '100%{-webkit-transform:scale(1) rotate(0);opacity:1;}}' +
  '@keyframes star-pop{0%{transform:scale(0) rotate(-25deg);opacity:0;}' +
  '60%{transform:scale(1.25) rotate(8deg);opacity:1;}' +
  '100%{transform:scale(1) rotate(0);opacity:1;}}' +
  '@-webkit-keyframes star-tw{0%,100%{-webkit-transform:scale(1);}50%{-webkit-transform:scale(1.14);}}' +
  '@keyframes star-tw{0%,100%{transform:scale(1);}50%{transform:scale(1.14);}}' +

  '.handoff-screen{min-height:calc(100vh - 96px);box-sizing:border-box;' +
  'display:-webkit-flex;display:flex;' +
  '-webkit-flex-direction:column;flex-direction:column;' +
  '-webkit-align-items:center;align-items:center;' +
  '-webkit-justify-content:center;justify-content:center;text-align:center;' +
  'padding:calc(24px + var(--admin-bar-h)) 22px 30px;font-family:Arial,sans-serif;' +
  'background:-webkit-linear-gradient(300deg,#fff7cf 0%,#ffe6f0 45%,#e5f3ff 100%);' +
  'background:linear-gradient(150deg,#fff7cf 0%,#ffe6f0 45%,#e5f3ff 100%);' +
  'border-radius:24px;}' +
  '.handoff-stars{display:-webkit-flex;display:flex;gap:10px;margin-bottom:8px;}' +
  '.handoff-stars span{font-size:56px;color:#ffc21f;line-height:1;' +
  'text-shadow:0 3px 0 rgba(0,0,0,.08);' +
  '-webkit-animation:star-pop .5s cubic-bezier(.2,1.4,.5,1) both,' +
  'star-tw 2.2s ease-in-out infinite .6s;' +
  'animation:star-pop .5s cubic-bezier(.2,1.4,.5,1) both,' +
  'star-tw 2.2s ease-in-out infinite .6s;}' +
  '.handoff-stars span:nth-child(2){-webkit-animation-delay:.12s,.72s;animation-delay:.12s,.72s;}' +
  '.handoff-stars span:nth-child(3){-webkit-animation-delay:.24s,.84s;animation-delay:.24s,.84s;}' +
  '.handoff-stars span:nth-child(4){-webkit-animation-delay:.36s,.96s;animation-delay:.36s,.96s;}' +
  '.handoff-stars span:nth-child(5){-webkit-animation-delay:.48s,1.08s;animation-delay:.48s,1.08s;}' +
  '.handoff-title{font-size:46px;font-weight:900;color:#1a237e;margin:6px 0 2px;' +
  'text-shadow:2px 2px 0 rgba(0,0,0,.06);}' +
  '.handoff-sub{font-size:24px;font-weight:700;color:#7c3aed;margin:0 0 18px;}' +
  '.handoff-msg{background:rgba(255,255,255,.92);border:3px solid #ffca28;' +
  'border-radius:18px;padding:20px 26px;max-width:580px;font-size:22px;' +
  'line-height:1.55;color:#374151;box-shadow:0 6px 18px rgba(0,0,0,.08);}' +

  '@media (prefers-reduced-motion: reduce){' +
  '.handoff-stars span{-webkit-animation:none !important;animation:none !important;' +
  'opacity:1 !important;}}' +

  // ADMIN: styles for the testing-only skip bar. REMOVE BEFORE LAUNCH.
  '#admin-skip-bar{position:fixed;top:0;left:0;right:0;z-index:2147483647;' +
  'display:none;gap:10px;align-items:center;justify-content:center;' +
  'flex-wrap:wrap;box-sizing:border-box;padding:8px 12px;background:#111;color:#fff;' +
  'font-family:monospace;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,.4);}' +
  '#admin-skip-bar button{background:#e63946;color:#fff;border:none;' +
  'border-radius:6px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:13px;}' +
  '#admin-skip-bar button:hover{background:#c92d3a;}' +
  '#admin-skip-bar button:disabled{opacity:.45;cursor:not-allowed;}' +
  '#admin-skip-bar button.admin-btn-alt{background:#2563eb;}' +
  '#admin-skip-bar button.admin-btn-alt:hover{background:#1d4ed8;}' +
  '#admin-skip-bar button.admin-btn-go{background:#16a34a;}' +
  '#admin-skip-bar button.admin-btn-go:hover{background:#15803d;}';

document.head.appendChild(grandmaStyle);

// ================================================================
// CHOICE HANDLER
// ================================================================
window.grandmaCurrentResponse = null;

window.grandmaHandleChoice = function(index) {
  window.grandmaCurrentResponse = index;
  var left  = document.getElementById('choice-img-0');
  var right = document.getElementById('choice-img-1');
  if (!left || !right) { return; }
  // Toggle generic modifiers so this works for image, shape-badge, and
  // house choice cells alike (base class preserved).
  left.classList.remove('is-selected', 'is-unselected', 'choice-hl-active', 'choice-hl-dim');
  right.classList.remove('is-selected', 'is-unselected', 'choice-hl-active', 'choice-hl-dim');
  if (index === 0) {
    left.classList.add('is-selected');  right.classList.add('is-unselected');
  } else {
    left.classList.add('is-unselected'); right.classList.add('is-selected');
  }
  var allBtns = document.querySelectorAll(
    '#jspsych-html-button-response-btngroup button'
  );
  if (allBtns && allBtns.length > 0) {
    allBtns[0].disabled = false;
  }
};

// ================================================================
// INITIALIZE jsPsych
// ================================================================
var jsPsych = initJsPsych({
  // Add a body class only while a story/question trial is on screen, so
  // the full-screen trial layout (see CSS) applies to those and nothing
  // else. Safe to keep for launch; it does nothing on non-story trials.
  on_trial_start: function(trial) {
    var st = (trial && trial.data && trial.data.slide_type) || '';
    var isStory = (st === 'narrated' || st === 'choice');
    if (document.body) {
      document.body.classList.toggle('grandma-trial-phase', isStory);
    }
  }
});

var timeline = [];

// ================================================================
// ADMIN / TESTING SKIP BAR  ──  REMOVE BEFORE LAUNCH
// ----------------------------------------------------------------
// To go live, delete/undo the ADMIN-tagged pieces:
//   • this whole block (bar + skip engine + helper functions)
//   • the `on_load: cameraTrialOnLoad` on videoConfig / videoConsent /
//     startRecording, and `on_finish: hideAdminBar` on startRecording
//   • the `on_load: stopRecordOnLoad` on stopRecording, `on_load:
//     wrapupPageOnLoad` on exitSurvey, and the ADMIN blocks inside
//     emailTrial.on_load and debrief.on_load
//   • the `adminMaybeAutoSkip()/showAdminBar('trial')` lines in the two
//     trial factories (harmless if left — they're typeof-guarded)
//   • the cameraSetup grouping + CAMERA_SKIPPED conditional in the
//     timeline section at the bottom
// The full-screen trial LAYOUT (grandma-trial-phase, on_trial_start,
// bigger captions) is NOT admin code — keep it for launch.
// ================================================================
window.CAMERA_SKIPPED = false;

(function buildAdminBar() {
  function attach() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', attach);
      return;
    }
    if (document.getElementById('admin-skip-bar')) { return; }

    var bar = document.createElement('div');
    bar.id = 'admin-skip-bar';
    bar.innerHTML =
      '<span style="opacity:.7;">ADMIN (remove before launch):</span>';

    // --- Button 1: skip camera setup (shown only during camera setup) ---
    var camBtn = document.createElement('button');
    camBtn.id = 'admin-btn-camera';
    camBtn.textContent = '\u23ED Skip camera setup';
    camBtn.onclick = function() {
      window.CAMERA_SKIPPED = true;
      hideAdminBar();
      // abortCurrentTimeline() only queues the skip; finishTrial() ends the
      // camera screen showing right now. Remaining camera trials also self-
      // skip via cameraTrialOnLoad, so this is robust across jsPsych versions.
      try {
        if (typeof jsPsych.abortCurrentTimeline === 'function') {
          jsPsych.abortCurrentTimeline();
        } else if (typeof jsPsych.endCurrentTimeline === 'function') {
          jsPsych.endCurrentTimeline();
        }
      } catch (e) { console.warn('[ADMIN] abortCurrentTimeline failed:', e); }
      try { jsPsych.finishTrial(); } catch (e) { console.warn('[ADMIN] finishTrial failed:', e); }
    };

    // --- Button 2: jump to the next family (start of the next 8-slide block) ---
    var famBtn = document.createElement('button');
    famBtn.id = 'admin-btn-family';
    famBtn.className = 'admin-btn-alt';
    famBtn.textContent = '\u23ED Next family';
    famBtn.onclick = function() { adminNextFamily(); };

    // --- Button 3: jump past the trials to the "get a grown-up" screen ---
    var endBtn = document.createElement('button');
    endBtn.id = 'admin-btn-end';
    endBtn.className = 'admin-btn-alt';
    endBtn.textContent = '\u23ED\u23ED Skip to grown-up screen';
    endBtn.onclick = function() { adminSkipToEnd(); };

    // --- Button 4: skip the current post-study page (email / exit survey) ---
    var pageBtn = document.createElement('button');
    pageBtn.id = 'admin-btn-page';
    pageBtn.className = 'admin-btn-go';
    pageBtn.textContent = '\u23ED Skip this page';
    pageBtn.onclick = function() { adminSkipThisPage(); };

    // Rewind controls are available only in the standalone preview. That
    // preview records no participant data and requests no camera access.
    var backBtn = document.createElement('button');
    backBtn.id = 'admin-btn-back';
    backBtn.className = 'admin-btn-alt';
    backBtn.textContent = '\u2190 Back one story screen';
    backBtn.onclick = function() {
      var d = (jsPsych.getCurrentTrial && jsPsych.getCurrentTrial().data) || {};
      if (typeof window.GRANDMA_PREVIEW_RESTART_AT === 'function' &&
          typeof d.slide_number === 'number' && d.slide_number > 1) {
        window.GRANDMA_PREVIEW_RESTART_AT(d.slide_number - 1);
      }
    };

    var startBtn = document.createElement('button');
    startBtn.id = 'admin-btn-start';
    startBtn.className = 'admin-btn-go';
    startBtn.textContent = '\u21BA Start from beginning';
    startBtn.onclick = function() {
      if (typeof window.GRANDMA_PREVIEW_RESTART_AT === 'function') {
        window.GRANDMA_PREVIEW_RESTART_AT(1);
      }
    };

    bar.appendChild(camBtn);
    bar.appendChild(famBtn);
    bar.appendChild(endBtn);
    bar.appendChild(pageBtn);
    if (typeof window.GRANDMA_PREVIEW_RESTART_AT === 'function') bar.appendChild(backBtn);
    if (typeof window.GRANDMA_PREVIEW_RESTART_AT === 'function') bar.appendChild(startBtn);

    document.body.appendChild(bar);
  }
  attach();
})();

// Shows the bar in one of three modes:
//   'camera' -> only the "Skip camera setup" button
//   'trial'  -> "Next family" + "Skip to grown-up screen"
//   'page'   -> "Skip this page" (for the grown-up / email / exit-survey pages)
// Also sets --admin-bar-h so the trial layout leaves room for the bar.
function showAdminBar(mode) {
  var b = document.getElementById('admin-skip-bar');
  if (!b) { return; }
  b.style.display = 'flex';
  document.documentElement.style.setProperty('--admin-bar-h', '44px');
  var cam  = document.getElementById('admin-btn-camera');
  var fam  = document.getElementById('admin-btn-family');
  var end  = document.getElementById('admin-btn-end');
  var page = document.getElementById('admin-btn-page');
  var back = document.getElementById('admin-btn-back');
  var start = document.getElementById('admin-btn-start');
  var isPreview = window.GRANDMA_RESEARCHER_PREVIEW === true;
  var d = (jsPsych.getCurrentTrial && jsPsych.getCurrentTrial().data) || {};
  if (cam)  { cam.style.display  = (mode === 'camera') ? 'inline-block' : 'none'; }
  if (fam)  { fam.style.display  = (mode === 'trial')  ? 'inline-block' : 'none'; }
  if (end)  {
    end.style.display = (mode === 'trial') ? 'inline-block' : 'none';
    if (isPreview) { end.textContent = '\u23ED\u23ED Skip to debrief'; }
  }
  if (page) { page.style.display = (mode === 'page')   ? 'inline-block' : 'none'; }
  if (back) {
    back.style.display = (isPreview && mode === 'trial') ? 'inline-block' : 'none';
    back.disabled = !(isPreview && mode === 'trial' &&
      typeof d.slide_number === 'number' && d.slide_number > 1);
  }
  if (start) { start.style.display = (isPreview && mode === 'trial') ? 'inline-block' : 'none'; }
  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(function () {
      if (b && b.style.display !== 'none') {
        document.documentElement.style.setProperty('--admin-bar-h', b.offsetHeight + 'px');
      }
    });
  }
}
function hideAdminBar() {
  var b = document.getElementById('admin-skip-bar');
  if (b) { b.style.display = 'none'; }
  document.documentElement.style.setProperty('--admin-bar-h', '0px');
}

// ADMIN skip-forward engine ------------------------------------------------
// A skip sets window.ADMIN_SKIP_TARGET to a target slide_number. Each story
// trial's on_load calls adminMaybeAutoSkip(): if its own slide_number is
// below the target it ends immediately (fast-forwarding); when the target
// slide is reached the target clears and that slide renders normally.
// ADMIN_FASTFWD stays true while fast-forwarding so the stop-recording step
// self-skips too; it clears when we land on the first post-study page.
window.ADMIN_SKIP_TARGET = (window.GRANDMA_RESEARCHER_PREVIEW === true &&
  typeof window.GRANDMA_PREVIEW_START_AT === 'number' &&
  window.GRANDMA_PREVIEW_START_AT > 1)
  ? window.GRANDMA_PREVIEW_START_AT : null;
window.ADMIN_FASTFWD     = false;
window.ADMIN_SKIP_TO_DEBRIEF = false;

function adminMaybeAutoSkip() {
  if (window.ADMIN_SKIP_TARGET == null) { return false; }
  var d = (jsPsych.getCurrentTrial && jsPsych.getCurrentTrial().data) || {};
  var n = d.slide_number;
  if (typeof n !== 'number') { return false; }
  if (n < window.ADMIN_SKIP_TARGET) {
    var t = jsPsych.getCurrentTrial();
    if (t) { t.post_trial_gap = 0; }   // drop the inter-trial gap while fast-forwarding
    setTimeout(function() { try { jsPsych.finishTrial(); } catch (e) {} }, 0);
    return true;
  }
  window.ADMIN_SKIP_TARGET = null;     // arrived at the target slide
  return false;
}

// Jump to the first slide of the next family. Families are 8 slides each,
// so first-slides are slide_number 1, 9, 17, ... If already in the last
// family, this jumps to the "get a grown-up" screen instead.
function adminNextFamily() {
  var d = (jsPsych.getCurrentTrial && jsPsych.getCurrentTrial().data) || {};
  var n = d.slide_number;
  if (typeof n !== 'number') { return; }
  var famIdx    = Math.floor((n - 1) / 8);   // 0-based current family
  var nextFirst = (famIdx + 1) * 8 + 1;      // first slide of the next family
  if (typeof STORY_SLIDE_TOTAL === 'number' && nextFirst > STORY_SLIDE_TOTAL) {
    adminSkipToPostStudy();                  // no next family
    return;
  }
  window.ADMIN_SKIP_TARGET = nextFirst;
  try { jsPsych.finishTrial(); } catch (e) {}
}

// Skip all remaining story trials AND the stop-recording step, landing on
// the "get a grown-up" handoff slide (the first post-study screen). From
// there the child's Continue button — or the admin "Skip this page" button —
// proceeds to the email page, then exit survey, then debrief.
function adminSkipToPostStudy() {
  window.ADMIN_SKIP_TARGET = (typeof STORY_SLIDE_TOTAL === 'number')
    ? STORY_SLIDE_TOTAL + 1                  // beyond the last story slide
    : 999999;
  window.ADMIN_FASTFWD = true;               // also skip the stop-recording step
  try { jsPsych.finishTrial(); } catch (e) {}
}

// In the no-data researcher preview, fast-forward through the handoff page
// and land on the debrief. CHS keeps the separate grown-up handoff control.
function adminSkipToEnd() {
  if (window.GRANDMA_RESEARCHER_PREVIEW === true) {
    window.ADMIN_SKIP_TO_DEBRIEF = true;
  }
  adminSkipToPostStudy();
}

// Skip just the current post-study page (advance one trial).
function adminSkipThisPage() {
  try { jsPsych.finishTrial(); } catch (e) {}
}

// ADMIN: on_load for the three camera-setup trials. Shows the bar in camera
// mode; if a camera skip is already underway it ends the trial immediately.
function cameraTrialOnLoad() {
  if (window.CAMERA_SKIPPED) {
    setTimeout(function() { try { jsPsych.finishTrial(); } catch (e) {} }, 0);
    return;
  }
  showAdminBar('camera');
}

// ADMIN: on_load for the stop-recording step. Self-skips during a fast-
// forward (so "Skip to grown-up screen" lands on the handoff slide, not
// here); otherwise it hides the bar and finalizes the recording normally.
function stopRecordOnLoad() {
  if (window.ADMIN_FASTFWD) {
    setTimeout(function() { try { jsPsych.finishTrial(); } catch (e) {} }, 0);
    return;
  }
  hideAdminBar();
}

// ADMIN: on_load for the post-study pages (grown-up handoff / email / exit
// survey). Ends any fast-forward (the handoff slide is where "Skip to grown-
// up screen" lands) and shows the per-page "Skip this page" button so admins
// can advance through them.
function wrapupPageOnLoad() {
  if (window.GRANDMA_RESEARCHER_PREVIEW === true && window.ADMIN_SKIP_TO_DEBRIEF) {
    setTimeout(function() { try { jsPsych.finishTrial(); } catch (e) {} }, 0);
    return;
  }
  window.ADMIN_FASTFWD     = false;
  window.ADMIN_SKIP_TARGET = null;
  showAdminBar('page');
}

// ================================================================
// ASSETS
// ================================================================
var IMG   = 'https://raw.githubusercontent.com/tparrish-777/GrandmasCollection/main/realimages/';
// The shared "grandma" definition image still lives in the original folder.
var IMG_ORIG = 'https://raw.githubusercontent.com/tparrish-777/GrandmasCollection/main/images/';
var AUDIO = 'https://raw.githubusercontent.com/tparrish-777/GrandmasCollection/main/audiofiles/';

var SESSION_ID = 'G' + Date.now().toString(36).toUpperCase();

// ================================================================
// CONDITION ASSIGNMENT
// ================================================================
var CONDITION  = Math.floor(Math.random() * 4);
var COND_LABEL = ['A', 'B', 'C', 'D'][CONDITION];

console.log('=========================================');
console.log('CONDITION ASSIGNED: ' + CONDITION + ' (' + COND_LABEL + ')');
console.log('Q order : ' + (CONDITION < 2
  ? 'Q1 (who is grandma?) FIRST, then Q2 (which house?)'
  : 'Q2 (which house?) FIRST, then Q1 (who is grandma?)'));
console.log('Img side: ' + (CONDITION % 2 === 0
  ? 'ORIGINAL positions'
  : 'FLIPPED positions'));
console.log('=========================================');

jsPsych.data.addProperties({
  session_id:      SESSION_ID,
  chs_child_id:    chsChildId,
  chs_response_id: chsResponseId,
  condition:       CONDITION,
  condition_label: COND_LABEL,
  q_order:         CONDITION < 2 ? 'Q1_then_Q2' : 'Q2_then_Q1',
  img_side:        CONDITION % 2 === 0 ? 'original' : 'flipped'
});

// ================================================================
// FAMILIES DATA
// ================================================================
var FAMILIES = [

  // SET 1
  {
    id: 'lisa', set: 1,
    intro_audio: 'lisa-mateo.mp3',   intro_img: 'Lisa-Mateo.png',
    mom_audio:   'lisa-mom.mp3',     mom_img:   'Lisa-Mom.png',
    foil_audio:  'lisa-foil.mp3',    foil_img:  'Lisa-Foil.png',
    all_audio:   'lisa-all.mp3',     all_img:   'Lisa-All.png',
    visit_audio: 'lisa-visit.mp3',   visit_img: 'Lisa-Visit.png',
    q1_audio_orig: 'lisa-choice1.mp3',     q1_audio_alt: 'lisa-choice1-alt.mp3',
    q2_audio_orig: 'lisa-choice2.mp3',     q2_audio_alt: 'lisa-choice2-alt.mp3',
    q1_img_A: 'Lisa-Choice1A.png',   q1_img_B: 'Lisa-Choice1B.png',
    q2_img_A: 'Lisa-Choice2A.png',   q2_img_B: 'Lisa-Choice2B.png',
    q1_correct_is_B: true,  q2_correct_is_B: true,
    intro_text: "I want to tell you a story about Lisa and Mateo. This is Lisa and her son Mateo.",
    mom_text:   "And here they are with Lisa's mom. This woman here with the green circle is Lisa's mom.",
    foil_text:  "And here they are with Lisa's friend. This woman here with the blue square is Lisa's friend.",
    all_text:   "And here they are all together! We have Lisa, Mateo, who is Lisa's son, and then Lisa's friend and Lisa's mom.",
    visit_text: "So, one day Mateo, who is Lisa's son, asks Lisa to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Mateo's grandma? Is it Lisa's friend, who has the blue square, or Lisa's mom, who has the green circle?",
    q1_alt_text:  "Now, who do you think is Mateo's grandma? Is it Lisa's mom, who has the green circle, or Lisa's friend, who has the blue square?",
    q2_orig_text: "Lisa's friend lives in a blue house. Lisa's mom lives in a green house. Which house do you think they will go to if Mateo wants to visit his grandma?",
    q2_alt_text:  "Lisa's mom lives in a green house. Lisa's friend lives in a blue house. Which house do you think they will go to if Mateo wants to visit his grandma?"
  },

  {
    id: 'sophia', set: 1,
    intro_audio: 'sophia-jake.mp3',  intro_img: 'Sophia-Jake.png',
    mom_audio:   'sophia-mom.mp3',   mom_img:   'Sophia-Mom.png',
    foil_audio:  'sophia-foil.mp3',  foil_img:  'Sophia-Foil.png',
    all_audio:   'sophia-all.mp3',   all_img:   'Sophia-All.png',
    visit_audio: 'sophia-visit.mp3', visit_img: 'Sophia-Visit.png',
    q1_audio_orig: 'sophia-choice1.mp3',   q1_audio_alt: 'sophia-choice1-alt.mp3',
    q2_audio_orig: 'sophia-choice2.mp3',   q2_audio_alt: 'sophia-choice2-alt.mp3',
    q1_img_A: 'Sophia-Choice1A.png', q1_img_B: 'Sophia-Choice1B.png',
    q2_img_A: 'Sophia-Choice2A.png', q2_img_B: 'Sophia-Choice2B.png',
    q1_correct_is_B: true, q2_correct_is_B: true,
    intro_text: "I want to tell you a story about Sophia and Jake. This is Sophia and her son Jake.",
    mom_text:   "And here they are with Sophia's mom. This woman here with the orange circle is Sophia's mom.",
    foil_text:  "And here they are with Sophia's friend. This woman here with the light green triangle is Sophia's friend.",
    all_text:   "And here they are all together! We have Sophia, Jake, who is Sophia's son, and then Sophia's friend and Sophia's mom.",
    visit_text: "So, one day Jake, who is Sophia's son, asks Sophia to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Jake's grandma? Is it Sophia's friend, who has the light green triangle, or Sophia's mom, who has the orange circle?",
    q1_alt_text:  "Now, who do you think is Jake's grandma? Is it Sophia's mom, who has the orange circle, or Sophia's friend, who has the light green triangle?",
    q2_orig_text: "Sophia's friend lives in a light green house. Sophia's mom lives in an orange house. Which house do you think they will go to if Jake wants to visit his grandma?",
    q2_alt_text:  "Sophia's mom lives in an orange house. Sophia's friend lives in a light green house. Which house do you think they will go to if Jake wants to visit his grandma?"
  },

  {
    id: 'lucy', set: 1,
    intro_audio: 'lucy-josh.mp3',   intro_img: 'Lucy-Josh.png',
    mom_audio:   'lucy-mom.mp3',    mom_img:   'Lucy-Mom.png',
    foil_audio:  'lucy-foil.mp3',   foil_img:  'Lucy-Foil.png',
    all_audio:   'lucy-all.mp3',    all_img:   'Lucy-All.png',
    visit_audio: 'lucy-visit.mp3',  visit_img: 'Lucy-Visit.png',
    q1_audio_orig: 'lucy-choice1.mp3',     q1_audio_alt: 'lucy-choice1-alt.mp3',
    q2_audio_orig: 'lucy-choice2.mp3',     q2_audio_alt: 'lucy-choice2-alt.mp3',
    q1_img_A: 'Lucy-Choice1A.png',  q1_img_B: 'Lucy-Choice1B.png',
    q2_img_A: 'Lucy-Choice2A.png',  q2_img_B: 'Lucy-Choice2B.png',
    q1_correct_is_B: false, q2_correct_is_B: false,
    intro_text: "I want to tell you a story about Lucy and Josh. This is Lucy and her son Josh.",
    mom_text:   "And here they are with Lucy's mom. This woman here with the pink circle is Lucy's mom.",
    foil_text:  "And here they are with Lucy's aunt. This woman here with the purple triangle is Lucy's aunt.",
    all_text:   "And here they are all together! We have Lucy, Josh, who is Lucy's son, and then Lucy's mom and Lucy's aunt.",
    visit_text: "So, one day Josh, who is Lucy's son, asks Lucy to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Josh's grandma? Is it Lucy's mom, who has the pink circle, or Lucy's aunt, who has the purple triangle?",
    q1_alt_text:  "Now, who do you think is Josh's grandma? Is it Lucy's aunt, who has the purple triangle, or Lucy's mom, who has the pink circle?",
    q2_orig_text: "Lucy's mom lives in a pink house. Lucy's aunt lives in a purple house. Which house do you think they will go to if Josh wants to visit his grandma?",
    q2_alt_text:  "Lucy's aunt lives in a purple house. Lucy's mom lives in a pink house. Which house do you think they will go to if Josh wants to visit his grandma?"
  },

  {
    id: 'lauren', set: 1,
    intro_audio: 'lauren-matt.mp3',  intro_img: 'Lauren-Matt.png',
    mom_audio:   'lauren-mom.mp3',   mom_img:   'Lauren-Mom.png',
    foil_audio:  'lauren-foil.mp3',  foil_img:  'Lauren-Foil.png',
    all_audio:   'lauren-all.mp3',   all_img:   'Lauren-All.png',
    visit_audio: 'lauren-visit.mp3', visit_img: 'Lauren-Visit.png',
    q1_audio_orig: 'lauren-choice1.mp3',   q1_audio_alt: 'lauren-choice1-alt.mp3',
    q2_audio_orig: 'lauren-choice2.mp3',   q2_audio_alt: 'lauren-choice2-alt.mp3',
    q1_img_A: 'Lauren-Choice1A.png', q1_img_B: 'Lauren-Choice1B.png',
    q2_img_A: 'Lauren-Choice2A.png', q2_img_B: 'Lauren-Choice2B.png',
    q1_correct_is_B: false, q2_correct_is_B: false,
    intro_text: "I want to tell you a story about Lauren and Matt. This is Lauren and her son Matt.",
    mom_text:   "And here they are with Lauren's mom. This woman here with the yellow diamond is Lauren's mom.",
    foil_text:  "And here they are with Lauren's aunt. This woman here with the blue circle is Lauren's aunt.",
    all_text:   "And here they are all together! We have Lauren, Matt, who is Lauren's son, and then Lauren's mom and Lauren's aunt.",
    visit_text: "So, one day Matt, who is Lauren's son, asks Lauren to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Matt's grandma? Is it Lauren's mom, who has the yellow diamond, or Lauren's aunt, who has the blue circle?",
    q1_alt_text:  "Now, who do you think is Matt's grandma? Is it Lauren's aunt, who has the blue circle, or Lauren's mom, who has the yellow diamond?",
    q2_orig_text: "Lauren's mom lives in a yellow house. Lauren's aunt lives in a blue house. Which house do you think they will go to if Matt wants to visit his grandma?",
    q2_alt_text:  "Lauren's aunt lives in a blue house. Lauren's mom lives in a yellow house. Which house do you think they will go to if Matt wants to visit his grandma?"
  },

  // SET 2
  {
    id: 'maisy', set: 2,
    intro_audio: 'maisy-jackson.mp3', intro_img: 'Maisy-Jackson.png',
    mom_audio:   'maisy-mom.mp3',     mom_img:   'Maisy-Mom.png',
    foil_audio:  'maisy-foil.mp3',    foil_img:  'Maisy-Foil.png',
    all_audio:   'maisy-all.mp3',     all_img:   'Maisy-All.png',
    visit_audio: 'maisy-visit.mp3',   visit_img: 'Maisy-Visit.png',
    q1_audio_orig: 'maisy-choice1.mp3',    q1_audio_alt: 'maisy-choice1-alt.mp3',
    q2_audio_orig: 'maisy-choice2.mp3',    q2_audio_alt: 'maisy-choice2-alt.mp3',
    q1_img_A: 'Maisy-Choice1A.png',   q1_img_B: 'Maisy-Choice1B.png',
    q2_img_A: 'Maisy-Choice2A.png',   q2_img_B: 'Maisy-Choice2B.png',
    q1_correct_is_B: false, q2_correct_is_B: false,
    intro_text: "I want to tell you a story about Maisy and Jackson. This is Maisy and her son Jackson.",
    mom_text:   "And here they are with Maisy's mom. This woman here with the orange circle is Maisy's mom.",
    foil_text:  "And here they are with Maisy's friend. This woman here with the blue diamond is Maisy's friend.",
    all_text:   "And here they are all together! We have Maisy, Jackson, who is Maisy's son, and then Maisy's mom and Maisy's friend.",
    visit_text: "So, one day Jackson, who is Maisy's son, asks Maisy to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Jackson's grandma? Is it Maisy's mom, who has the orange circle, or Maisy's friend, who has the blue diamond?",
    q1_alt_text:  "Now, who do you think is Jackson's grandma? Is it Maisy's friend, who has the blue diamond, or Maisy's mom, who has the orange circle?",
    q2_orig_text: "Maisy's mom lives in an orange house. Maisy's friend lives in a blue house. Which house do you think they will go to if Jackson wants to visit his grandma?",
    q2_alt_text:  "Maisy's friend lives in a blue house. Maisy's mom lives in an orange house. Which house do you think they will go to if Jackson wants to visit his grandma?"
  },

  {
    id: 'kylie', set: 2,
    intro_audio: 'kylie-andy.mp3',   intro_img: 'Kylie-Andy.png',
    mom_audio:   'kylie-mom.mp3',    mom_img:   'Kylie-Mom.png',
    foil_audio:  'kylie-foil.mp3',   foil_img:  'Kylie-Foil.png',
    all_audio:   'kylie-all.mp3',    all_img:   'Kylie-All.png',
    visit_audio: 'kylie-visit.mp3',  visit_img: 'Kylie-Visit.png',
    q1_audio_orig: 'kylie-choice1.mp3',    q1_audio_alt: 'kylie-choice1-alt.mp3',
    q2_audio_orig: 'kylie-choice2.mp3',    q2_audio_alt: 'kylie-choice2-alt.mp3',
    q1_img_A: 'Kylie-Choice1A.png',  q1_img_B: 'Kylie-Choice1B.png',
    q2_img_A: 'Kylie-Choice2A.png',  q2_img_B: 'Kylie-Choice2B.png',
    q1_correct_is_B: false, q2_correct_is_B: false,
    intro_text: "I want to tell you a story about Kylie and Andy. This is Kylie and her son Andy.",
    mom_text:   "And here they are with Kylie's mom. This woman here with the purple diamond is Kylie's mom.",
    foil_text:  "And here they are with Kylie's aunt. This woman here with the light blue triangle is Kylie's aunt.",
    all_text:   "And here they are all together! We have Kylie, Andy, who is Kylie's son, and then Kylie's mom and Kylie's aunt.",
    visit_text: "So, one day Andy, who is Kylie's son, asks Kylie to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Andy's grandma? Is it Kylie's mom, who has the purple diamond, or Kylie's aunt, who has the light blue triangle?",
    q1_alt_text:  "Now, who do you think is Andy's grandma? Is it Kylie's aunt, who has the light blue triangle, or Kylie's mom, who has the purple diamond?",
    q2_orig_text: "Kylie's mom lives in a purple house. Kylie's aunt lives in a light blue house. Which house do you think they will go to if Andy wants to visit his grandma?",
    q2_alt_text:  "Kylie's aunt lives in a light blue house. Kylie's mom lives in a purple house. Which house do you think they will go to if Andy wants to visit his grandma?"
  },

  {
    id: 'amanda', set: 2,
    intro_audio: 'amanda-luke.mp3',  intro_img: 'Amanda-Luke.png',
    mom_audio:   'amanda-mom.mp3',   mom_img:   'Amanda-Mom.png',
    foil_audio:  'amanda-foil.mp3',  foil_img:  'Amanda-Foil.png',
    all_audio:   'amanda-all.mp3',   all_img:   'Amanda-All.png',
    visit_audio: 'amanda-visit.mp3', visit_img: 'Amanda-Visit.png',
    q1_audio_orig: 'amanda-choice1.mp3',   q1_audio_alt: 'amanda-choice1-alt.mp3',
    q2_audio_orig: 'amanda-choice2.mp3',   q2_audio_alt: 'amanda-choice2-alt.mp3',
    q1_img_A: 'Amanda-Choice1A.png', q1_img_B: 'Amanda-Choice1B.png',
    q2_img_A: 'Amanda-Choice2A.png', q2_img_B: 'Amanda-Choice2B.png',
    q1_correct_is_B: true, q2_correct_is_B: true,
    intro_text: "I want to tell you a story about Amanda and Luke. This is Amanda and her son Luke.",
    mom_text:   "And here they are with Amanda's mom. This woman here with the yellow circle is Amanda's mom.",
    foil_text:  "And here they are with Amanda's friend. This woman here with the pink square is Amanda's friend.",
    all_text:   "And here they are all together! We have Amanda, Luke, who is Amanda's son, and then Amanda's friend and Amanda's mom.",
    visit_text: "So, one day Luke, who is Amanda's son, asks Amanda to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Luke's grandma? Is it Amanda's friend, who has the pink square, or Amanda's mom, who has the yellow circle?",
    q1_alt_text:  "Now, who do you think is Luke's grandma? Is it Amanda's mom, who has the yellow circle, or Amanda's friend, who has the pink square?",
    q2_orig_text: "Amanda's friend lives in a pink house. Amanda's mom lives in a yellow house. Which house do you think they will go to if Luke wants to visit his grandma?",
    q2_alt_text:  "Amanda's mom lives in a yellow house. Amanda's friend lives in a pink house. Which house do you think they will go to if Luke wants to visit his grandma?"
  },

  {
    id: 'olivia', set: 2,
    intro_audio: 'olivia-avery.mp3', intro_img: 'Olivia-Avery.png',
    mom_audio:   'olivia-mom.mp3',   mom_img:   'Olivia-Mom.png',
    foil_audio:  'olivia-foil.mp3',  foil_img:  'Olivia-Foil.png',
    all_audio:   'olivia-all.mp3',   all_img:   'Olivia-All.png',
    visit_audio: 'olivia-visit.mp3', visit_img: 'Olivia-Visit.png',
    q1_audio_orig: 'olivia-choice1.mp3',   q1_audio_alt: 'olivia-choice1-alt.mp3',
    q2_audio_orig: 'olivia-choice2.mp3',   q2_audio_alt: 'olivia-choice2-alt.mp3',
    q1_img_A: 'Olivia-Choice1A.png', q1_img_B: 'Olivia-Choice1B.png',
    q2_img_A: 'Olivia-Choice2A.png', q2_img_B: 'Olivia-Choice2B.png',
    q1_correct_is_B: true, q2_correct_is_B: true,
    intro_text: "I want to tell you a story about Olivia and Avery. This is Olivia and her son Avery.",
    mom_text:   "And here they are with Olivia's mom. This woman here with the yellow triangle is Olivia's mom.",
    foil_text:  "And here they are with Olivia's aunt. This woman here with the orange square is Olivia's aunt.",
    all_text:   "And here they are all together! We have Olivia, Avery, who is Olivia's son, and then Olivia's aunt and Olivia's mom.",
    visit_text: "So, one day Avery, who is Olivia's son, asks Olivia to go visit his grandma.",
    q1_orig_text: "Now, who do you think is Avery's grandma? Is it Olivia's aunt, who has the orange square, or Olivia's mom, who has the yellow triangle?",
    q1_alt_text:  "Now, who do you think is Avery's grandma? Is it Olivia's mom, who has the yellow triangle, or Olivia's aunt, who has the orange square?",
    q2_orig_text: "Olivia's aunt lives in an orange house. Olivia's mom lives in a yellow house. Which house do you think they will go to if Avery wants to visit his grandma?",
    q2_alt_text:  "Olivia's mom lives in a yellow house. Olivia's aunt lives in an orange house. Which house do you think they will go to if Avery wants to visit his grandma?"
  }
];

// ================================================================
// ASSET PRELOADER
// ================================================================
var IMG_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="300">' +
  '<rect width="420" height="300" rx="14" fill="#f5f7fa" ' +
  'stroke="#dde1e7" stroke-width="2"/>' +
  '<text x="210" y="138" font-family="Arial,sans-serif" font-size="38" ' +
  'fill="#d0d8e0" text-anchor="middle">&#128444;</text>' +
  '<text x="210" y="178" font-family="Arial,sans-serif" font-size="14" ' +
  'fill="#b0b8c4" text-anchor="middle">Image could not load</text>' +
  '<text x="210" y="200" font-family="Arial,sans-serif" font-size="13" ' +
  'fill="#c8d0da" text-anchor="middle">Tap Replay to try again</text>' +
  '</svg>'
);

function buildAllAssetUrls() {
  var imgs  = [IMG_ORIG + 'Grandma-Definition.jpg'];
  var audio = [AUDIO + 'Definition.mp3',
               AUDIO + 'introduction.mp3',
               AUDIO + 'completion.mp3',
               AUDIO + 'set-up-completion.mp3'];
  for (var i = 0; i < FAMILIES.length; i++) {
    var f = FAMILIES[i];
    imgs.push(
      IMG + f.intro_img, IMG + f.mom_img,
      IMG + f.foil_img,  IMG + f.all_img,
      IMG + f.visit_img,
      IMG + f.q1_img_A,  IMG + f.q1_img_B,
      IMG + f.q2_img_A,  IMG + f.q2_img_B
    );
    audio.push(
      AUDIO + f.intro_audio,   AUDIO + f.mom_audio,
      AUDIO + f.foil_audio,    AUDIO + f.all_audio,
      AUDIO + f.visit_audio,
      AUDIO + f.q1_audio_orig, AUDIO + f.q1_audio_alt,
      AUDIO + f.q2_audio_orig, AUDIO + f.q2_audio_alt
    );
  }
  return { imgs: imgs, audio: audio };
}

var ALL_ASSETS    = buildAllAssetUrls();
var _preloaded    = 0;
var _preloadTotal = ALL_ASSETS.imgs.length;
var _preloadDone  = (_preloadTotal === 0);
var _preloadCbs   = [];

function whenPreloadDone(cb) {
  if (_preloadDone) { cb(); return; }
  _preloadCbs.push(cb);
}

(function kickoffPreload() {
  if (_preloadTotal === 0) { return; }

  function tick() {
    _preloaded++;
    var pctNum = Math.round(_preloaded / _preloadTotal * 100);
    var bar = document.getElementById('gp-inner');
    var lbl = document.getElementById('gp-pct');
    if (bar) bar.style.width = pctNum + '%';
    if (lbl) lbl.textContent = pctNum + '%';
    if (_preloaded >= _preloadTotal) {
      _preloadDone = true;
      for (var k = 0; k < _preloadCbs.length; k++) { _preloadCbs[k](); }
      _preloadCbs = [];
    }
  }

  for (var i = 0; i < ALL_ASSETS.imgs.length; i++) {
    (function(src) {
      var img    = new Image();
      img.onload = tick;
      img.onerror = tick;
      img.src    = src;
    })(ALL_ASSETS.imgs[i]);
  }

  for (var j = 0; j < ALL_ASSETS.audio.length; j++) {
    (function(src) {
      var a    = new Audio();
      a.preload = 'metadata';
      a.src    = src;
    })(ALL_ASSETS.audio[j]);
  }
})();

// ================================================================
// PROGRESS BAR HTML GENERATOR
// ================================================================
function makeProgressHtml(familyIndex, totalFamilies, palette) {
  var dots = '';
  for (var i = 0; i < totalFamilies; i++) {
    var cls = (i < familyIndex)  ? 'pdot pdot-done'
            : (i === familyIndex) ? 'pdot pdot-now'
            :                       'pdot';
    dots += '<span class="' + cls + '"></span>';
  }
  return (
    '<div class="game-progress" style="background:' + palette.grad + ';">' +
      '<span class="progress-label">Story ' +
        (familyIndex + 1) + ' of ' + totalFamilies +
      '</span>' +
      '<div class="progress-dots">' + dots + '</div>' +
      '<span class="progress-slide" id="gp-slide"></span>' +
    '</div>'
  );
}

// Fills the "Slide N of M" label from the current trial's data. Each
// story/question trial is numbered sequentially after the timeline is
// assembled (see STORY_SLIDE_TOTAL below), so this reflects true
// position regardless of counterbalanced question order.
function fillSlideNumber() {
  var el = document.getElementById('gp-slide');
  if (!el) return;
  var d = (typeof jsPsych !== 'undefined' && jsPsych.getCurrentTrial)
    ? (jsPsych.getCurrentTrial().data || {}) : {};
  if (d.slide_number && d.slide_total) {
    el.textContent = 'Slide ' + d.slide_number + ' of ' + d.slide_total;
  }
}

// ================================================================
// TRIAL FACTORY: narrated image slide
// ================================================================
// Per-character shape + color (from the narration, e.g. "the green circle
// is the mom"). The same color is used for that character's shape badge AND
// their house on the Choice-2 slide.
var FAMILY_SHAPES = {
  lisa:   { mom:{shape:'circle',  color:'#3aa757'}, foil:{shape:'square',   color:'#3f7fd6'} },
  sophia: { mom:{shape:'circle',  color:'#ef8b2c'}, foil:{shape:'triangle', color:'#9ccc65'} },
  lucy:   { mom:{shape:'circle',  color:'#ec6ea6'}, foil:{shape:'triangle', color:'#9163cf'} },
  lauren: { mom:{shape:'diamond', color:'#f4c026'}, foil:{shape:'circle',   color:'#3f7fd6'} },
  maisy:  { mom:{shape:'circle',  color:'#ef8b2c'}, foil:{shape:'diamond',  color:'#3f7fd6'} },
  kylie:  { mom:{shape:'diamond', color:'#9163cf'}, foil:{shape:'triangle', color:'#57c1f0'} },
  amanda: { mom:{shape:'circle',  color:'#f4c026'}, foil:{shape:'square',   color:'#ec6ea6'} },
  olivia: { mom:{shape:'triangle',color:'#f4c026'}, foil:{shape:'square',   color:'#ef8b2c'} }
};

// Character labels shown on the choice slides (same style as the baked-in
// labels on the other images). The children are pre-literate, so these are
// per supervisor request and don't function as answer keys.
var FAMILY_LABELS = {
  lisa:   { mom:"Lisa's mom",   foil:"Lisa's friend", son:"Mateo" },
  sophia: { mom:"Sophia's mom", foil:"Sophia's friend", son:"Jake" },
  lucy:   { mom:"Lucy's mom",   foil:"Lucy's aunt",   son:"Josh" },
  lauren: { mom:"Lauren's mom", foil:"Lauren's aunt", son:"Matt" },
  maisy:  { mom:"Maisy's mom",  foil:"Maisy's friend", son:"Jackson" },
  kylie:  { mom:"Kylie's mom",  foil:"Kylie's aunt",  son:"Andy" },
  amanda: { mom:"Amanda's mom", foil:"Amanda's friend", son:"Luke" },
  olivia: { mom:"Olivia's mom", foil:"Olivia's aunt",  son:"Avery" }
};

function shadeColor(hex, amt) {
  var c = hex.replace('#', '');
  if (c.length === 3) { c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]; }
  var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
  r = Math.max(0, Math.min(255, r+amt)); g = Math.max(0, Math.min(255, g+amt)); b = Math.max(0, Math.min(255, b+amt));
  function h(x){ x = x.toString(16); return x.length < 2 ? '0'+x : x; }
  return '#'+h(r)+h(g)+h(b);
}

// A colored shape marker (circle / square / triangle / diamond).
function shapeSVG(type, color) {
  var d = shadeColor(color, -45), sw = 8, inner;
  if (type === 'circle')        inner = '<circle cx="60" cy="60" r="46" fill="'+color+'" stroke="'+d+'" stroke-width="'+sw+'"/>';
  else if (type === 'square')   inner = '<rect x="16" y="16" width="88" height="88" rx="10" fill="'+color+'" stroke="'+d+'" stroke-width="'+sw+'"/>';
  else if (type === 'triangle') inner = '<polygon points="60,12 108,104 12,104" fill="'+color+'" stroke="'+d+'" stroke-width="'+sw+'" stroke-linejoin="round"/>';
  else                          inner = '<polygon points="60,10 110,60 60,110 10,60" fill="'+color+'" stroke="'+d+'" stroke-width="'+sw+'" stroke-linejoin="round"/>';
  return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" ' +
    'style="width:100%;height:100%;display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">' + inner + '</svg>';
}

// A cartoon house (colored roof + framed body) with a portrait inside.
function houseSVG(id, imgUrl, color) {
  var d = shadeColor(color, -28);
  // Portrait-shaped house; the image is CONTAINED (meet) and fit to the body
  // height so the whole figure shows. Body is white and portraits are on
  // white, so there are no visible letterbox bars.
  return '<svg viewBox="0 0 200 306" xmlns="http://www.w3.org/2000/svg" style="height:100%;width:auto;display:block;">' +
    '<defs><clipPath id="hc-'+id+'"><rect x="18" y="98" width="164" height="192" rx="8"/></clipPath></defs>' +
    '<path d="M100 12 L196 92 L4 92 Z" fill="'+color+'" stroke="'+d+'" stroke-width="6" stroke-linejoin="round"/>' +
    '<rect x="10" y="90" width="180" height="208" rx="12" fill="'+color+'"/>' +
    '<rect x="18" y="98" width="164" height="192" rx="8" fill="#fff"/>' +
    '<image href="'+imgUrl+'" x="18" y="98" width="164" height="192" preserveAspectRatio="xMidYMid meet" clip-path="url(#hc-'+id+')"/>' +
    '<rect x="18" y="98" width="164" height="192" rx="8" fill="none" stroke="'+d+'" stroke-width="5"/>' +
    '</svg>';
}

// Build one clickable choice cell: a house (Choice-2), a portrait + shape
// badge (Choice-1), or a plain image (fallback).
function choiceCell(idx, imgFile, opts) {
  opts = opts || {};
  if (opts.houses) {
    var h = (idx === 0) ? opts.houses.left : opts.houses.right;
    return '<div id="choice-img-'+idx+'" class="choice-house-btn" onclick="grandmaHandleChoice('+idx+');">' +
      (h.label ? '<div class="choice-label">' + h.label + '</div>' : '') +
      houseSVG('h'+idx, IMG + h.img, h.color) + '</div>';
  }
  if (opts.shapes) {
    var s = (idx === 0) ? opts.shapes.left : opts.shapes.right;
    return '<div id="choice-img-'+idx+'" class="choice-cell" onclick="grandmaHandleChoice('+idx+');">' +
      (s.label ? '<div class="choice-label">' + s.label + '</div>' : '') +
      '<div class="choice-frame">' +
        '<img class="choice-frame-img" src="' + (IMG + imgFile) + '" alt="choice" loading="eager" ' +
        'onerror="this.onerror=null;this.src=IMG_PLACEHOLDER;">' +
        '<div class="choice-shape-badge">' + shapeSVG(s.shape, s.color) + '</div>' +
      '</div></div>';
  }
  return '<img id="choice-img-'+idx+'" src="' + (IMG + imgFile) + '" class="choice-img-btn" ' +
    'alt="choice" loading="eager" onerror="this.onerror=null;this.src=IMG_PLACEHOLDER;" ' +
    'onclick="grandmaHandleChoice('+idx+');">';
}

// Character-highlight boxes per image (see highlight-coordinates.json).
// Each box: left/top/width/height as % of the picture, plus time (seconds
// into the audio) at which it becomes the active spotlight.
var HIGHLIGHTS = {"Lisa-Mateo":[{"left":23,"top":6,"width":23,"height":91,"time":3.0},{"left":51,"top":28,"width":22,"height":70,"time":5.0}],"Lisa-Mom":[{"left":63,"top":8,"width":24,"height":89,"time":3.0,"role":"mom"}],"Lisa-Foil":[{"left":63,"top":10,"width":23,"height":87,"time":3.0,"role":"foil"}],"Lisa-All":[{"left":5,"top":11,"width":22,"height":84,"time":2.5},{"left":30,"top":27,"width":17,"height":71,"time":4.0},{"left":49,"top":10,"width":23,"height":87,"time":7.0,"role":"foil"},{"left":72,"top":10,"width":22,"height":86,"time":8.7,"role":"mom"}],"Amanda-Luke":[{"left":24,"top":12,"width":21,"height":75,"time":3.0},{"left":53,"top":31,"width":20,"height":56,"time":5.0}],"Amanda-Mom":[{"left":66,"top":17,"width":18,"height":71,"time":3.0,"role":"mom"}],"Amanda-Foil":[{"left":64,"top":18,"width":17,"height":68,"time":3.0,"role":"foil"}],"Amanda-All":[{"left":5,"top":11,"width":19,"height":78,"time":2.5},{"left":30,"top":28,"width":16,"height":60,"time":4.0},{"left":50,"top":14,"width":19,"height":74,"time":7.0,"role":"foil"},{"left":73,"top":14,"width":22,"height":74,"time":8.7,"role":"mom"}],"Kylie-Andy":[{"left":23,"top":10,"width":23,"height":83,"time":3.0},{"left":56,"top":34,"width":16,"height":61,"time":5.0}],"Kylie-Mom":[{"left":66,"top":14,"width":21,"height":80,"time":3.0,"role":"mom"}],"Kylie-Foil":[{"left":65,"top":16,"width":21,"height":79,"time":3.0,"role":"foil"}],"Kylie-All":[{"left":5,"top":15,"width":19,"height":79,"time":2.5},{"left":29,"top":36,"width":17,"height":57,"time":4.0},{"left":50,"top":14,"width":21,"height":79,"time":7.0,"role":"mom"},{"left":73,"top":15,"width":21,"height":79,"time":8.7,"role":"foil"}],"Lauren-Matt":[{"left":19,"top":7,"width":22,"height":90,"time":3.0},{"left":61,"top":26,"width":16,"height":70,"time":5.0}],"Lauren-Mom":[{"left":65,"top":8,"width":21,"height":87,"time":3.0,"role":"mom"}],"Lauren-Foil":[{"left":68,"top":9,"width":21,"height":87,"time":3.0,"role":"foil"}],"Lauren-All":[{"left":4,"top":17,"width":20,"height":75,"time":2.5},{"left":28,"top":33,"width":18,"height":60,"time":4.0},{"left":51,"top":16,"width":23,"height":76,"time":7.0,"role":"mom"},{"left":75,"top":16,"width":23,"height":76,"time":8.7,"role":"foil"}],"Lucy-Josh":[{"left":18,"top":8,"width":27,"height":89,"time":3.0},{"left":53,"top":23,"width":21,"height":74,"time":5.0}],"Lucy-Mom":[{"left":62,"top":12,"width":22,"height":82,"time":3.0,"role":"mom"}],"Lucy-Foil":[{"left":63,"top":9,"width":22,"height":86,"time":3.0,"role":"foil"}],"Lucy-All":[{"left":5,"top":12,"width":21,"height":85,"time":2.5},{"left":28,"top":26,"width":20,"height":70,"time":4.0},{"left":50,"top":10,"width":21,"height":88,"time":7.0,"role":"mom"},{"left":73,"top":10,"width":22,"height":87,"time":8.7,"role":"foil"}],"Maisy-Jackson":[{"left":25,"top":7,"width":23,"height":89,"time":3.0},{"left":50,"top":26,"width":20,"height":70,"time":5.0}],"Maisy-Mom":[{"left":60,"top":10,"width":25,"height":84,"time":3.0,"role":"mom"}],"Maisy-Foil":[{"left":61,"top":11,"width":24,"height":85,"time":3.0,"role":"foil"}],"Maisy-All":[{"left":8,"top":13,"width":19,"height":84,"time":2.5},{"left":29,"top":28,"width":18,"height":69,"time":4.0},{"left":48,"top":14,"width":20,"height":82,"time":7.0,"role":"mom"},{"left":69,"top":13,"width":22,"height":83,"time":8.7,"role":"foil"}],"Olivia-Avery":[{"left":23,"top":6,"width":23,"height":91,"time":3.0},{"left":52,"top":26,"width":20,"height":70,"time":5.0}],"Olivia-Mom":[{"left":62,"top":10,"width":25,"height":86,"time":3.0,"role":"mom"}],"Olivia-Foil":[{"left":58,"top":9,"width":24,"height":87,"time":3.0,"role":"foil"}],"Olivia-All":[{"left":7,"top":14,"width":21,"height":82,"time":2.5},{"left":30,"top":30,"width":18,"height":65,"time":4.0},{"left":49,"top":14,"width":21,"height":81,"time":7.0,"role":"foil"},{"left":71,"top":15,"width":23,"height":79,"time":8.7,"role":"mom"}],"Sophia-Jake":[{"left":24,"top":9,"width":24,"height":86,"time":3.0},{"left":54,"top":24,"width":19,"height":71,"time":5.0}],"Sophia-Mom":[{"left":60,"top":11,"width":24,"height":85,"time":3.0,"role":"mom"}],"Sophia-Foil":[{"left":59,"top":12,"width":22,"height":83,"time":3.0,"role":"foil"}],"Sophia-All":[{"left":5,"top":16,"width":21,"height":79,"time":2.5},{"left":28,"top":31,"width":19,"height":64,"time":4.0},{"left":51,"top":17,"width":23,"height":77,"time":7.0,"role":"foil"},{"left":75,"top":17,"width":20,"height":77,"time":8.7,"role":"mom"}],"Amanda-Visit":[{"left":52,"top":27,"width":30,"height":63,"time":2.0}],"Kylie-Visit":[{"left":55,"top":30,"width":31,"height":65,"time":2.0}],"Lauren-Visit":[{"left":54,"top":24,"width":24,"height":75,"time":2.0}],"Lisa-Visit":[{"left":56,"top":28,"width":27,"height":69,"time":2.0}],"Lucy-Visit":[{"left":59,"top":25,"width":33,"height":69,"time":2.0}],"Maisy-Visit":[{"left":53,"top":25,"width":37,"height":72,"time":2.0}],"Olivia-Visit":[{"left":52,"top":24,"width":36,"height":73,"time":2.0}],"Sophia-Visit":[{"left":57,"top":24,"width":31,"height":70,"time":2.0}]};

function makeSlide(imgFile, audioFile, parentText, extraData,
                   familyIndex, totalFamilies) {
  var palette      = FAMILY_PALETTE[familyIndex % FAMILY_PALETTE.length];
  // imgFile may be a bare filename (loaded from IMG) or an absolute URL
  // (used for the shared definition image, which lives in the original folder).
  var imgSrc       = (/^https?:\/\//.test(imgFile)) ? imgFile : (IMG + imgFile);
  var audioSrc     = AUDIO + audioFile;
  var progressHtml = makeProgressHtml(familyIndex, totalFamilies, palette);
  var noteHtml     = parentText
    ? '<div class="parent-note"><strong>Captions:</strong> ' +
      parentText + '</div>'
    : '';

  // Highlight boxes for this image (keyed by filename without extension).
  var hlKey   = (typeof imgFile === 'string')
    ? imgFile.split('/').pop().replace(/\.[^.]+$/, '') : '';
  var hlBoxes = (HIGHLIGHTS[hlKey] || []).slice()
    .sort(function(a, b) { return a.time - b.time; });

  var imgTag =
    '<img src="' + imgSrc + '" class="trial-image" alt="Story image" ' +
    'loading="eager" onerror="this.onerror=null;this.src=IMG_PLACEHOLDER;">';

  var imageBlockHtml;
  if (hlBoxes.length) {
    var fid = hlKey.split('-')[0].toLowerCase();
    var fam = FAMILY_SHAPES[fid] || {};
    var boxDivs = '', shapeDivs = '';
    for (var bi = 0; bi < hlBoxes.length; bi++) {
      var hb = hlBoxes[bi];
      boxDivs +=
        '<div class="hl-box" id="hl-box-' + bi + '" style="' +
        'left:' + hb.left + '%;top:' + hb.top + '%;' +
        'width:' + hb.width + '%;height:' + hb.height + '%;"></div>';
      // Persistent colored shape marker on the mom / foil as introduced.
      if (hb.role && fam[hb.role]) {
        var cx = hb.left + hb.width / 2;         // horizontal centre of the box
        var cy = hb.top + hb.height * 0.28;      // upper-torso, below the face
        var sw = hb.width * 0.5;                 // badge size (% of image width)
        shapeDivs +=
          '<div class="hl-shape" style="left:' + cx + '%;top:' + cy + '%;width:' + sw + '%;">' +
          shapeSVG(fam[hb.role].shape, fam[hb.role].color) + '</div>';
      }
    }
    imageBlockHtml =
      '<div class="slide-image-wrap">' +
        '<div class="hl-holder">' + imgTag +
          '<div class="hl-layer">' + shapeDivs + boxDivs + '</div>' +
        '</div>' +
      '</div>';
  } else {
    imageBlockHtml = '<div class="slide-image-wrap">' + imgTag + '</div>';
  }

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<div class="trial-viewport">' +
        '<div class="trial-inner">' +
          progressHtml +
          '<div class="story-card story-card-fill" ' +
               'style="border:4px solid ' + palette.accent + ';border-top:none;">' +
            imageBlockHtml +
            '<audio id="slide-audio" preload="auto">' +
              '<source src="' + audioSrc + '" type="audio/mpeg">' +
              '<source src="' + audioSrc + '" type="audio/mp3">' +
            '</audio>' +
            noteHtml +
            '<div class="slide-btn-row">' +
              '<button class="replay-btn" onclick="' +
                'var a=document.getElementById(\'slide-audio\');' +
                'a.currentTime=0;a.play();">' +
                'Replay' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>',
    choices: ['Continue \u27A4'],
    on_load: function() {
      // ADMIN: if a skip-forward is running, auto-advance past this slide.
      if (typeof adminMaybeAutoSkip === 'function' && adminMaybeAutoSkip()) { return; }
      if (typeof showAdminBar === 'function') { showAdminBar('trial'); }
      fillSlideNumber();
      var a = document.getElementById('slide-audio');

      // Character spotlight: the active box is the last one whose time has
      // passed; it stays until the next box's time, and the final box holds
      // until the audio ends, then clears. Driven by the audio clock so it
      // stays in sync through pauses and Replay.
      if (a && hlBoxes.length) {
        var els = [];
        for (var i = 0; i < hlBoxes.length; i++) {
          els.push(document.getElementById('hl-box-' + i));
        }
        var syncHighlight = function() {
          var t = a.currentTime, active = -1;
          for (var k = 0; k < hlBoxes.length; k++) {
            if (t >= hlBoxes[k].time) { active = k; }
          }
          for (var m = 0; m < els.length; m++) {
            if (els[m]) { els[m].classList.toggle('hl-active', m === active); }
          }
        };
        var clearHighlight = function() {
          for (var m = 0; m < els.length; m++) {
            if (els[m]) { els[m].classList.remove('hl-active'); }
          }
        };
        a.addEventListener('timeupdate', syncHighlight);
        a.addEventListener('seeked', syncHighlight);
        a.addEventListener('ended', clearHighlight);
        syncHighlight();
      }

      if (a) { a.play().catch(function() {}); }
    },
    post_trial_gap: 200,
    data: Object.assign(
      { slide_type: 'narrated', image: imgFile.split('/').pop(), audio: audioFile },
      extraData || {}
    )
  };
}

// ================================================================
// TRIAL FACTORY: two-image forced-choice
// on_finish guards against a null response (records
// response_missing:true) so data fields are always well-defined.
// ================================================================
function makeChoiceTrial(audioFile, leftImg, rightImg, correctSide,
                         qText, familyId, qType, familyIndex, totalFamilies, opts) {
  opts = opts || {};
  var palette      = FAMILY_PALETTE[familyIndex % FAMILY_PALETTE.length];
  var audioSrc     = AUDIO + audioFile;
  var leftSrc      = IMG   + leftImg;
  var rightSrc     = IMG   + rightImg;
  var progressHtml = makeProgressHtml(familyIndex, totalFamilies, palette);
  var noteHtml     = qText
    ? '<div class="parent-note">' + qText + '</div>'
    : '';

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<div class="trial-viewport">' +
        '<div class="trial-inner">' +
          progressHtml +
          '<div class="story-card story-card-fill" ' +
               'style="border:4px solid ' + palette.accent + ';border-top:none;">' +
            '<audio id="q-audio" preload="auto">' +
              '<source src="' + audioSrc + '" type="audio/mpeg">' +
              '<source src="' + audioSrc + '" type="audio/mp3">' +
            '</audio>' +
            noteHtml +
            '<div class="slide-btn-row">' +
              '<button class="replay-btn" onclick="' +
                'var a=document.getElementById(\'q-audio\');' +
                'a.currentTime=0;a.play();">' +
                'Replay' +
              '</button>' +
            '</div>' +
            '<div class="pick-hint">' +
              'Click a picture to choose your answer!' +
            '</div>' +
            '<div class="choice-row-fill">' +
              choiceCell(0, leftImg, opts) +
              choiceCell(1, rightImg, opts) +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>',

    choices: ['Next \u27A4'],

    on_load: function() {
      // ADMIN: if a skip-forward is running, auto-advance past this trial.
      if (typeof adminMaybeAutoSkip === 'function' && adminMaybeAutoSkip()) { return; }
      if (typeof showAdminBar === 'function') { showAdminBar('trial'); }
      fillSlideNumber();
      window.grandmaCurrentResponse = null;
      var a = document.getElementById('q-audio');

      // Audio-synced attention highlight: spotlight the LEFT choice first,
      // then the RIGHT choice, at the times in opts.highlight. Cleared once
      // the child selects, or (if opts.highlight.end is set) after that time;
      // otherwise the last highlight holds until the audio ends.
      var hl = opts.highlight;
      if (a && hl && hl.times) {
        var c0 = document.getElementById('choice-img-0');
        var c1 = document.getElementById('choice-img-1');
        var cells = [c0, c1];
        var clearHL = function() {
          for (var j = 0; j < cells.length; j++) {
            if (cells[j]) { cells[j].classList.remove('choice-hl-active', 'choice-hl-dim'); }
          }
        };
        var applyHL = function() {
          if (window.grandmaCurrentResponse !== null) { clearHL(); return; }
          var t = a.currentTime, active = -1;
          if (!(hl.end != null && t >= hl.end)) {
            for (var i = 0; i < hl.times.length; i++) { if (t >= hl.times[i]) { active = i; } }
          }
          for (var k = 0; k < cells.length; k++) {
            if (!cells[k]) { continue; }
            cells[k].classList.remove('choice-hl-active', 'choice-hl-dim');
            if (active === -1) { continue; }
            cells[k].classList.add(k === active ? 'choice-hl-active' : 'choice-hl-dim');
          }
        };
        a.addEventListener('timeupdate', applyHL);
        a.addEventListener('seeked', applyHL);
        a.addEventListener('ended', clearHL);
        applyHL();
      }

      if (a) { a.play().catch(function() {}); }
      setTimeout(function() {
        var allBtns = document.querySelectorAll(
          '#jspsych-html-button-response-btngroup button'
        );
        if (allBtns && allBtns.length > 0) {
          allBtns[0].disabled = true;
        }
      }, 50);
    },

    // Guard against a null response (should not occur in normal flow,
    // since Next is disabled until a picture is chosen) so the data
    // fields are always well-defined.
    on_finish: function(data) {
      var sel               = window.grandmaCurrentResponse;
      var responseMissing   = (sel === null);
      data.response         = sel;
      data.response_missing = responseMissing;
      data.selected_side    = responseMissing
        ? 'none'
        : (sel === 0 ? 'left' : 'right');
      data.is_correct       = !responseMissing &&
                              ((sel === 0 && correctSide === 'left') ||
                               (sel === 1 && correctSide === 'right'));
      data.correct_side     = correctSide;
      data.family_id        = familyId;
      data.question_type    = qType;
    },

    post_trial_gap: 400,
    data: { slide_type: 'choice', family_id: familyId, question_type: qType }
  };
}

// ================================================================
// BUILD ONE FAMILY BLOCK
// ================================================================
function buildFamilyTrials(family, condition, familyIndex, totalFamilies) {
  var useAlt  = (condition === 1 || condition === 3);
  var q2First = (condition === 2 || condition === 3);

  var q1L    = useAlt ? family.q1_img_B     : family.q1_img_A;
  var q1R    = useAlt ? family.q1_img_A     : family.q1_img_B;
  var q1Aud  = useAlt ? family.q1_audio_alt : family.q1_audio_orig;
  var q1Txt  = useAlt ? family.q1_alt_text  : family.q1_orig_text;
  var q1Side = useAlt
    ? (family.q1_correct_is_B ? 'left'  : 'right')
    : (family.q1_correct_is_B ? 'right' : 'left');

  var q2L    = useAlt ? family.q2_img_B     : family.q2_img_A;
  var q2R    = useAlt ? family.q2_img_A     : family.q2_img_B;
  var q2Aud  = useAlt ? family.q2_audio_alt : family.q2_audio_orig;
  var q2Txt  = useAlt ? family.q2_alt_text  : family.q2_orig_text;
  var q2Side = useAlt
    ? (family.q2_correct_is_B ? 'left'  : 'right')
    : (family.q2_correct_is_B ? 'right' : 'left');

  var fid  = family.id;
  var base = { family_id: fid };
  var fi   = familyIndex;
  var tot  = totalFamilies;

  var slides = [
    makeSlide(family.intro_img, family.intro_audio, family.intro_text,
      Object.assign({}, base, { slide: 'intro'      }), fi, tot),
    makeSlide(family.mom_img,   family.mom_audio,   family.mom_text,
      Object.assign({}, base, { slide: 'mom'        }), fi, tot),
    makeSlide(family.foil_img,  family.foil_audio,  family.foil_text,
      Object.assign({}, base, { slide: 'foil'       }), fi, tot),
    makeSlide(family.all_img,   family.all_audio,   family.all_text,
      Object.assign({}, base, { slide: 'all'        }), fi, tot),
    makeSlide(IMG_ORIG + 'Grandma-Definition.jpg', 'Definition.mp3', null,
      Object.assign({}, base, { slide: 'definition' }), fi, tot)
  ];

  var visitSlide = makeSlide(
    family.visit_img, family.visit_audio, family.visit_text,
    Object.assign({}, base, { slide: 'visit' }), fi, tot
  );
  // Choice-1 (grandma): each candidate portrait wears its shape badge.
  // Choice-2 (house): the same portraits sit inside colored houses.
  // The mom is the correct answer, so A/B follow q1_correct_is_B; colors and
  // left/right order match the narration and the alt (flipped) versions.
  var sh = FAMILY_SHAPES[family.id] ||
    { mom: { shape: 'circle', color: '#888888' }, foil: { shape: 'square', color: '#888888' } };
  var lab = FAMILY_LABELS[family.id] || { mom: '', foil: '', son: '' };
  var momInfo  = { shape: sh.mom.shape,  color: sh.mom.color,  label: lab.mom };
  var foilInfo = { shape: sh.foil.shape, color: sh.foil.color, label: lab.foil };
  var shapeA = family.q1_correct_is_B ? foilInfo : momInfo;
  var shapeB = family.q1_correct_is_B ? momInfo  : foilInfo;
  var q1Opts = { shapes: {
    left:  useAlt ? shapeB : shapeA,
    right: useAlt ? shapeA : shapeB
  }, highlight: { times: [4, 7.5] } };
  var houseA = { img: family.q1_img_A,
    color: (family.q1_correct_is_B ? sh.foil.color : sh.mom.color),
    label: (family.q1_correct_is_B ? lab.foil : lab.mom) };
  var houseB = { img: family.q1_img_B,
    color: (family.q1_correct_is_B ? sh.mom.color  : sh.foil.color),
    label: (family.q1_correct_is_B ? lab.mom  : lab.foil) };
  var q2Opts = { houses: {
    left:  useAlt ? houseB : houseA,
    right: useAlt ? houseA : houseB
  }, highlight: { times: [2, 6], end: 7.5 } };

  var q1Trial = makeChoiceTrial(
    q1Aud, q1L, q1R, q1Side, q1Txt, fid, 'grandma', fi, tot, q1Opts
  );
  var q2Trial = makeChoiceTrial(
    q2Aud, q2L, q2R, q2Side, q2Txt, fid, 'house', fi, tot, q2Opts
  );

  var qSlides = q2First
    ? [visitSlide, q2Trial, q1Trial]
    : [q1Trial, visitSlide, q2Trial];

  return slides.concat(qSlides);
}

// ================================================================
// SHUFFLE
// ================================================================
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j   = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// ================================================================
// BUILD FAMILY ORDER AND EXPERIMENT TRIALS
// ================================================================
var set1 = shuffle(FAMILIES.filter(function(f) { return f.set === 1; }));
var set2 = shuffle(FAMILIES.filter(function(f) { return f.set === 2; }));
var orderedFamilies = Math.random() < 0.5 ? set1.concat(set2) : set2.concat(set1);
var TOTAL_FAMILIES  = orderedFamilies.length;

console.log('Family order: ' +
  orderedFamilies.map(function(f) { return f.id; }).join(', '));

var expTrials = [];
for (var i = 0; i < orderedFamilies.length; i++) {
  var block = buildFamilyTrials(orderedFamilies[i], CONDITION, i, TOTAL_FAMILIES);
  for (var j = 0; j < block.length; j++) { expTrials.push(block[j]); }
}

// Number every story/question screen sequentially (in the order the child
// actually sees them) for the "Slide N of M" on-screen counter, and record
// both values in the data for each trial.
var STORY_SLIDE_TOTAL = expTrials.length;
for (var sIdx = 0; sIdx < expTrials.length; sIdx++) {
  if (!expTrials[sIdx].data) { expTrials[sIdx].data = {}; }
  expTrials[sIdx].data.slide_number = sIdx + 1;
  expTrials[sIdx].data.slide_total  = STORY_SLIDE_TOTAL;
}

// ================================================================
// CHS TIMELINE STEPS
// ================================================================

var videoConfig = {
  type: chsRecord.VideoConfigPlugin,
  on_load: cameraTrialOnLoad       // ADMIN: remove before launch
};

var videoConsent = {
  type: chsRecord.VideoConsentPlugin,
  on_load: cameraTrialOnLoad,      // ADMIN: remove before launch
  PIName: "Ashley Thomas",
  institution: "Harvard University",
  PIContact: "Ashley Thomas at athomas@g.harvard.edu",
  purpose:
    "This study aims to measure children's early understanding of the term \"grandma\" " +
    "through a novel task where the term was embedded and applied in the context of a story.",
  procedures:
    "Your child will be shown different families across several trials. The study will consist " +
    "of a short story about a mother and their child. Then there will be two other characters " +
    "introduced, one of which will be the mother's friend or aunt. The other will be the mother " +
    "of the mom introduced earlier. Participants will be asked which one they believe is the " +
    "child's grandmother, and which house the child would go to in order to visit their grandma. " +
    "These questions may appear in the reverse order as well. After selecting, the cycle will " +
    "repeat with a different family.",
  risk_statement:
    "There are no expected risks if you participate in the study.",
  payment:
    "After you finish the study, we will email you a $5 Tremendous or $5 Target (participant " +
    "choice) gift card within approximately one week. To be eligible for the gift card your " +
    "child must be in the age range for this study, you need to submit a valid consent " +
    "statement, and we need to see that there is a child with you. But we will send a gift " +
    "card even if you do not finish the whole study or we are not able to use your child's " +
    "data! There are no other direct benefits to you or your child from participating, but " +
    "we hope you will enjoy the experience.",
  datause:
    "We are primarily interested in your child's understanding of who is a grandma on screen " +
    "and their responses. A researcher will watch your video and note down their responses.",
  include_databrary: true,
  gdpr: false,
  research_rights_statement:
    "You are not waiving any legal claims, rights or remedies because of your participation " +
    "in this research study. If you feel you have been treated unfairly, or you have questions " +
    "regarding your rights as a research subject, you may contact the Harvard Committee on the " +
    "Use of Human Subjects (CUHS), Harvard University, 1350 Massachusetts Avenue Smith Campus " +
    "Center Suite 645 Cambridge, MA 02138 OR cuhs@harvard.edu."
};

var startRecording = {
  type: chsRecord.StartRecordPlugin,
  on_load: cameraTrialOnLoad,      // ADMIN: remove before launch
  on_finish: hideAdminBar          // ADMIN: hides the bar on the normal (non-skip) path
};

// ----------------------------------------------------------------
// PRELOAD TRIAL
// ----------------------------------------------------------------
var preloadTrial = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div style="min-height:55vh;display:-webkit-flex;display:flex;' +
    '-webkit-flex-direction:column;flex-direction:column;' +
    '-webkit-align-items:center;align-items:center;' +
    '-webkit-justify-content:center;justify-content:center;' +
    'font-family:Arial,sans-serif;text-align:center;padding:40px 20px;">' +
      '<h2 style="color:#4361ee;font-size:34px;margin:0 0 10px;">' +
        'Getting the game ready\u2026' +
      '</h2>' +
      '<p style="color:#888;font-size:16px;margin:0 0 28px;">' +
        'Loading pictures and sounds\u2026' +
      '</p>' +
      '<div class="gp-bar-outer">' +
        '<div id="gp-inner" class="gp-bar-inner"></div>' +
      '</div>' +
      '<p id="gp-pct" style="color:#4361ee;font-weight:700;' +
         'font-size:18px;margin:12px 0 0;">0%</p>' +
    '</div>',
  choices: ['Continue'],
  on_load: function() {
    hideAdminBar();   // ADMIN: ensure the skip bar is gone once we leave camera setup

    var btn = document.querySelector(
      '#jspsych-html-button-response-btngroup button'
    );
    if (btn) btn.disabled = true;

    var proceeded = false;
    function proceed() {
      if (proceeded) return;
      proceeded = true;
      var bar = document.getElementById('gp-inner');
      var lbl = document.getElementById('gp-pct');
      if (bar) bar.style.width = '100%';
      if (lbl) lbl.textContent = '100%';
      setTimeout(function() {
        var b = document.querySelector(
          '#jspsych-html-button-response-btngroup button'
        );
        if (b) { b.disabled = false; b.click(); }
      }, 600);
    }

    whenPreloadDone(proceed);
    setTimeout(proceed, 12000);
  },
  data: { slide_type: 'preload' }
};

// ----------------------------------------------------------------
// INSTRUCTIONS
// ----------------------------------------------------------------
var instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="game-title-screen">' +
      '<h1 class="game-title">Grandma, What Gray Hair You Have!</h1>' +
      '<p class="game-subtitle">A story game about families</p>' +
      '<div class="game-parent-box">' +
        '<strong>Hello, and thank you for doing our study!</strong><br>' +
        'This game looks at how young children understand the word ' +
        '\u201Cgrandma\u201D \u2014 as it comes up in a few short family stories. ' +
        'Grown-ups, please stay for this quick setup; after that, the game ' +
        'is for your child.' +
        '<br><br>' +
        '<strong>Please do not help your child answer.</strong> ' +
        'Have your child listen to each story and answer on their own, ' +
        'without guidance.' +
      '</div>' +
      '<audio id="intro-audio" preload="auto">' +
        '<source src="' + AUDIO + 'introduction.mp3" type="audio/mpeg">' +
        '<source src="' + AUDIO + 'introduction.mp3" type="audio/mp3">' +
      '</audio>' +
      '<button class="replay-btn" onclick="' +
        'var a=document.getElementById(\'intro-audio\');' +
        'a.currentTime=0;a.play();">' +
        'Replay' +
      '</button>' +
    '</div>',
  choices: ["Continue to camera setup \u27A4"],
  on_load: function() {
    var a = document.getElementById('intro-audio');
    if (a) { a.play().catch(function() {}); }
  },
  data: { slide_type: 'instructions' }
};

// ----------------------------------------------------------------
// SETUP COMPLETE / HAND-OFF TO CHILD SLIDE
// Shown after camera setup (and the loading screen), right before the game.
// Tells the grown-up the setup portion is done, to watch from a distance,
// not to help with answers, and to step in only for technology problems.
// ----------------------------------------------------------------
var setupCompleteSlide = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="game-title-screen">' +
      '<span class="game-mascot" style="font-size:64px;">\u2705</span>' +
      '<h1 class="game-title">All set \u2014 setup is done!</h1>' +
      '<p class="game-subtitle">The game is now for your child</p>' +
      '<div class="game-parent-box">' +
        '<strong>Grown-ups:</strong> the setup part is over. From here, ' +
        'please let your child play on their own and ' +
        '<strong>watch from a distance</strong>.' +
        '<br><br>' +
        'Please <strong>do not help your child answer</strong> the questions \u2014 ' +
        'let them listen to each story and choose independently. Only step in ' +
        'if there is a <strong>technology problem</strong> (for example, the ' +
        'sound or video not working).' +
      '</div>' +
      '<audio id="setupdone-audio" preload="auto">' +
        '<source src="' + AUDIO + 'set-up-completion.mp3" type="audio/mpeg">' +
        '<source src="' + AUDIO + 'set-up-completion.mp3" type="audio/mp3">' +
      '</audio>' +
      '<button class="replay-btn" onclick="' +
        'var a=document.getElementById(\'setupdone-audio\');' +
        'a.currentTime=0;a.play();">' +
        'Replay' +
      '</button>' +
    '</div>',
  choices: ["Play game! \u25B6"],
  on_load: function() {
    if (typeof hideAdminBar === 'function') { hideAdminBar(); }
    var a = document.getElementById('setupdone-audio');
    if (a) { a.play().catch(function() {}); }
  },
  data: { slide_type: 'setup_complete' }
};

var stopRecording = {
  type: chsRecord.StopRecordPlugin,
  max_upload_seconds: 30,
  on_load: stopRecordOnLoad        // ADMIN: self-skips during a fast-forward
};

// ----------------------------------------------------------------
// GROWN-UP HANDOFF (reward) SLIDE
// A celebratory screen shown after the trials and before the email page.
// It congratulates the child and asks them to fetch a grown-up for the
// remaining adult steps (gift-card email + debrief). Its Continue button
// is worded as the child confirming a grown-up is present.
// ----------------------------------------------------------------
var grownupHandoff = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="handoff-screen">' +
      '<div class="game-mascot" style="font-size:66px;margin-bottom:2px;">' +
        '\uD83C\uDF89' +
      '</div>' +
      '<div class="handoff-stars">' +
        '<span>\u2605</span><span>\u2605</span><span>\u2605</span>' +
        '<span>\u2605</span><span>\u2605</span>' +
      '</div>' +
      '<h1 class="handoff-title">You did it!</h1>' +
      '<p class="handoff-sub">Great job finishing the game!</p>' +
      '<div class="handoff-msg">' +
        'Now please go get a <strong>grown-up</strong> to sit with you. ' +
        'They will help with the last part and read about the game. ' +
        'When your grown-up is here with you, tap the button below!' +
      '</div>' +
      '<audio id="handoff-audio" preload="auto">' +
        '<source src="' + AUDIO + 'completion.mp3" type="audio/mpeg">' +
        '<source src="' + AUDIO + 'completion.mp3" type="audio/mp3">' +
      '</audio>' +
      '<button class="replay-btn" onclick="' +
        'var a=document.getElementById(\'handoff-audio\');' +
        'a.currentTime=0;a.play();">' +
        'Replay' +
      '</button>' +
    '</div>',
  choices: ['\u2B50 A grown-up is here \u2014 Continue'],
  on_load: function() {
    // ADMIN: this slide is now where "Skip to grown-up screen" lands, so it
    // does NOT self-skip. wrapupPageOnLoad ends the fast-forward and shows
    // the per-page "Skip this page" button (to advance on to the email page).
    if (typeof wrapupPageOnLoad === 'function') { wrapupPageOnLoad(); }
    var a = document.getElementById('handoff-audio');
    if (a) { a.play().catch(function() {}); }
  },
  data: { slide_type: 'handoff', trial_type: 'grownup_handoff' }
};

// ----------------------------------------------------------------
// EMAIL TRIAL
// ----------------------------------------------------------------
var emailTrial = {
  type: jsPsychSurveyText,
  preamble:
    '<div style="max-width:720px;margin:24px auto 18px;padding:28px 30px;' +
    'border:3px solid #d7e9ee;border-radius:24px;' +
    'background:-webkit-linear-gradient(145deg,#ffffff 0%,#f3fbff 100%);' +
    'background:linear-gradient(145deg,#ffffff 0%,#f3fbff 100%);' +
    'box-shadow:0 16px 38px rgba(41,62,82,.12);' +
    'font-family:Arial,sans-serif;text-align:left;">' +
      '<div style="display:-webkit-flex;display:flex;' +
                  '-webkit-align-items:center;align-items:center;gap:17px;">' +
        '<div>' +
          '<span style="color:#278473;font-size:14px;font-weight:800;' +
          'text-transform:uppercase;letter-spacing:.06em;">Gift card delivery</span>' +
          '<h2 style="margin:5px 0 5px;font-size:34px;line-height:1.1;color:#17466f;">' +
            '<strong style="color:#126c5b;">Enter your email</strong> ' +
            'to get your gift card' +
          '</h2>' +
          '<p style="margin:0;color:#5b6b78;font-size:17px;line-height:1.5;">' +
            'Please enter the same email address twice and check the spelling carefully. ' +
            'Your $5 gift card (Tremendous or Target, your choice) will usually be sent ' +
            'within one week. Your email will remain confidential and will only be used ' +
            'to send your gift card.' +
          '</p>' +
        '</div>' +
      '</div>' +
    '</div>',
  questions: [
    {
      prompt: "Email address",
      placeholder: "name@example.com",
      name: "email",
      required: true
    },
    {
      prompt: "Enter the same email address again",
      placeholder: "name@example.com",
      name: "email_confirm",
      required: true
    }
  ],
  button_label: "Continue",
  on_load: function() {
    // ADMIN: show the per-page "Skip this page" button (and end any fast-
    // forward defensively). Skip-to-grown-up now lands on the handoff slide,
    // not here. (No effect once the ADMIN block is removed for launch.)
    if (typeof wrapupPageOnLoad === 'function') { wrapupPageOnLoad(); }
    var form = document.querySelector("#jspsych-survey-text-form");
    if (!form) return;
    var inputs = form.querySelectorAll("input");
    if (inputs.length < 2) return;
    var emailInput   = inputs[0];
    var confirmInput = inputs[1];

    var clearMismatch = function() { confirmInput.setCustomValidity(""); };
    emailInput.addEventListener("input", clearMismatch);
    confirmInput.addEventListener("input", clearMismatch);

    // Capture-phase listener on document runs BEFORE jsPsych's own submit
    // handler (which is on the form itself, i.e. the target phase). That
    // lets us cancel a mismatched submission before the trial advances.
    window._emailSubmitGuard = function(event) {
      if (event.target !== form) return;
      var email        = String(emailInput.value   || "").trim().toLowerCase();
      var confirmation = String(confirmInput.value || "").trim().toLowerCase();
      if (email !== confirmation) {
        event.preventDefault();
        event.stopPropagation();   // stops the event before it reaches jsPsych's handler
        confirmInput.setCustomValidity(
          "The email addresses do not match. Please check the spelling and try again."
        );
        confirmInput.reportValidity();
      }
    };
    document.addEventListener("submit", window._emailSubmitGuard, true);
  },
  on_finish: function(data) {
    // Remove the capture-phase guard so it never lingers past this trial.
    if (window._emailSubmitGuard) {
      document.removeEventListener("submit", window._emailSubmitGuard, true);
      window._emailSubmitGuard = null;
    }
    var email = "";
    if (data.response && data.response.email) { email = data.response.email; }
    jsPsych.data.addProperties({ payment_email: email });
  },
  data: { trial_type: "payment_email" }
};

var exitSurvey = {
  type: chsSurvey.ExitSurveyPlugin,
  includeWithdrawalExample: false,
  on_load: wrapupPageOnLoad        // ADMIN: shows the "Skip this page" button
};

// ----------------------------------------------------------------
// DEBRIEF
// ----------------------------------------------------------------
var debrief = {
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div style="min-height:calc(100vh - 90px);padding:34px 20px;' +
    'background:-webkit-linear-gradient(145deg,#fff9d9 0%,#edfaff 55%,#f7f1ff 100%);' +
    'background:linear-gradient(145deg,#fff9d9 0%,#edfaff 55%,#f7f1ff 100%);' +
    'box-sizing:border-box;font-family:Arial,sans-serif;color:#263b50;text-align:left;">' +
      '<main style="max-width:920px;margin:0 auto;">' +

        '<header style="display:-webkit-flex;display:flex;' +
        '-webkit-align-items:center;align-items:center;' +
        'gap:18px;margin-bottom:22px;padding:26px 28px;border-radius:24px;' +
        'background:#fff;box-shadow:0 15px 38px rgba(41,62,82,.12);">' +
          '<div style="display:grid;place-items:center;flex:0 0 78px;' +
          'width:78px;height:78px;border-radius:50%;background:#ffd15c;' +
          'border:7px solid #fff;box-shadow:0 6px 18px rgba(41,62,82,.16);' +
          'font-size:38px;">\u2713</div>' +
          '<div>' +
            '<span style="color:#278473;font-size:15px;font-weight:800;' +
            'text-transform:uppercase;letter-spacing:.06em;">All done</span>' +
            '<h2 style="margin:5px 0 4px;font-size:40px;line-height:1.05;' +
            'color:#17466f;text-align:left;">Thank you for participating!</h2>' +
          '</div>' +
        '</header>' +

        '<section style="display:grid;gap:14px;">' +

          '<article style="padding:22px 24px;border-left:7px solid #4f91c8;' +
          'border-radius:16px;background:#fff;' +
          'box-shadow:0 8px 22px rgba(41,62,82,.08);">' +
            '<h3 style="margin:0 0 8px;font-size:22px;color:#17466f;">' +
              '1. What we are studying</h3>' +
            '<p style="margin:0;font-size:17px;line-height:1.55;">' +
              'We\'re curious about something simple but surprisingly tricky: how ' +
              'do young children figure out what the word "grandma" really means? ' +
              'Do they understand that a grandma is their mom\'s mom — even when ' +
              'another kind, older woman is standing right there too? These little ' +
              'stories were our playful way of exploring that idea.' +
            '</p>' +
          '</article>' +

          '<article style="padding:22px 24px;border-left:7px solid #57ad95;' +
          'border-radius:16px;background:#fff;' +
          'box-shadow:0 8px 22px rgba(41,62,82,.08);">' +
            '<h3 style="margin:0 0 8px;font-size:22px;color:#245c50;">' +
              '2. What your child did</h3>' +
            '<p style="margin:0;font-size:17px;line-height:1.55;">' +
              'Your child listened to short stories about different families — a mom, ' +
              'her child, her own mom, and one other grown-up (a friend or an aunt). ' +
              'For each family, your child got to decide who the grandma was, and ' +
              'which house they\'d go to in order to visit her. Then a brand-new ' +
              'family came along, and they got to do it all again.' +
            '</p>' +
          '</article>' +

          '<article style="padding:22px 24px;border-left:7px solid #9a7bd5;' +
          'border-radius:16px;background:#fff;' +
          'box-shadow:0 8px 22px rgba(41,62,82,.08);">' +
            '<h3 style="margin:0 0 8px;font-size:22px;color:#5b438e;">' +
              '3. How we interpret the answers</h3>' +
            '<p style="margin:0;font-size:17px;line-height:1.55;">' +
              'There are no right or wrong answers here — every child sees these ' +
              'stories a little differently, and that\'s exactly what makes them so ' +
              'interesting to us. We look at how lots of children answer all together, ' +
              'never any single child on their own. Whatever your child chose, they ' +
              'helped us learn something. Thank you!' +
            '</p>' +
          '</article>' +

          '<article style="padding:22px 24px;border-left:7px solid #e3ad39;' +
          'border-radius:16px;background:#fff;' +
          'box-shadow:0 8px 22px rgba(41,62,82,.08);">' +
            '<h3 style="margin:0 0 8px;font-size:22px;color:#755619;">' +
              '4. Variation across participants</h3>' +
            '<p style="margin:0;font-size:17px;line-height:1.55;">' +
              'To keep things fair, we mix the game up a little from child to child. ' +
              'Your child saw just one version of it — other children might have had:' +
            '</p>' +
            '<ul style="margin:10px 0 0;font-size:17px;line-height:1.55;padding-left:22px;">' +
              '<li>A different question first (who\'s the grandma, or which house)</li>' +
              '<li>The pictures on the opposite sides (left or right)</li>' +
              '<li>The families showing up in a different order</li>' +
              '<li>A different family to start with</li>' +
            '</ul>' +
          '</article>' +

          '<article style="padding:22px 24px;border-left:7px solid #f07b6d;' +
          'border-radius:16px;background:#fff;' +
          'box-shadow:0 8px 22px rgba(41,62,82,.08);">' +
            '<h3 style="margin:0 0 8px;font-size:22px;color:#994235;">' +
              '5. Gift card</h3>' +
            '<p style="margin:0;font-size:17px;line-height:1.55;">' +
              'As a thank-you, we\'ll email your $5 gift card (Tremendous or Target — ' +
              'whichever you chose), usually within about a ' +
              'week. Thanks so much for spending time with us today!' +
            '</p>' +
          '</article>' +

        '</section>' +
      '</main>' +
    '</div>',
  choices: ["Finish"],
  on_load: function() {
    // ADMIN: final page — clear any skip state and hide the bar.
    window.ADMIN_FASTFWD     = false;
    window.ADMIN_SKIP_TARGET = null;
    window.ADMIN_SKIP_TO_DEBRIEF = false;
    if (typeof hideAdminBar === 'function') { hideAdminBar(); }
  },
  data: { trial_type: "debrief" }
};

// ================================================================
// PUSH TO TIMELINE AND RUN
// ================================================================

// ADMIN: the camera-setup steps are grouped into a single nested
// timeline so the "Skip camera setup" button can abort exactly this
// block (via jsPsych.abortCurrentTimeline) and let the study continue.
// To go live: replace this cameraSetup node with the three plugins
// pushed directly, i.e. timeline.push(instructions, videoConfig,
// videoConsent, startRecording, preloadTrial);
var cameraSetup = {
  timeline: [videoConfig, videoConsent, startRecording]
};

// Intro/instructions now come FIRST — before camera setup and consent —
// per supervisor request. Order: intro -> camera setup + consent + start
// recording -> "getting ready" preload -> "setup done, watch from a
// distance" hand-off -> trials.
timeline.push(instructions, cameraSetup, preloadTrial, setupCompleteSlide);

for (var t = 0; t < expTrials.length; t++) {
  timeline.push(expTrials[t]);
}

// Only run StopRecordPlugin if recording actually started. If the admin
// skip button was used, CAMERA_SKIPPED is true and this node is skipped
// so StopRecordPlugin never errors on a session that never recorded.
// To go live: you can drop the conditional and push stopRecording directly.
var stopRecordingNode = {
  timeline: [stopRecording],
  conditional_function: function() { return !window.CAMERA_SKIPPED; }
};

timeline.push(stopRecordingNode, grownupHandoff, exitSurvey, debrief);

jsPsych.run(timeline);

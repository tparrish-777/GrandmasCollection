GRANDMA STUDY — EDIT ON GITHUB, THEN IMPORT INTO CHS

Target: CHS study 5965, “Grandma, what gray hair you have!”
Source captured: October 16, 2026

FILES
study.js is the editable source. The first copy is identical to the current CHS code.
releases/grandma-v1-2026-10-16.js is the frozen first import release.
index.html is the researcher workspace with preview and copy/import controls.
preview.html and preview.js run the story game without CHS-specific steps.
chs/original-study-5965.js is the unchanged local backup.

PUBLISH
Put this folder at grandma-study/ inside tparrish-777/GrandmasCollection.
Use GitHub Pages with main branch and the repository root as its publishing source.
The expected study workspace is:
https://tparrish-777.github.io/GrandmasCollection/grandma-study/
The editable source is:
https://github.com/tparrish-777/GrandmasCollection/blob/main/grandma-study/study.js

UPDATE THE STUDY
1. Edit study.js on GitHub and commit your changes.
2. Wait for GitHub Pages to publish, then open the draft preview from index.html.
3. Choose “Copy current draft for CHS.”
4. In CHS study 5965, open Edit Study Design, click the code editor, replace the
   jsPsych Experiment Code with the complete copied JavaScript, and Save Changes.
5. Keep the existing CHS plugin selections. Use CHS Preview Study to verify
   consent, camera setup, recording, story choices, upload completion, and exit survey.
6. When keeping a release for later, copy study.js to a new releases/grandma-vN-YYYY-MM-DD.js
   filename and commit it. Never overwrite an older frozen release.

GitHub changes do not automatically change the code stored in CHS. Importing is
the deliberate copy/paste step above. There was no native GitHub import field in
the inspected CHS jsPsych editor. Do not replace the study with an external-study
URL: the existing CHS recording and per-trial data behavior should stay in CHS.

PREVIEW AND PRESERVATION
The preview uses jsPsych 8.2.1 and HTML Button Response / Survey Text 2.1.0.
It executes study.js with a preview adapter that omits only CHS camera, consent,
recording and exit-survey nodes. It requests no camera permission and sends no
study responses. The preview retains the existing researcher skip controls.
The preview is for researchers. Participants should continue to use the CHS link.
During story screens, its researcher bar provides Back one story screen, Start
from beginning, Next family, and Skip to debrief. Back and Start reload the
no-data preview at the selected numbered slide while preserving the condition
and randomized family order. Restart returns to the preview start screen, and
Study workspace returns to index.html. The newly added Back/Start/Skip to
debrief controls are preview-only; the imported CHS code retains its existing
camera skip, next-family, skip-to-grown-up, and skip-page controls.

All eight families, four conditions, 64 story/question trials, recorded narration,
image paths and existing study logic are preserved in the initial import release.
Existing testing controls are marked “REMOVE BEFORE LAUNCH” in the original code.
The original emailTrial is defined but is not part of its final timeline; this
migration preserves that existing behavior.

Images and audio still use the existing absolute URLs in GrandmasCollection.
GitHub history versions the study code; media files are still the existing shared
assets, so replacing media in those existing paths can affect all code versions.

Find the Caregiver! (6079) and Who Helps Where? (6349) were read-only references.
Their GitHub code and CHS studies were not changed. No CHS study was changed as
part of preparing this GitHub package.

REFERENCE
https://lookit.readthedocs.io/en/develop/researchers-start-here.html
https://lookit.readthedocs.io/projects/chs-jspsych/en/latest/lookit-initjspsych/
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

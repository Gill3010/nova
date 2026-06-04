const OJS_URL = 'https://dev.relaticpanama.org/_journals';
const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.IjVlY2E3MDIyZmFmOTNmM2YwMDFmMzU3NDhlNGIxOTY0ODc4N2U1ODci.b9zZBrcVyDvTSSGLiLYjyIympvC30XfBX-uxMrDfRdU';

async function run() {
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };

  let journal = null;
  try {
    const res = await fetch(`${OJS_URL}/index.php/index/api/v1/contexts`, { headers });
    const data = await res.json();
    journal = data.items?.[0];
  } catch (err) {
    console.error('Error fetching contexts:', err);
    return;
  }

  const JOURNAL_PATH = journal.urlPath;
  const locale = Object.keys(journal.name)[0] || 'es_ES';

  let submission = null;
  try {
    const payload = {
      locale: locale,
      sectionId: 1,
      publication: {
        title: { [locale]: 'Nova Test Submission' },
        abstract: { [locale]: 'This is a test submission from Nova.' }
      }
    };
    const res = await fetch(`${OJS_URL}/index.php/${JOURNAL_PATH}/api/v1/submissions`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    submission = await res.json();
    console.log('--- FULL SUBMISSION RESPONSE ---');
    console.log(JSON.stringify(submission, null, 2));
    console.log('--------------------------------');
  } catch (err) {
    console.error('Error creating submission:', err);
    return;
  }
}

run();

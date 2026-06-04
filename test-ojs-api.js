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

  // 1. Crear el envío
  console.log('1. Creating submission...');
  let submission = null;
  try {
    const payload = {
      locale: locale,
      sectionId: 1
    };
    const res = await fetch(`${OJS_URL}/index.php/${JOURNAL_PATH}/api/v1/submissions`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    submission = await res.json();
    console.log('Submission created. ID:', submission.id);
  } catch (err) {
    console.error('Error creating submission:', err);
    return;
  }

  const submissionId = submission.id;
  const publicationId = submission.currentPublicationId || (submission.publications && submission.publications[0]?.id);
  console.log('Publication ID:', publicationId);

  // 2. Intentar actualizar la publicación con PUT
  console.log('\n2. Updating publication via PUT...');
  try {
    const pubPayload = {
      title: { [locale]: 'Nova Test Title via PUT' },
      abstract: { [locale]: 'This is a test abstract updated via PUT.' }
    };
    const res = await fetch(`${OJS_URL}/index.php/${JOURNAL_PATH}/api/v1/submissions/${submissionId}/publications/${publicationId}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(pubPayload)
    });
    const updatedPub = await res.json();
    console.log('PUT Response Status:', res.status);
    console.log('Updated Title:', updatedPub.title);
    console.log('Updated Abstract:', updatedPub.abstract);
  } catch (err) {
    console.error('Error updating publication:', err);
  }
}

run();

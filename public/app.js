const RELEASE_STEPS = [
  'All relevant GitHub pull requests have been merged',
  'CHANGELOG.md updated',
  'All tests are passing',
  'Release artifacts built',
  'Deployed in staging',
  'Smoke tests completed',
  'Deployed in production',
];

const state = { releases: [], selectedRelease: null };
const dom = {
  releaseList: document.getElementById('releaseList'),
  newReleaseButton: document.getElementById('newReleaseButton'),
  releaseFormContainer: document.getElementById('release-form-container'),
  releaseListContainer: document.getElementById('release-list-container'),
  formTitle: document.getElementById('formTitle'),
  deleteReleaseButton: document.getElementById('deleteReleaseButton'),
  releaseForm: document.getElementById('releaseForm'),
  cancelButton: document.getElementById('cancelButton'),
  name: document.getElementById('name'),
  due_date: document.getElementById('due_date'),
  additional_info: document.getElementById('additional_info'),
  steps: document.getElementById('steps'),
};

const api = {
  getReleases: () => fetch('/api/releases').then((r) => r.json()),
  createRelease: (data) => fetch('/api/releases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json()),
  updateRelease: (id, data) => fetch(`/api/releases/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json()),
  deleteRelease: (id) => fetch(`/api/releases/${id}`, { method: 'DELETE' }),
};

const formatDate = (v) => new Date(v).toLocaleString();

const renderReleaseList = () => {
  dom.releaseList.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead><tr><th>Release</th><th>Due date</th><th>Status</th><th>Action</th></tr></thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  state.releases.forEach((release) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${release.name}</td>
      <td>${formatDate(release.due_date)}</td>
      <td><span class="status-pill status-${release.status}">${release.status}</span></td>
      <td><button class="btn-small" data-id="${release.id}">View</button></td>
    `;
    tbody.appendChild(row);
  });

  dom.releaseList.appendChild(table);
  dom.releaseList.querySelectorAll('.btn-small').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      openRelease(id);
    });
  });
};

const openRelease = (id) => {
  const selected = state.releases.find((r) => r.id === id);
  if (!selected) return;
  state.selectedRelease = selected;
  dom.formTitle.textContent = `Edit: ${selected.name}`;
  dom.releaseFormContainer.classList.remove('hidden');
  dom.releaseListContainer.classList.add('hidden');
  dom.deleteReleaseButton.classList.remove('hidden');

  dom.name.value = selected.name;
  dom.due_date.value = new Date(selected.due_date).toISOString().slice(0, 16);
  dom.additional_info.value = selected.additional_info || '';

  renderSteps(selected.steps);
};

const renderSteps = (currentSteps = []) => {
  dom.steps.innerHTML = '';
  const steps = currentSteps.length === RELEASE_STEPS.length ? currentSteps : Array(RELEASE_STEPS.length).fill(false);
  steps.forEach((value, index) => {
    const row = document.createElement('label');
    row.innerHTML = `<input type="checkbox" data-step="${index}" ${value ? 'checked' : ''} /> ${RELEASE_STEPS[index]}`;
    dom.steps.appendChild(row);
  });
};

const getFormPayload = () => {
  const steps = Array.from(dom.steps.querySelectorAll('input[type=checkbox]')).map((input) => input.checked);
  return {
    name: dom.name.value.trim(),
    due_date: dom.due_date.value,
    additional_info: dom.additional_info.value.trim(),
    steps,
  };
};

const resetForm = () => {
  state.selectedRelease = null;
  dom.formTitle.textContent = 'New Release';
  dom.name.value = '';
  dom.due_date.value = '';
  dom.additional_info.value = '';
  renderSteps(Array(RELEASE_STEPS.length).fill(false));
  dom.deleteReleaseButton.classList.add('hidden');
};

const showForm = () => {
  dom.releaseFormContainer.classList.remove('hidden');
  dom.releaseListContainer.classList.add('hidden');
  resetForm();
};

const hideForm = () => {
  dom.releaseFormContainer.classList.add('hidden');
  dom.releaseListContainer.classList.remove('hidden');
};

const loadReleases = async () => {
  state.releases = await api.getReleases();
  renderReleaseList();
};

dom.newReleaseButton.addEventListener('click', () => {
  state.selectedRelease = null;
  showForm();
});

dom.cancelButton.addEventListener('click', () => {
  hideForm();
});

dom.deleteReleaseButton.addEventListener('click', async () => {
  if (!state.selectedRelease) return;
  await api.deleteRelease(state.selectedRelease.id);
  await loadReleases();
  hideForm();
});

dom.releaseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = getFormPayload();

  if (!payload.name || !payload.due_date) {
    alert('Name and due date are required');
    return;
  }

  if (state.selectedRelease) {
    await api.updateRelease(state.selectedRelease.id, payload);
  } else {
    await api.createRelease(payload);
  }

  await loadReleases();
  hideForm();
});

// Initialize
renderSteps(Array(RELEASE_STEPS.length).fill(false));
loadReleases();
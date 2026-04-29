import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// The admin panel loads Supabase public configuration from a server endpoint.
// This allows Vercel environment variables to be mapped correctly at runtime.
let supabase = null;
const CATEGORY_OPTIONS = [
  'Acrylic',
  'Oil',
  'Watercolor',
  'Pastel',
  'Sketch',
  'Experiment',
  'Other',
];

const refs = {
  loginScreen: document.getElementById('login-screen'),
  adminScreen: document.getElementById('admin-screen'),
  signOutButton: document.getElementById('sign-out-button'),
  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  artworkForm: document.getElementById('artwork-form'),
  formTitle: document.getElementById('form-title'),
  cancelEditButton: document.getElementById('cancel-edit-button'),
  titleInput: document.getElementById('artwork-title'),
  descriptionInput: document.getElementById('artwork-description'),
  categorySelect: document.getElementById('artwork-category'),
  imageInput: document.getElementById('artwork-image'),
  artworkList: document.getElementById('artwork-list'),
  statusMessage: document.getElementById('status-message'),
};

let currentArtwork = null;

window.addEventListener('DOMContentLoaded', async () => {
  attachListeners();
  populateCategoryOptions();

  try {
    await initializeSupabase();
  } catch (error) {
    showMessage(error.message || 'Unable to start admin panel.', true);
  }
});

async function initializeSupabase() {
  const config = await fetchSupabaseConfig();
  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  await initializeAuth();
}

async function fetchSupabaseConfig() {
  const response = await fetch('/api/config');
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Unable to load Supabase configuration.');
  }
  return response.json();
}

function attachListeners() {
  refs.loginForm.addEventListener('submit', handleSignIn);
  refs.signOutButton.addEventListener('click', handleSignOut);
  refs.artworkForm.addEventListener('submit', handleArtworkSubmit);
  refs.cancelEditButton.addEventListener('click', resetForm);
}

async function initializeAuth() {
  if (!supabase) {
    showMessage('Supabase is not initialized.', true);
    return;
  }

  const { data } = await supabase.auth.getSession();

  if (data?.session?.user) {
    showAdminScreen();
    loadArtworks();
  } else {
    showLoginScreen();
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      showAdminScreen();
      loadArtworks();
    } else {
      showLoginScreen();
    }
  });
}

function populateCategoryOptions() {
  CATEGORY_OPTIONS.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    refs.categorySelect.appendChild(option);
  });
}

function showLoginScreen() {
  refs.loginScreen.classList.remove('hidden');
  refs.adminScreen.classList.add('hidden');
  refs.signOutButton.classList.add('hidden');
  resetForm();
}

function showAdminScreen() {
  refs.loginScreen.classList.add('hidden');
  refs.adminScreen.classList.remove('hidden');
  refs.signOutButton.classList.remove('hidden');
}

async function handleSignIn(event) {
  event.preventDefault();

  const email = refs.loginEmail.value.trim();
  const password = refs.loginPassword.value;

  if (!email || !password) {
    showMessage('Please provide both email and password.', true);
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showMessage(error.message || 'Unable to sign in. Check credentials.', true);
  } else {
    showMessage('Signed in successfully. Loading admin panel...');
    refs.loginForm.reset();
  }
}

async function handleSignOut() {
  await supabase.auth.signOut();
  showLoginScreen();
  showMessage('Signed out successfully.');
}

async function loadArtworks() {
  refs.artworkList.innerHTML = '<p>Loading artworks…</p>';

  const { data, error } = await supabase
    .from('artworks')
    .select('id, title, description, category, image_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    refs.artworkList.innerHTML = '<p class="hint">Unable to load artworks.</p>';
    showMessage(error.message, true);
    return;
  }

  renderArtworkList(data || []);
}

function renderArtworkList(artworks) {
  refs.artworkList.innerHTML = '';

  if (!artworks || artworks.length === 0) {
    refs.artworkList.innerHTML = '<p class="hint">No artworks found. Add one using the form.</p>';
    return;
  }

  artworks.forEach((artwork) => {
    const card = document.createElement('article');
    card.className = 'artwork-card';

    const image = document.createElement('img');
    image.src = artwork.image_url || 'https://via.placeholder.com/100?text=No+Image';
    image.alt = artwork.title ? `${artwork.title} artwork` : 'Artwork image';
    image.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'artwork-info';

    const title = document.createElement('h3');
    title.textContent = artwork.title;

    const meta = document.createElement('p');
    meta.textContent = `${artwork.category || 'Uncategorized'} • ${artwork.description || ''}`;

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => loadArtworkIntoForm(artwork));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => confirmDeleteArtwork(artwork));

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(image);
    card.appendChild(info);
    card.appendChild(actions);

    refs.artworkList.appendChild(card);
  });
}

function loadArtworkIntoForm(artwork) {
  currentArtwork = artwork;
  refs.formTitle.textContent = 'Edit artwork';
  refs.cancelEditButton.classList.remove('hidden');
  refs.titleInput.value = artwork.title || '';
  refs.descriptionInput.value = artwork.description || '';
  refs.categorySelect.value = artwork.category || '';
  refs.imageInput.value = '';
}

async function handleArtworkSubmit(event) {
  event.preventDefault();

  const title = refs.titleInput.value.trim();
  const description = refs.descriptionInput.value.trim();
  const category = refs.categorySelect.value;
  const imageFile = refs.imageInput.files[0];

  if (!title || !description || !category) {
    showMessage('Title, description, and category are required.', true);
    return;
  }

  let imageUrl = currentArtwork?.image_url || '';

  if (!imageUrl && !imageFile) {
    showMessage('Please upload an image for the artwork.', true);
    return;
  }

  if (imageFile) {
    const uploadedUrl = await uploadArtworkImage(imageFile);
    if (!uploadedUrl) {
      return;
    }
    imageUrl = uploadedUrl;
  }

  if (currentArtwork) {
    await updateArtwork(currentArtwork.id, { title, description, category, image_url: imageUrl });
  } else {
    await createArtwork({ title, description, category, image_url: imageUrl });
  }
}

async function uploadArtworkImage(file) {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      fileType: file.type,
      fileData: base64,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    showMessage(data.error || 'Upload failed.', true);
    return null;
  }

  return data.url;
}

async function createArtwork(payload) {
  const { error } = await supabase.from('artworks').insert([payload]);

  if (error) {
    showMessage(error.message || 'Unable to save artwork.', true);
  } else {
    showMessage('Artwork added successfully.');
    resetForm();
    loadArtworks();
  }
}

async function updateArtwork(id, payload) {
  const { error } = await supabase.from('artworks').update(payload).eq('id', id);

  if (error) {
    showMessage(error.message || 'Unable to update artwork.', true);
  } else {
    showMessage('Artwork updated successfully.');
    resetForm();
    loadArtworks();
  }
}

function confirmDeleteArtwork(artwork) {
  const confirmed = window.confirm(`Delete artwork: "${artwork.title}"?`);
  if (!confirmed) {
    return;
  }

  deleteArtwork(artwork.id);
}

async function deleteArtwork(id) {
  const { error } = await supabase.from('artworks').delete().eq('id', id);

  if (error) {
    showMessage(error.message || 'Unable to delete artwork.', true);
    return;
  }

  showMessage('Artwork deleted successfully.');
  loadArtworks();
}

function resetForm() {
  currentArtwork = null;
  refs.formTitle.textContent = 'Add artwork';
  refs.cancelEditButton.classList.add('hidden');
  refs.artworkForm.reset();
}

let toastTimeout;
function showMessage(message, isError = false) {
  refs.statusMessage.textContent = message;
  refs.statusMessage.classList.remove('hidden');
  refs.statusMessage.style.background = isError ? '#bb1f1f' : '#111';

  clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    refs.statusMessage.classList.add('hidden');
  }, 4000);
}

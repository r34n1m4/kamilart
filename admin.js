import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// =====================
// STATE
// =====================

let supabase = null;
let materialTypes = [];
let materialTypeNameById = new Map();
let currentArtwork = null;

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

// =====================
// INIT
// =====================

window.addEventListener('DOMContentLoaded', async () => {
  attachListeners();

  try {
    await initializeSupabase();
  } catch (error) {
    showMessage(error.message || 'Unable to start admin panel.', true);
  }
});

async function initializeSupabase() {
  const config = await fetchSupabaseConfig();

  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  await loadMaterialTypes();
  await initializeAuth();
}

// =====================
// CONFIG
// =====================

async function fetchSupabaseConfig() {
  const response = await fetch('/api/config');

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Unable to load Supabase configuration.');
  }

  return response.json();
}

// =====================
// LISTENERS
// =====================

function attachListeners() {
  refs.loginForm.addEventListener('submit', handleSignIn);
  refs.signOutButton.addEventListener('click', handleSignOut);
  refs.artworkForm.addEventListener('submit', handleArtworkSubmit);
  refs.cancelEditButton.addEventListener('click', resetForm);
}

// =====================
// AUTH
// =====================

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

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      showAdminScreen();
      loadArtworks();
    } else {
      showLoginScreen();
    }
  });
}

async function handleSignIn(event) {
  event.preventDefault();

  const email = refs.loginEmail.value.trim();
  const password = refs.loginPassword.value;

  if (!email || !password) {
    showMessage('Please provide both email and password.', true);
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showMessage(error.message || 'Unable to sign in.', true);
  } else {
    showMessage('Signed in successfully.');
    refs.loginForm.reset();
  }
}

async function handleSignOut() {
  await supabase.auth.signOut();
  showLoginScreen();
  showMessage('Signed out successfully.');
}

// =====================
// MATERIAL TYPES
// =====================

async function loadMaterialTypes() {
  const { data, error } = await supabase
    .from('material_types')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    showMessage(error.message || 'Unable to load material types.', true);
    materialTypes = [];
    materialTypeNameById = new Map();
    return;
  }

  materialTypes = data || [];
  materialTypeNameById = new Map(materialTypes.map(t => [t.id, t.name]));

  populateCategoryOptions();
}

function populateCategoryOptions() {
  refs.categorySelect.innerHTML = '<option value="">Select material</option>';

  materialTypes.forEach((type) => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    refs.categorySelect.appendChild(option);
  });
}

// =====================
// ARTWORKS
// =====================

async function loadArtworks() {
  refs.artworkList.innerHTML = '<p>Loading artworks…</p>';

  const { data: artworks, error } = await supabase
    .from('artworks')
    .select('id, title, description, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    refs.artworkList.innerHTML = '<p class="hint">Unable to load artworks.</p>';
    showMessage(error.message, true);
    return;
  }

  const rows = artworks || [];
  const artworkIds = rows.map(a => a.id);

  const imageMap = new Map();
  const materialMap = new Map();

  if (artworkIds.length > 0) {
    const [{ data: images }, { data: materials }] = await Promise.all([
      supabase
        .from('artwork_images')
        .select('artwork_id, url, is_main, sort_order')
        .in('artwork_id', artworkIds)
        .order('sort_order', { ascending: true }),

      supabase
        .from('artwork_materials')
        .select('artwork_id, material_type_id')
        .in('artwork_id', artworkIds),
    ]);

    (images || []).forEach(img => {
      if (!imageMap.has(img.artwork_id) || img.is_main) {
        imageMap.set(img.artwork_id, img.url);
      }
    });

    (materials || []).forEach(m => {
      if (!materialMap.has(m.artwork_id)) {
        materialMap.set(m.artwork_id, m.material_type_id);
      }
    });
  }

  const artworkData = rows.map(a => {
    const materialId = materialMap.get(a.id);

    return {
      ...a,
      image_url: imageMap.get(a.id) || '',
      material_type_id: materialId || '',
      category: materialTypeNameById.get(materialId) || '',
    };
  });

  renderArtworkList(artworkData);
}

// =====================
// RENDER
// =====================

function renderArtworkList(artworks) {
  refs.artworkList.innerHTML = '';

  if (!artworks.length) {
    refs.artworkList.innerHTML = '<p class="hint">No artworks found.</p>';
    return;
  }

  artworks.forEach((artwork) => {
    const card = document.createElement('article');
    card.className = 'artwork-card';

    const image = document.createElement('img');
    image.src = artwork.image_url || 'https://via.placeholder.com/100?text=No+Image';
    image.alt = artwork.title || 'Artwork';
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

    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.onclick = () => loadArtworkIntoForm(artwork);

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = () => confirmDeleteArtwork(artwork);

    actions.appendChild(edit);
    actions.appendChild(del);

    card.appendChild(image);
    card.appendChild(info);
    card.appendChild(actions);

    refs.artworkList.appendChild(card);
  });
}

// =====================
// FORM
// =====================

function loadArtworkIntoForm(artwork) {
  currentArtwork = artwork;

  refs.formTitle.textContent = 'Edit artwork';
  refs.cancelEditButton.classList.remove('hidden');

  refs.titleInput.value = artwork.title || '';
  refs.descriptionInput.value = artwork.description || '';
  refs.categorySelect.value = artwork.material_type_id || '';
  refs.imageInput.value = '';
}

function resetForm() {
  currentArtwork = null;

  refs.formTitle.textContent = 'Add artwork';
  refs.cancelEditButton.classList.add('hidden');

  refs.artworkForm.reset();
}

// =====================
// STATUS
// =====================

function showMessage(message, isError = false) {
  refs.statusMessage.textContent = message;
  refs.statusMessage.classList.remove('hidden');
  refs.statusMessage.style.background = isError ? '#bb1f1f' : '#111';

  clearTimeout(window.toastTimeout);

  window.toastTimeout = setTimeout(() => {
    refs.statusMessage.classList.add('hidden');
  }, 4000);
}
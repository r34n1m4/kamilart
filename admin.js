import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// The admin panel loads Supabase public configuration from a server endpoint.
// This allows Vercel environment variables to be mapped correctly at runtime.
let supabase = null;
let materialTypes = [];

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
  refs.categorySelect.innerHTML = '<option value="">Select material</option>';

  materialTypes.forEach((type) => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
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

async function loadMaterialTypes() {
  const { data, error } = await supabase
    .from('material_types')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    showMessage(error.message || 'Unable to load material types.', true);
    materialTypes = [];
  } else {
    materialTypes = data || [];
  }

  populateCategoryOptions();
}

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
  const artworkIds = rows.map((artwork) => artwork.id);

  const imageMap = new Map();
  const materialMap = new Map();

  if (artworkIds.length > 0) {
    const [{ data: images, error: imagesError }, { data: materials, error: materialsError }] = await Promise.all([
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

    if (imagesError) {
      showMessage(imagesError.message || 'Unable to load artwork images.', true);
    } else {
      images.forEach((image) => {
        if (image.is_main && !imageMap.has(image.artwork_id)) {
          imageMap.set(image.artwork_id, image.url);
        } else if (!imageMap.has(image.artwork_id)) {
          imageMap.set(image.artwork_id, image.url);
        }
      });
    }

    if (materialsError) {
      showMessage(materialsError.message || 'Unable to load artwork materials.', true);
    } else {
      materials.forEach((material) => {
        const materialName = materialTypeNameById.get(material.material_type_id) || '';
        if (!materialMap.has(material.artwork_id)) {
          materialMap.set(material.artwork_id, material.material_type_id);
        }
      });
    }
  }

  const materialTypeNameById = new Map(
    materialTypes.map((type) => [type.id, type.name]),
  );

  const artworkData = rows.map((artwork) => {
    const materialTypeId = materialMap.get(artwork.id) || '';
    return {
      ...artwork,
      image_url: imageMap.get(artwork.id) || '',
      category: materialTypeNameById.get(materialTypeId) || '',
      material_type_id: materialTypeId,
    };
  });

  renderArtworkList(artworkData);
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
  refs.categorySelect.value = artwork.material_type_id || '';
  refs.imageInput.value = '';
}

async function handleArtworkSubmit(event) {
  event.preventDefault();

  const title = refs.titleInput.value.trim();
  const description = refs.descriptionInput.value.trim();
  const materialTypeId = refs.categorySelect.value;
  const imageFile = refs.imageInput.files[0];

  if (!title || !description || !materialTypeId) {
    showMessage('Title, description, and material type are required.', true);
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

  const payload = {
    title,
    description,
    slug: slugify(title),
    is_published: true,
    created_at: new Date().toISOString().slice(0, 10),
    created_at_timestamp: new Date().toISOString(),
  };

  if (currentArtwork) {
    await updateArtwork(currentArtwork.id, payload, imageUrl, materialTypeId);
  } else {
    await createArtwork(payload, imageUrl, materialTypeId);
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

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createArtwork(payload, imageUrl, materialTypeId) {
  const { data, error } = await supabase
    .from('artworks')
    .insert([payload])
    .select('id')
    .single();

  if (error || !data?.id) {
    showMessage(error?.message || 'Unable to save artwork.', true);
    return;
  }

  const artworkId = data.id;
  const imagePayload = {
    artwork_id: artworkId,
    url: imageUrl,
    is_main: true,
    sort_order: 1,
  };

  const materialPayload = {
    artwork_id: artworkId,
    material_type_id: materialTypeId,
  };

  const { error: imageError } = await supabase.from('artwork_images').insert([imagePayload]);
  if (imageError) {
    showMessage(imageError.message || 'Artwork saved, but image upload failed.', true);
    return;
  }

  const { error: materialError } = await supabase.from('artwork_materials').insert([materialPayload]);
  if (materialError) {
    showMessage(materialError.message || 'Artwork saved, but material mapping failed.', true);
    return;
  }

  showMessage('Artwork added successfully.');
  resetForm();
  loadArtworks();
}

async function updateArtwork(id, payload, imageUrl, materialTypeId) {
  const { error } = await supabase.from('artworks').update(payload).eq('id', id);

  if (error) {
    showMessage(error.message || 'Unable to update artwork.', true);
    return;
  }

  const { error: materialDeleteError } = await supabase.from('artwork_materials').delete().eq('artwork_id', id);
  if (materialDeleteError) {
    showMessage(materialDeleteError.message || 'Unable to update artwork materials.', true);
    return;
  }

  const { error: materialInsertError } = await supabase.from('artwork_materials').insert([
    {
      artwork_id: id,
      material_type_id: materialTypeId,
    },
  ]);
  if (materialInsertError) {
    showMessage(materialInsertError.message || 'Unable to save artwork material.', true);
    return;
  }

  if (imageUrl) {
    const { data: existingImage, error: fetchError } = await supabase
      .from('artwork_images')
      .select('id')
      .eq('artwork_id', id)
      .eq('is_main', true)
      .limit(1)
      .single();

    if (!fetchError && existingImage?.id) {
      const { error: imageError } = await supabase
        .from('artwork_images')
        .update({ url: imageUrl })
        .eq('id', existingImage.id);
      if (imageError) {
        showMessage(imageError.message || 'Unable to update artwork image.', true);
        return;
      }
    } else {
      const { error: imageInsertError } = await supabase.from('artwork_images').insert([
        {
          artwork_id: id,
          url: imageUrl,
          is_main: true,
          sort_order: 1,
        },
      ]);
      if (imageInsertError) {
        showMessage(imageInsertError.message || 'Unable to save artwork image.', true);
        return;
      }
    }
  }

  showMessage('Artwork updated successfully.');
  resetForm();
  loadArtworks();
}

function confirmDeleteArtwork(artwork) {
  const confirmed = window.confirm(`Delete artwork: "${artwork.title}"?`);
  if (!confirmed) {
    return;
  }

  deleteArtwork(artwork.id);
}

async function deleteArtwork(id) {
  const { error: imageError } = await supabase.from('artwork_images').delete().eq('artwork_id', id);
  if (imageError) {
    showMessage(imageError.message || 'Unable to delete artwork images.', true);
    return;
  }

  const { error: materialError } = await supabase.from('artwork_materials').delete().eq('artwork_id', id);
  if (materialError) {
    showMessage(materialError.message || 'Unable to delete artwork material mapping.', true);
    return;
  }

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

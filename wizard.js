const catalog = [
  { id: 'materasso', label: 'Materasso', icon: 'bed-single', price: 35 },
  { id: 'divano', label: 'Divano', icon: 'sofa', price: 80 },
  { id: 'armadio', label: 'Armadio', icon: 'cabinet', price: 95 },
  { id: 'frigo', label: 'Frigorifero', icon: 'refrigerator', price: 55 },
  { id: 'lavatrice', label: 'Lavatrice', icon: 'washing-machine', price: 45 },
  { id: 'scrivania', label: 'Scrivania', icon: 'desk', price: 40 },
  { id: 'tv', label: 'TV/RAEE', icon: 'tv', price: 30 },
  { id: 'tapis', label: 'Tapis Roulant', icon: 'dumbbell', price: 65 }
];

const quantityByLocation = {
  cantina: ['Bassa', 'Media', 'Alta'],
  garage: ['Bassa', 'Media', 'Alta'],
  appartamento: ['1 stanza', '2-3 stanze', 'Casa intera'],
  ufficio: ['Piccolo', 'Medio', 'Grande'],
  negozio: ['Piccolo', 'Medio', 'Grande'],
  capannone: ['Ridotto', 'Ampio', 'Molto ampio']
};

const locationFactor = { cantina: 1, garage: 1.1, appartamento: 1.35, ufficio: 1.4, negozio: 1.3, capannone: 1.8 };
const quantityFactor = [1, 1.35, 1.75];
const floorFactor = [1, 1.08, 1.16, 1.25];

const selections = new Map();
let promoMultiplier = 1;

const itemGrid = document.getElementById('item-grid');
const selectedList = document.getElementById('selected-list');
const summaryTotal = document.getElementById('summary-total');
const breakdown = document.getElementById('breakdown');
const quoteForm = document.getElementById('quote-form');
const locationSelect = document.getElementById('locationType');
const quantitySelect = document.getElementById('quantityLevel');
const photosInput = document.getElementById('photos');
const photoPreview = document.getElementById('photo-preview');
const formError = document.getElementById('form-error');
const result = document.getElementById('result');

document.getElementById('year').textContent = new Date().getFullYear();

function euro(value) {
  return `€${Math.round(value)}`;
}

function renderCatalog() {
  itemGrid.innerHTML = '';
  catalog.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'item-tile';
    button.innerHTML = `<i data-lucide="${item.icon}"></i><span>${item.label}</span><small>${euro(item.price)}</small>`;
    button.addEventListener('click', () => {
      const current = selections.get(item.id) || { ...item, qty: 0 };
      current.qty += 1;
      selections.set(item.id, current);
      renderSelected();
      updateSummary();
    });
    itemGrid.appendChild(button);
  });
}

function renderSelected() {
  if (!selections.size) {
    selectedList.innerHTML = '<p class="muted">Nessun articolo selezionato.</p>';
    return;
  }

  selectedList.innerHTML = '';
  [...selections.values()].forEach((item) => {
    const row = document.createElement('div');
    row.className = 'selected-row';
    row.innerHTML = `
      <span>${item.label}</span>
      <div class="qty-wrap">
        <button type="button" data-act="minus">−</button>
        <strong>${item.qty}</strong>
        <button type="button" data-act="plus">+</button>
      </div>
      <span>${euro(item.qty * item.price)}</span>
    `;
    row.querySelector('[data-act="minus"]').addEventListener('click', () => {
      item.qty -= 1;
      if (item.qty <= 0) selections.delete(item.id);
      else selections.set(item.id, item);
      renderSelected();
      updateSummary();
    });
    row.querySelector('[data-act="plus"]').addEventListener('click', () => {
      item.qty += 1;
      selections.set(item.id, item);
      renderSelected();
      updateSummary();
    });
    selectedList.appendChild(row);
  });
}

function refreshQuantityOptions() {
  const selected = locationSelect.value;
  quantitySelect.innerHTML = '<option value="">Seleziona...</option>';
  (quantityByLocation[selected] || []).forEach((label, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = label;
    quantitySelect.appendChild(option);
  });
  updateSummary();
}

function getBaseItemsPrice() {
  return [...selections.values()].reduce((sum, item) => sum + item.price * item.qty, 0);
}

function calculateTotal() {
  const location = locationSelect.value;
  const qIdx = Number(quantitySelect.value || 0);
  const floor = Number(quoteForm.elements.floor?.value || 0);
  const lift = quoteForm.elements.lift?.value;

  let total = getBaseItemsPrice();
  if (!total) return 0;

  total *= (locationFactor[location] || 1);
  total *= (quantityFactor[qIdx] || 1);
  total *= (floorFactor[floor] || 1);
  if (lift === 'no') total *= 1.12;
  total *= promoMultiplier;
  return total;
}

function updateSummary() {
  const total = calculateTotal();
  summaryTotal.textContent = euro(total);
  breakdown.innerHTML = `
    <p>Articoli: <strong>${euro(getBaseItemsPrice())}</strong></p>
    <p>Fattore locale: <strong>x${(locationFactor[locationSelect.value] || 1).toFixed(2)}</strong></p>
    <p>Fattore quantità: <strong>x${(quantityFactor[Number(quantitySelect.value || 0)] || 1).toFixed(2)}</strong></p>
    <p>Promo: <strong>x${promoMultiplier.toFixed(2)}</strong></p>
  `;
}

locationSelect.addEventListener('change', refreshQuantityOptions);
quoteForm.addEventListener('change', updateSummary);

document.getElementById('custom-item').addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const value = event.target.value.trim();
  if (!value) return;
  const id = `custom-${Date.now()}`;
  selections.set(id, { id, label: value, icon: 'package', price: 55, qty: 1 });
  event.target.value = '';
  renderSelected();
  updateSummary();
});

document.getElementById('apply-promo').addEventListener('click', () => {
  const code = document.getElementById('promo-code').value.trim().toUpperCase();
  promoMultiplier = code === 'TUTTO10' ? 0.9 : 1;
  updateSummary();
});

document.getElementById('toggle-breakdown').addEventListener('click', () => {
  breakdown.classList.toggle('hidden');
});

photosInput.addEventListener('change', () => {
  photoPreview.innerHTML = '';
  [...photosInput.files].slice(0, 8).forEach((file) => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = `Anteprima ${file.name}`;
    img.loading = 'lazy';
    photoPreview.appendChild(img);
  });
});

quoteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';

  if (!selections.size) {
    formError.textContent = 'Seleziona almeno un articolo da sgomberare.';
    return;
  }
  if (!quoteForm.checkValidity()) {
    formError.textContent = 'Compila tutti i campi obbligatori.';
    return;
  }

  const total = calculateTotal();
  const min = Math.round(total * 0.9);
  const max = Math.round(total * 1.14);
  const phone = quoteForm.elements.phone.value;

  result.classList.remove('hidden');
  result.innerHTML = `<h3>Preventivo AI preliminare</h3><p><strong>Fascia stimata:</strong> ${euro(min)} - ${euro(max)} + IVA</p><p><strong>Articoli:</strong> ${[...selections.values()].reduce((s, i) => s + i.qty, 0)} pezzi</p><p><strong>Foto caricate:</strong> ${photosInput.files.length}</p><p>Ti richiamiamo al <strong>${phone}</strong> per conferma finale.</p>`;
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function setupAddressAutocompleteFallback() {
  const addressInput = document.getElementById('address');
  const suggestions = document.getElementById('address-suggestions');
  let timer;
  addressInput.addEventListener('input', () => {
    clearTimeout(timer);
    const query = addressInput.value.trim();
    if (query.length < 4) return;
    timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=it&limit=5&q=${encodeURIComponent(query)}`);
        if (!response.ok) return;
        const places = await response.json();
        suggestions.innerHTML = '';
        places.forEach((place) => {
          const option = document.createElement('option');
          option.value = place.display_name;
          suggestions.appendChild(option);
        });
      } catch {
        // input manuale sempre disponibile
      }
    }, 250);
  });
}

function setupGooglePlacesIfKeyPresent() {
  const key = window.TS_GOOGLE_MAPS_KEY;
  if (!key) {
    setupAddressAutocompleteFallback();
    return;
  }
  window.initGoogleAddress = function initGoogleAddress() {
    if (window.google?.maps?.places) {
      new google.maps.places.Autocomplete(document.getElementById('address'), { componentRestrictions: { country: 'it' } });
      document.getElementById('address-hint').textContent = 'Google Places attivo.';
    } else {
      setupAddressAutocompleteFallback();
    }
  };
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initGoogleAddress`;
  script.async = true;
  script.defer = true;
  script.onerror = setupAddressAutocompleteFallback;
  document.head.appendChild(script);
}

renderCatalog();
renderSelected();
setupGooglePlacesIfKeyPresent();
updateSummary();
if (window.lucide) window.lucide.createIcons();
window.addEventListener('load', () => window.lucide && window.lucide.createIcons());

const quantityByLocation = {
  cantina: ['Piccola (fino a 8 m³)', 'Media (9-16 m³)', 'Grande (oltre 16 m³)'],
  garage: ['Parziale (fino a 10 m³)', 'Quasi pieno (11-20 m³)', 'Pieno (oltre 20 m³)'],
  appartamento: ['Poche stanze (fino a 20 m³)', 'Metà casa (21-40 m³)', 'Casa completa (oltre 40 m³)'],
  ufficio: ['Piccolo ufficio (fino a 15 m³)', 'Piano operativo (16-35 m³)', 'Sede completa (oltre 35 m³)'],
  negozio: ['Corner (fino a 12 m³)', 'Locale medio (13-28 m³)', 'Locale grande (oltre 28 m³)'],
  capannone: ['Area ridotta (fino a 30 m³)', 'Area ampia (31-70 m³)', 'Area estesa (oltre 70 m³)']
};

const basePrice = { cantina: 160, garage: 240, appartamento: 450, ufficio: 520, negozio: 420, capannone: 900 };
const materialFactor = { mobili: 1.12, elettrodomestici: 1.22, raee: 1.18, ferro: 1.1, legno: 1.06, ingombranti: 1.2, archivio: 1.08, macerie: 1.3 };
const quantityFactor = [1, 1.35, 1.75];
const floorFactor = [1, 1.08, 1.16, 1.25];

const form = document.getElementById('quote-form');
const result = document.getElementById('result');
const formError = document.getElementById('form-error');
const locationSelect = document.getElementById('locationType');
const quantitySelect = document.getElementById('quantityLevel');
const prevButton = document.getElementById('prev-step');
const nextButton = document.getElementById('next-step');
const submitButton = document.getElementById('submit-btn');
const steps = [...document.querySelectorAll('.wizard-step')];
const dots = [...document.querySelectorAll('.step-dot')];
const photosInput = document.getElementById('photos');
const photoPreview = document.getElementById('photo-preview');

let currentStep = 1;
document.getElementById('year').textContent = new Date().getFullYear();

function refreshQuantityOptions() {
  const selected = locationSelect.value;
  quantitySelect.innerHTML = '<option value="">Seleziona...</option>';
  (quantityByLocation[selected] || []).forEach((label, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = label;
    quantitySelect.appendChild(option);
  });
}

function renderStep() {
  steps.forEach((step) => step.classList.toggle('active', Number(step.dataset.step) === currentStep));
  dots.forEach((dot, i) => dot.classList.toggle('active', i + 1 <= currentStep));
  prevButton.classList.toggle('hidden', currentStep === 1);
  nextButton.classList.toggle('hidden', currentStep === steps.length);
  submitButton.classList.toggle('hidden', currentStep !== steps.length);
}

function validateCurrentStep() {
  const activeStep = steps.find((step) => Number(step.dataset.step) === currentStep);
  const requiredFields = [...activeStep.querySelectorAll('[required]')];
  const isValid = requiredFields.every((field) => field.checkValidity());
  formError.textContent = isValid ? '' : 'Completa i campi obbligatori di questo step.';
  return isValid;
}

nextButton.addEventListener('click', () => {
  if (!validateCurrentStep()) return;
  currentStep = Math.min(currentStep + 1, steps.length);
  renderStep();
});

prevButton.addEventListener('click', () => {
  formError.textContent = '';
  currentStep = Math.max(currentStep - 1, 1);
  renderStep();
});

locationSelect.addEventListener('change', refreshQuantityOptions);

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

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    formError.textContent = 'Compila tutti i campi obbligatori prima di inviare.';
    return;
  }

  const formData = new FormData(form);
  const materials = formData.getAll('materials');
  if (!materials.length) {
    formError.textContent = 'Seleziona almeno un materiale.';
    return;
  }

  const location = formData.get('locationType');
  const quantityIndex = Number(formData.get('quantityLevel'));
  const floor = Number(formData.get('floor'));
  const lift = formData.get('lift');

  let estimate = basePrice[location] * quantityFactor[quantityIndex] * floorFactor[floor];
  if (lift === 'no') estimate *= 1.12;
  const avgMaterialBoost = materials.reduce((sum, material) => sum + (materialFactor[material] || 1), 0) / materials.length;
  estimate *= avgMaterialBoost;

  const min = Math.round(estimate * 0.9);
  const max = Math.round(estimate * 1.18);

  result.classList.remove('hidden');
  result.innerHTML = `<h3>Preventivo AI preliminare</h3><p><strong>Fascia stimata:</strong> €${min} - €${max} + IVA</p><p><strong>Foto caricate:</strong> ${photosInput.files.length}</p><p>Ti richiamiamo al <strong>${formData.get('phone')}</strong> per conferma operativa.</p>`;
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
        // input manuale resta disponibile
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

renderStep();
setupGooglePlacesIfKeyPresent();
if (window.lucide) window.lucide.createIcons();

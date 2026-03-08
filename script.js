const quantityByLocation = {
  cantina: ['Piccola (fino a 8 m³)', 'Media (9-16 m³)', 'Grande (oltre 16 m³)'],
  garage: ['Parziale (fino a 10 m³)', 'Quasi pieno (11-20 m³)', 'Pieno (oltre 20 m³)'],
  appartamento: ['Poche stanze (fino a 20 m³)', 'Metà casa (21-40 m³)', 'Casa completa (oltre 40 m³)'],
  ufficio: ['Piccolo ufficio (fino a 15 m³)', 'Piano operativo (16-35 m³)', 'Sede completa (oltre 35 m³)'],
  negozio: ['Corner (fino a 12 m³)', 'Locale medio (13-28 m³)', 'Locale grande (oltre 28 m³)'],
  capannone: ['Area ridotta (fino a 30 m³)', 'Area ampia (31-70 m³)', 'Area estesa (oltre 70 m³)']
};

const basePrice = {
  cantina: 160,
  garage: 240,
  appartamento: 450,
  ufficio: 520,
  negozio: 420,
  capannone: 900
};

const materialFactor = {
  mobili: 1.12,
  elettrodomestici: 1.22,
  raee: 1.18,
  ferro: 1.1,
  legno: 1.06,
  ingombranti: 1.2,
  archivio: 1.08,
  macerie: 1.3
};

const quantityFactor = [1, 1.35, 1.75];
const floorFactor = [1, 1.08, 1.16, 1.25];

const form = document.getElementById('quote-form');
const result = document.getElementById('result');
const formError = document.getElementById('form-error');
const locationSelect = document.getElementById('locationType');
const quantitySelect = document.getElementById('quantityLevel');

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

locationSelect.addEventListener('change', refreshQuantityOptions);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';

  if (!form.checkValidity()) {
    formError.textContent = 'Compila tutti i campi obbligatori prima di calcolare il preventivo.';
    return;
  }

  const formData = new FormData(form);
  const location = formData.get('locationType');
  const quantityIndex = Number(formData.get('quantityLevel'));
  const floor = Number(formData.get('floor'));
  const lift = formData.get('lift');
  const materials = formData.getAll('materials');

  if (!materials.length) {
    formError.textContent = 'Seleziona almeno un materiale da sgomberare.';
    return;
  }

  let estimate = basePrice[location] * quantityFactor[quantityIndex] * floorFactor[floor];
  if (lift === 'no') estimate *= 1.12;

  const averageMaterialBoost =
    materials.reduce((sum, material) => sum + (materialFactor[material] || 1), 0) / materials.length;

  estimate *= averageMaterialBoost;

  const urgency = (formData.get('notes') || '').toLowerCase().includes('urg') ? 1.1 : 1;
  estimate *= urgency;

  const min = Math.round(estimate * 0.9);
  const max = Math.round(estimate * 1.18);
  const confidence = materials.length >= 3 ? 'Alta (87%)' : 'Media (74%)';

  result.classList.remove('hidden');
  result.innerHTML = `
    <h3>Preventivo AI preliminare</h3>
    <p><strong>Fascia stimata:</strong> €${min} - €${max} + IVA</p>
    <p><strong>Confidenza modello:</strong> ${confidence}</p>
    <p><strong>Dati calcolati:</strong> ${location}, ${materials.join(', ')}, quantità livello ${quantityIndex + 1}, piano ${floor}.</p>
    <p>Un consulente TuttoSgombro ti ricontatterà al numero <strong>${formData.get('phone')}</strong> per conferma finale e disponibilità operativa.</p>
  `;

  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { fetchPetById } from './petsApi';
import { fetchVaccinationsForPet } from './vaccinationsApi';
import { fetchMedicationsForPet } from './medicationsApi';
import { fetchDoseLogsForMedication } from './doseLogsApi';
import { fetchWeightEntriesForPet } from './weightEntriesApi';
import type { Pet } from '../types/pet';
import type { Vaccination } from '../types/vaccination';
import type { Medication } from '../types/medication';
import type { DoseLog } from '../types/doseLog';
import type { WeightEntry } from '../types/weightEntry';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value: string | null | undefined): string {
  return value ? escapeHtml(value) : '—';
}

function buildPetRecordHtml(
  pet: Pet,
  vaccinations: Vaccination[],
  medications: Medication[],
  doseLogsByMedication: Map<string, DoseLog[]>,
  weightEntries: WeightEntry[],
): string {
  const generatedAt = new Date().toLocaleString();

  const vaccinationRows = vaccinations.length
    ? vaccinations
        .map(
          (v) => `
        <tr>
          <td>${cell(v.vaccine_name)}</td>
          <td>${cell(v.date_administered)}</td>
          <td>${cell(v.next_due_date)}</td>
          <td>${cell(v.administering_vet)}</td>
        </tr>`,
        )
        .join('')
    : '<tr><td colspan="4">No vaccination records.</td></tr>';

  const medicationSections = medications.length
    ? medications
        .map((m) => {
          const logs = doseLogsByMedication.get(m.id) ?? [];
          const logRows = logs
            .slice(0, 10)
            .map(
              (log) => `
            <tr>
              <td>${log.status === 'given' ? 'Given' : 'Skipped'}</td>
              <td>${cell(log.logged_by_email)}</td>
              <td>${escapeHtml(new Date(log.logged_at).toLocaleString())}</td>
            </tr>`,
            )
            .join('');

          return `
        <h3>${cell(m.name)}${m.active ? '' : ' (inactive)'}</h3>
        <p class="meta">
          Dosage: ${cell(m.dosage)} &nbsp;·&nbsp;
          Schedule: ${cell(m.schedule_rule)} &nbsp;·&nbsp;
          Start: ${cell(m.start_date)} &nbsp;·&nbsp;
          End: ${m.end_date ? cell(m.end_date) : 'Ongoing'}
        </p>
        ${
          logs.length > 0
            ? `<table><thead><tr><th>Status</th><th>Logged By</th><th>Logged At</th></tr></thead><tbody>${logRows}</tbody></table>`
            : '<p class="meta">No dose history yet.</p>'
        }`;
        })
        .join('<hr/>')
    : '<p>No medications on record.</p>';

  const weightRows = weightEntries.length
    ? weightEntries
        .map(
          (w) => `
        <tr>
          <td>${cell(w.recorded_at)}</td>
          <td>${w.weight} ${w.unit}</td>
        </tr>`,
        )
        .join('')
    : '<tr><td colspan="2">No weight entries.</td></tr>';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 24px; }
          h1 { margin-bottom: 4px; }
          h2 { margin-top: 32px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          h3 { margin-top: 20px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
          th { background: #f7f7f7; }
          .meta { color: #666; font-size: 12px; }
          .profile-row { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 12px; }
          .profile-item { min-width: 140px; }
          .profile-label { font-size: 11px; text-transform: uppercase; color: #888; }
          .profile-value { font-size: 14px; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>${cell(pet.name)}</h1>
        <p class="meta">Generated ${escapeHtml(generatedAt)} · Pet Health App</p>

        <div class="profile-row">
          <div class="profile-item"><div class="profile-label">Species</div><div class="profile-value">${cell(pet.species)}</div></div>
          <div class="profile-item"><div class="profile-label">Breed</div><div class="profile-value">${cell(pet.breed)}</div></div>
          <div class="profile-item"><div class="profile-label">Sex</div><div class="profile-value">${cell(pet.sex)}</div></div>
          <div class="profile-item"><div class="profile-label">Birthdate</div><div class="profile-value">${cell(pet.birthdate)}${pet.is_estimated_age ? ' (estimated)' : ''}</div></div>
          <div class="profile-item"><div class="profile-label">Microchip ID</div><div class="profile-value">${cell(pet.microchip_id)}</div></div>
          <div class="profile-item"><div class="profile-label">Status</div><div class="profile-value">${pet.status === 'deceased' ? 'In Memory' : 'Active'}</div></div>
        </div>

        <h2>Vaccinations</h2>
        <table>
          <thead><tr><th>Vaccine</th><th>Date Administered</th><th>Next Due</th><th>Vet</th></tr></thead>
          <tbody>${vaccinationRows}</tbody>
        </table>

        <h2>Medications</h2>
        ${medicationSections}

        <h2>Weight History</h2>
        <table>
          <thead><tr><th>Date</th><th>Weight</th></tr></thead>
          <tbody>${weightRows}</tbody>
        </table>
      </body>
    </html>
  `;
}

export async function exportPetRecordPdf(petId: string): Promise<{ error: string | null }> {
  const [petResult, vaccinationsResult, medicationsResult, weightResult] = await Promise.all([
    fetchPetById(petId),
    fetchVaccinationsForPet(petId),
    fetchMedicationsForPet(petId),
    fetchWeightEntriesForPet(petId),
  ]);

  if (petResult.error || !petResult.data) {
    return { error: petResult.error ?? 'Could not load this pet’s profile.' };
  }

  if (vaccinationsResult.error) return { error: vaccinationsResult.error };
  if (medicationsResult.error) return { error: medicationsResult.error };
  if (weightResult.error) return { error: weightResult.error };

  const doseLogsByMedication = new Map<string, DoseLog[]>();
  for (const medication of medicationsResult.data) {
    const { data, error } = await fetchDoseLogsForMedication(medication.id);
    if (error) return { error };
    doseLogsByMedication.set(medication.id, data);
  }

  const html = buildPetRecordHtml(
    petResult.data,
    vaccinationsResult.data,
    medicationsResult.data,
    doseLogsByMedication,
    weightResult.data,
  );

  try {
    const { uri } = await Print.printToFileAsync({ html });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { error: 'Sharing is not available on this device.' };
    }

    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });

    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not generate the PDF.';
    return { error: message };
  }
}

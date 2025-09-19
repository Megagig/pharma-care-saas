import { api } from '../lib/api';

export const testApiEndpoints = async () => {
    console.log('=== TESTING API ENDPOINTS ===');

    try {
        // Test patients endpoint
        console.log('Testing /api/patients...');
        const patientsResponse = await api.get('/patients', { params: { limit: 5 } });
        console.log('Patients Response:', JSON.stringify(patientsResponse.data, null, 2));

        if (patientsResponse.data?.success && patientsResponse.data?.data?.patients) {
            const samplePatient = patientsResponse.data.data.patients[0];
            console.log('Sample Patient:', JSON.stringify(samplePatient, null, 2));
            console.log('Patient fields:', Object.keys(samplePatient || {}));
        }

    } catch (error) {
        console.error('Patients API Error:', error);
    }

    try {
        // Test medications endpoint
        console.log('Testing /api/medication-management/dashboard/stats...');
        const medicationsResponse = await api.get('/medication-management/dashboard/stats');
        console.log('Medications Response:', JSON.stringify(medicationsResponse.data, null, 2));

        if (medicationsResponse.data?.success && medicationsResponse.data?.data) {
            console.log('Medication stats:', JSON.stringify(medicationsResponse.data.data, null, 2));
        }

    } catch (error) {
        console.error('Medications API Error:', error);
    }

    try {
        // Test notes endpoint
        console.log('Testing /api/notes...');
        const notesResponse = await api.get('/notes', { params: { limit: 5 } });
        console.log('Notes Response:', JSON.stringify(notesResponse.data, null, 2));

        if (notesResponse.data?.success && notesResponse.data?.data?.notes) {
            const sampleNote = notesResponse.data.data.notes[0];
            console.log('Sample Note:', JSON.stringify(sampleNote, null, 2));
            console.log('Note fields:', Object.keys(sampleNote || {}));
        }

    } catch (error) {
        console.error('Notes API Error:', error);
    }

    console.log('=== API TESTING COMPLETE ===');
};

// Call this function from browser console: testApiEndpoints()
(window as any).testApiEndpoints = testApiEndpoints;
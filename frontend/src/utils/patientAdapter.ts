import {
   Patient as StorePatient,
   PatientFormData as StorePatientFormData,
} from '../stores/types';
import {
   Patient as ApiPatient,
   CreatePatientData as ApiCreatePatientData,
} from '../types/patientManagement';

/**
 * Converts the API Patient model to the Store Patient model
 */
export const apiToStorePatient = (apiPatient: ApiPatient): StorePatient => {
   return {
      _id: apiPatient._id.toString(),
      firstName: apiPatient.firstName,
      lastName: apiPatient.lastName,
      email: apiPatient.email,
      phone: apiPatient.phone || '',
      dateOfBirth: apiPatient.dob || '',
      address: apiPatient.address
         ? {
              street: apiPatient.address,
              city: '',
              state: apiPatient.state || '',
              zipCode: '',
           }
         : undefined,
      medicalHistory: '',
      allergies: [],
      createdAt: apiPatient.createdAt || new Date().toISOString(),
      updatedAt: apiPatient.updatedAt || new Date().toISOString(),
   };
};

/**
 * Converts a collection of API Patient models to Store Patient models
 */
export const apiToStorePatients = (
   apiPatients: ApiPatient[]
): StorePatient[] => {
   return apiPatients.map(apiToStorePatient);
};

/**
 * Converts the API Patient response with wrapper to Store Patient
 */
export const apiResponseToStorePatient = (response: {
   patient: ApiPatient;
}): StorePatient => {
   return apiToStorePatient(response.patient);
};

/**
 * Converts Store PatientFormData to API CreatePatientData
 */
export const storeFormToApiCreateData = (
   formData: StorePatientFormData
): ApiCreatePatientData => {
   // Concatenate address fields into a single string
   const address = formData.address
      ? [
           formData.address.street,
           formData.address.city,
           formData.address.state,
           formData.address.zipCode,
        ]
           .filter(Boolean)
           .join(', ')
      : undefined;

   return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dateOfBirth,
      address,
      // Map other fields as needed
   };
};

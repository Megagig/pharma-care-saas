/**
 * Offline storage utilities for MTR functionality
 * Provides local storage and IndexedDB support for critical MTR data
 */

import { MTRMedication } from '../stores/mtrStore';
import type { Patient } from '../types/patientManagement';
import type {
  DrugTherapyProblem,
  TherapyPlan,
  MTRIntervention,
  MTRFollowUp,
} from '../types/mtr';

// IndexedDB configuration
const DB_NAME = 'MTROfflineDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  PATIENTS: 'patients',
  MEDICATIONS: 'medications',
  PROBLEMS: 'problems',
  PLANS: 'therapyPlans',
  INTERVENTIONS: 'interventions',
  FOLLOWUPS: 'followUps',
  SYNC_QUEUE: 'syncQueue',
  DRAFTS: 'drafts',
} as const;

interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: keyof typeof STORES;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

interface MTRDraft {
  id: string;
  type: 'medication' | 'problem' | 'plan' | 'intervention' | 'followup';
  data: Record<string, unknown>;
  timestamp: number;
  patientId?: string;
  reviewId?: string;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
          const patientsStore = db.createObjectStore(STORES.PATIENTS, {
            keyPath: '_id',
          });
          patientsStore.createIndex('mrn', 'mrn', { unique: false });
          patientsStore.createIndex('name', ['firstName', 'lastName'], {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.MEDICATIONS)) {
          const medicationsStore = db.createObjectStore(STORES.MEDICATIONS, {
            keyPath: 'id',
          });
          medicationsStore.createIndex('patientId', 'patientId', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.PROBLEMS)) {
          const problemsStore = db.createObjectStore(STORES.PROBLEMS, {
            keyPath: '_id',
          });
          problemsStore.createIndex('patientId', 'patientId', {
            unique: false,
          });
          problemsStore.createIndex('reviewId', 'reviewId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PLANS)) {
          const plansStore = db.createObjectStore(STORES.PLANS, {
            keyPath: 'id',
          });
          plansStore.createIndex('patientId', 'patientId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.INTERVENTIONS)) {
          const interventionsStore = db.createObjectStore(
            STORES.INTERVENTIONS,
            { keyPath: '_id' }
          );
          interventionsStore.createIndex('reviewId', 'reviewId', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.FOLLOWUPS)) {
          const followupsStore = db.createObjectStore(STORES.FOLLOWUPS, {
            keyPath: '_id',
          });
          followupsStore.createIndex('reviewId', 'reviewId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
          const draftsStore = db.createObjectStore(STORES.DRAFTS, {
            keyPath: 'id',
          });
          draftsStore.createIndex('type', 'type', { unique: false });
          draftsStore.createIndex('patientId', 'patientId', { unique: false });
        }
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Generic CRUD operations
  async save<T>(storeName: string, data: T): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Patient operations
  async savePatient(patient: Patient): Promise<void> {
    await this.save(STORES.PATIENTS, patient);
  }

  async getPatient(id: string): Promise<Patient | null> {
    return this.get<Patient>(STORES.PATIENTS, id);
  }

  async getAllPatients(): Promise<Patient[]> {
    return this.getAll<Patient>(STORES.PATIENTS);
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const patients = await this.getAllPatients();
    const lowerQuery = query.toLowerCase();

    return patients.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(lowerQuery) ||
        patient.lastName.toLowerCase().includes(lowerQuery) ||
        patient.mrn.toLowerCase().includes(lowerQuery) ||
        (patient.phone && patient.phone.includes(query))
    );
  }

  // Medication operations
  async saveMedication(medication: MTRMedication): Promise<void> {
    await this.save(STORES.MEDICATIONS, medication);
  }

  async getMedicationsByPatient(patientId: string): Promise<MTRMedication[]> {
    await this.ensureInitialized();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORES.MEDICATIONS],
        'readonly'
      );
      const store = transaction.objectStore(STORES.MEDICATIONS);
      const index = store.index('patientId');
      const request = index.getAll(patientId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // Problem operations
  async saveProblem(problem: DrugTherapyProblem): Promise<void> {
    await this.save(STORES.PROBLEMS, problem);
  }

  async getProblemsByReview(reviewId: string): Promise<DrugTherapyProblem[]> {
    await this.ensureInitialized();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PROBLEMS], 'readonly');
      const store = transaction.objectStore(STORES.PROBLEMS);
      const index = store.index('reviewId');
      const request = index.getAll(reviewId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // Therapy plan operations
  async saveTherapyPlan(plan: TherapyPlan): Promise<void> {
    await this.save(STORES.PLANS, plan);
  }

  async getTherapyPlan(id: string): Promise<TherapyPlan | null> {
    return this.get<TherapyPlan>(STORES.PLANS, id);
  }

  // Intervention operations
  async saveIntervention(intervention: MTRIntervention): Promise<void> {
    await this.save(STORES.INTERVENTIONS, intervention);
  }

  async getInterventionsByReview(reviewId: string): Promise<MTRIntervention[]> {
    await this.ensureInitialized();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORES.INTERVENTIONS],
        'readonly'
      );
      const store = transaction.objectStore(STORES.INTERVENTIONS);
      const index = store.index('reviewId');
      const request = index.getAll(reviewId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // Follow-up operations
  async saveFollowUp(followUp: MTRFollowUp): Promise<void> {
    await this.save(STORES.FOLLOWUPS, followUp);
  }

  async getFollowUpsByReview(reviewId: string): Promise<MTRFollowUp[]> {
    await this.ensureInitialized();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.FOLLOWUPS], 'readonly');
      const store = transaction.objectStore(STORES.FOLLOWUPS);
      const index = store.index('reviewId');
      const request = index.getAll(reviewId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // Draft operations for auto-save
  async saveDraft(draft: MTRDraft): Promise<void> {
    await this.save(STORES.DRAFTS, draft);
  }

  async getDraft(id: string): Promise<MTRDraft | null> {
    return this.get<MTRDraft>(STORES.DRAFTS, id);
  }

  async getDraftsByType(type: MTRDraft['type']): Promise<MTRDraft[]> {
    await this.ensureInitialized();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.DRAFTS], 'readonly');
      const store = transaction.objectStore(STORES.DRAFTS);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteDraft(id: string): Promise<void> {
    await this.delete(STORES.DRAFTS, id);
  }

  // Sync queue operations
  async addToSyncQueue(
    item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `${item.entity}_${item.type}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await this.save(STORES.SYNC_QUEUE, syncItem);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await this.delete(STORES.SYNC_QUEUE, id);
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await this.save(STORES.SYNC_QUEUE, item);
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) return;

    const storeNames = Object.values(STORES);
    const transaction = this.db.transaction(storeNames, 'readwrite');

    await Promise.all(
      storeNames.map((storeName) => {
        return new Promise<void>((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      })
    );
  }

  async getStorageSize(): Promise<{ [key: string]: number }> {
    await this.ensureInitialized();
    if (!this.db) return {};

    const sizes: { [key: string]: number } = {};
    const storeNames = Object.values(STORES);

    for (const storeName of storeNames) {
      const data = await this.getAll(storeName);
      sizes[storeName] = JSON.stringify(data).length;
    }

    return sizes;
  }

  // Check if we're offline
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Auto-save functionality
  async autoSaveDraft(
    type: MTRDraft['type'],
    data: unknown,
    patientId?: string,
    reviewId?: string
  ): Promise<void> {
    const draft: MTRDraft = {
      id: `${type}_${patientId || reviewId || 'temp'}_${Date.now()}`,
      type,
      data: data as Record<string, unknown>,
      timestamp: Date.now(),
      patientId,
      reviewId,
    };
    await this.saveDraft(draft);
  }

  // Cleanup old drafts (older than 7 days)
  async cleanupOldDrafts(): Promise<void> {
    const drafts = await this.getAll<MTRDraft>(STORES.DRAFTS);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const draft of drafts) {
      if (draft.timestamp < weekAgo) {
        await this.deleteDraft(draft.id);
      }
    }
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on module load
offlineStorage.initialize().catch(console.error);

// Note: localStorage utilities removed in favor of server-side state management
// with httpOnly cookies for authentication and IndexedDB for offline capabilities

export default offlineStorage;

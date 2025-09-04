import { ApiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

export interface DailyMedSPL {
  setid: string;
  title: string;
  effective_time?: string;
  version_number?: string;
  spl_product_data_elements?: string;
}

export interface DailyMedSearchResult {
  data: DailyMedSPL[];
  metadata: {
    total_elements: number;
    elements_per_page: number;
    current_page: number;
    total_pages: number;
  };
}

export interface DailyMedMonograph {
  setid: string;
  title: string;
  effective_time: string;
  version_number: string;
  spl_product_data_elements: any[];
  spl_unstructured_data_elements: any[];
  packaging?: any[];
  product_ndc?: string[];
  generic_medicine?: any[];
  brand_name?: string[];
  active_ingredient?: any[];
  inactive_ingredient?: any[];
  dosage_form?: string[];
  route?: string[];
  marketing_category?: string[];
  application_number?: string[];
  labeler?: any[];
  dea_schedule?: string;
  controlled_substance?: string;
  boxed_warning?: string[];
  recent_major_changes?: any[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  contraindications?: string[];
  warnings_and_precautions?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  use_in_specific_populations?: string[];
  overdosage?: string[];
  description?: string[];
  clinical_pharmacology?: string[];
  nonclinical_toxicology?: string[];
  clinical_studies?: string[];
  how_supplied?: string[];
  storage_and_handling?: string[];
  patient_counseling_information?: string[];
}

export class DailyMedService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: 'https://dailymed.nlm.nih.gov/dailymed/services/v2',
      timeout: 20000,
      retryAttempts: 3,
      retryDelay: 1500
    });
  }

  /**
   * Search for drug monographs by name
   */
  async searchDrugs(drugName: string, page: number = 1, pageSize: number = 20): Promise<DailyMedSearchResult> {
    try {
      const response = await this.client.get<DailyMedSearchResult>('/spls.json', {
        params: {
          drug_name: drugName,
          page,
          pagesize: pageSize
        }
      });

      logger.info(`DailyMed search found ${response.data.metadata.total_elements} results for "${drugName}"`);
      return response.data;
    } catch (error) {
      logger.error('DailyMed drug search failed:', error);
      throw new Error(`Failed to search DailyMed: ${error}`);
    }
  }

  /**
   * Get detailed monograph by setid
   */
  async getMonograph(setid: string): Promise<DailyMedMonograph> {
    try {
      const response = await this.client.get<{ data: DailyMedMonograph[] }>(`/spls/${setid}.json`);
      
      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('Monograph not found');
      }

      const monograph = response.data.data[0];
      logger.info(`Retrieved DailyMed monograph for setid ${setid}: ${monograph.title}`);
      return monograph;
    } catch (error) {
      logger.error('DailyMed monograph retrieval failed:', error);
      throw new Error(`Failed to get monograph: ${error}`);
    }
  }

  /**
   * Search by NDC (National Drug Code)
   */
  async searchByNDC(ndc: string): Promise<DailyMedSearchResult> {
    try {
      const response = await this.client.get<DailyMedSearchResult>('/spls.json', {
        params: {
          ndc
        }
      });

      logger.info(`DailyMed NDC search found ${response.data.metadata.total_elements} results for NDC ${ndc}`);
      return response.data;
    } catch (error) {
      logger.error('DailyMed NDC search failed:', error);
      throw new Error(`Failed to search by NDC: ${error}`);
    }
  }

  /**
   * Get drugs by therapeutic class
   */
  async searchByTherapeuticClass(therapeuticClass: string, page: number = 1, pageSize: number = 20): Promise<DailyMedSearchResult> {
    try {
      const response = await this.client.get<DailyMedSearchResult>('/spls.json', {
        params: {
          pharm_class: therapeuticClass,
          page,
          pagesize: pageSize
        }
      });

      logger.info(`DailyMed therapeutic class search found ${response.data.metadata.total_elements} results for "${therapeuticClass}"`);
      return response.data;
    } catch (error) {
      logger.error('DailyMed therapeutic class search failed:', error);
      throw new Error(`Failed to search by therapeutic class: ${error}`);
    }
  }

  /**
   * Get drug labeling information
   */
  async getDrugLabeling(setid: string): Promise<any> {
    try {
      const response = await this.client.get(`/spls/${setid}/labeling.json`);
      
      logger.info(`Retrieved DailyMed labeling for setid ${setid}`);
      return response.data;
    } catch (error) {
      logger.error('DailyMed labeling retrieval failed:', error);
      throw new Error(`Failed to get drug labeling: ${error}`);
    }
  }

  /**
   * Get media (images) for a drug
   */
  async getDrugMedia(setid: string): Promise<any> {
    try {
      const response = await this.client.get(`/spls/${setid}/media.json`);
      
      logger.info(`Retrieved DailyMed media for setid ${setid}`);
      return response.data;
    } catch (error) {
      logger.error('DailyMed media retrieval failed:', error);
      // Don't throw error for media - it's not critical
      return { data: [] };
    }
  }

  /**
   * Extract key safety information from monograph
   */
  extractSafetyInfo(monograph: DailyMedMonograph): any {
    return {
      boxedWarnings: monograph.boxed_warning || [],
      contraindications: monograph.contraindications || [],
      warningsAndPrecautions: monograph.warnings_and_precautions || [],
      adverseReactions: monograph.adverse_reactions || [],
      drugInteractions: monograph.drug_interactions || [],
      overdosage: monograph.overdosage || [],
      useInSpecificPopulations: monograph.use_in_specific_populations || [],
      deaSchedule: monograph.dea_schedule,
      controlledSubstance: monograph.controlled_substance
    };
  }

  /**
   * Extract dosing information from monograph
   */
  extractDosingInfo(monograph: DailyMedMonograph): any {
    return {
      indicationsAndUsage: monograph.indications_and_usage || [],
      dosageAndAdministration: monograph.dosage_and_administration || [],
      dosageForms: monograph.dosage_form || [],
      routes: monograph.route || [],
      howSupplied: monograph.how_supplied || [],
      storageAndHandling: monograph.storage_and_handling || []
    };
  }

  /**
   * Extract patient counseling information
   */
  extractPatientCounselingInfo(monograph: DailyMedMonograph): string[] {
    return monograph.patient_counseling_information || [];
  }
}

export default new DailyMedService();
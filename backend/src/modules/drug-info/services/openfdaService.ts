import axios from 'axios';
import logger from '../../../utils/logger';

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug';

interface OpenFDAEventResult {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: Array<{
    safetyreportid: string;
    receivedate: string;
    receiptdate: string;
    seriousnessdeath: string;
    seriousnesslifethreatening: string;
    seriousnesshospitalization: string;
    patient: {
      drug: Array<{
        medicinalproduct: string;
        drugcharacterization: string;
        medicinalproductversion: string;
        drugdosagetext: string;
        drugadministrationroute: string;
        drugindication: string;
      }>;
      reaction: Array<{
        reactionmeddrapt: string;
        reactionoutcome: string;
      }>;
    };
  }>;
}

interface OpenFDALabelResult {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: Array<{
    effective_time: string;
    version: string;
    openfda: {
      brand_name: string[];
      generic_name: string[];
      manufacturer_name: string[];
      product_type: string[];
    };
    indications_and_usage: string[];
    dosage_and_administration: string[];
  }>;
}

class OpenFdaService {
  /**
   * Get adverse effects for a drug
   * @param {string} drugName - Name of the drug
   * @param {number} limit - Number of records to return
   * @returns {Promise<OpenFDAEventResult>} - Adverse effects data
   */
  async getAdverseEffects(drugName: string, limit: number = 10): Promise<OpenFDAEventResult> {
    try {
      const response = await axios.get(`${OPENFDA_BASE_URL}/event.json`, {
        params: {
          search: `patient.drug.medicinalproduct:${drugName}`,
          limit: limit
        }
      });
      return response.data;
    } catch (error: any) {
      logger.error('OpenFDA adverse effects error:', error);
      throw new Error(`Failed to get adverse effects: ${error.message}`);
    }
  }

  /**
   * Get drug labeling information
   * @param {string} brandName - Brand name of the drug
   * @returns {Promise<OpenFDALabelResult>} - Drug labeling data
   */
  async getDrugLabeling(brandName: string): Promise<OpenFDALabelResult> {
    try {
      const response = await axios.get(`${OPENFDA_BASE_URL}/label.json`, {
        params: {
          search: `openfda.brand_name:${brandName}`
        }
      });
      return response.data;
    } catch (error: any) {
      logger.error('OpenFDA labeling error:', error);
      throw new Error(`Failed to get drug labeling: ${error.message}`);
    }
  }
}

export default new OpenFdaService();
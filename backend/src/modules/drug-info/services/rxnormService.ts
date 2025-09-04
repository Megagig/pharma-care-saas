import axios from 'axios';
import logger from '../../../utils/logger';

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

interface RxNormDrugGroup {
  name: string;
  conceptGroup: Array<{
    tty: string;
    conceptProperties: Array<{
      rxcui: string;
      name: string;
      synonym: string;
      tty: string;
      language: string;
      suppress: string;
      umlscui: string;
    }>;
  }>;
}

interface RxNormSearchResult {
  drugGroup?: RxNormDrugGroup;
}

interface RxNormRxCuiResult {
  idGroup: {
    name: string;
    rxnormId: string[];
  };
}

interface RxNormRelatedGroup {
  rxCui: string;
  termType: string;
  conceptGroup: Array<{
    tty: string;
    conceptProperties: Array<{
      rxcui: string;
      name: string;
      synonym: string;
      tty: string;
      language: string;
      suppress: string;
      umlscui: string;
    }>;
  }>;
}

interface RxNormRelatedResult {
  relatedGroup?: RxNormRelatedGroup;
}

class RxNormService {
  /**
   * Search for drugs by name using RxNorm API
   * @param {string} name - Drug name to search for
   * @returns {Promise<RxNormSearchResult>} - Search results
   */
  async searchDrugs(name: string): Promise<RxNormSearchResult> {
    try {
      const response = await axios.get(`${RXNORM_BASE_URL}/drugs.json`, {
        params: { name }
      });
      return response.data;
    } catch (error: any) {
      logger.error('RxNorm search error:', error);
      throw new Error(`Failed to search drugs: ${error.message}`);
    }
  }

  /**
   * Get RxCUI for a drug name
   * @param {string} name - Drug name
   * @returns {Promise<RxNormRxCuiResult>} - RxCUI information
   */
  async getRxCuiByName(name: string): Promise<RxNormRxCuiResult> {
    try {
      const response = await axios.get(`${RXNORM_BASE_URL}/rxcui.json`, {
        params: { name }
      });
      return response.data;
    } catch (error: any) {
      logger.error('RxNorm RxCUI error:', error);
      throw new Error(`Failed to get RxCUI: ${error.message}`);
    }
  }

  /**
   * Get therapeutic equivalents for a drug
   * @param {string} rxcui - RxCUI of the drug
   * @returns {Promise<RxNormRelatedResult>} - Therapeutic equivalence information
   */
  async getTherapeuticEquivalents(rxcui: string): Promise<RxNormRelatedResult> {
    try {
      const response = await axios.get(`${RXNORM_BASE_URL}/related.json`, {
        params: { rxcui, tty: 'SCD' }
      });
      return response.data;
    } catch (error: any) {
      logger.error('RxNorm therapeutic equivalents error:', error);
      throw new Error(`Failed to get therapeutic equivalents: ${error.message}`);
    }
  }
}

export default new RxNormService();
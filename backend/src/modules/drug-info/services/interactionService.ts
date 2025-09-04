import axios from 'axios';
import logger from '../../../utils/logger';

const RXNAV_BASE_URL = 'https://rxnav.nlm.nih.gov/REST/interaction';

interface RxNavInteractionConcept {
  minConceptItem: {
    rxcui: string;
    name: string;
    tty: string;
  };
  sourceConceptItem: {
    id: string;
    name: string;
    url: string;
  };
}

interface RxNavInteractionPair {
  interactionConcept: RxNavInteractionConcept[];
  severity: string;
  description: string;
}

interface RxNavInteractionType {
  minConceptItem: {
    rxcui: string;
    name: string;
    tty: string;
  };
  interactionPair: RxNavInteractionPair[];
}

interface RxNavInteractionGroup {
  interactionType: RxNavInteractionType[];
}

interface RxNavInteractionResult {
  interactionTypeGroup?: RxNavInteractionGroup[];
}

interface RxNavFullInteractionType {
  minConcept: {
    rxcui: string;
    name: string;
    tty: string;
  };
  fullInteractionType: Array<{
    interactionPair: RxNavInteractionPair[];
  }>;
}

interface RxNavFullInteractionResult {
  fullInteractionTypeGroup?: Array<{
    sourceDisclaimer: string;
    drugGroup: {
      name: string;
      rxnormId: string[];
    };
    fullInteractionType: RxNavFullInteractionType[];
  }>;
}

class InteractionService {
  /**
   * Get interactions for a single drug
   * @param {string} rxcui - RxCUI of the drug
   * @returns {Promise<RxNavInteractionResult>} - Interaction data
   */
  async getInteractionsForDrug(rxcui: string): Promise<RxNavInteractionResult> {
    try {
      const response = await axios.get(`${RXNAV_BASE_URL}/interaction.json`, {
        params: { rxcui }
      });
      return response.data;
    } catch (error: any) {
      logger.error('RxNav interaction error:', error);
      throw new Error(`Failed to get interactions: ${error.message}`);
    }
  }

  /**
   * Get interactions for multiple drugs
   * @param {Array<string>} rxcuis - Array of RxCUIs
   * @returns {Promise<RxNavFullInteractionResult>} - Interaction data
   */
  async getInteractionsForMultipleDrugs(rxcuis: string[]): Promise<RxNavFullInteractionResult> {
    try {
      const response = await axios.post(`${RXNAV_BASE_URL}/list.json`, {
        rxcuis: rxcuis
      });
      return response.data;
    } catch (error: any) {
      logger.error('RxNav multiple interactions error:', error);
      throw new Error(`Failed to get multiple drug interactions: ${error.message}`);
    }
  }
}

export default new InteractionService();
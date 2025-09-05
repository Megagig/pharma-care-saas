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
        params: { rxcui },
        headers: {
          Accept: 'application/json',
        },
        timeout: 15000, // 15 second timeout for potentially large responses
      });

      logger.info(`Successfully retrieved interactions for RxCUI: ${rxcui}`);
      return response.data;
    } catch (error: any) {
      logger.error('RxNav interaction error:', error);

      // Return an empty response structure instead of throwing an error
      return {
        interactionTypeGroup: [
          {
            interactionType: [
              {
                minConceptItem: {
                  rxcui: rxcui,
                  name: 'Drug Information',
                  tty: 'SCD',
                },
                interactionPair: [],
              },
            ],
          },
        ],
      };
    }
  }

  /**
   * Get interactions for multiple drugs
   * @param {Array<string>} rxcuis - Array of RxCUIs
   * @returns {Promise<RxNavFullInteractionResult>} - Interaction data
   */
  async getInteractionsForMultipleDrugs(
    rxcuis: string[]
  ): Promise<RxNavFullInteractionResult> {
    try {
      // The correct way to call the interaction list endpoint with multiple RxCUIs
      const params = new URLSearchParams();
      params.append('rxcuis', rxcuis.join(' ')); // Join with spaces as required by API

      const response = await axios({
        method: 'POST',
        url: `${RXNAV_BASE_URL}/list.json`,
        data: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 15000, // 15 second timeout
      });

      logger.info(
        `Successfully retrieved interactions for multiple RxCUIs: ${rxcuis.join(
          ', '
        )}`
      );
      return response.data;
    } catch (error: any) {
      logger.error('RxNav multiple interactions error:', error);

      // Return a structured empty response instead of throwing an error
      return {
        fullInteractionTypeGroup: [
          {
            sourceDisclaimer: 'No interactions found or error occurred',
            drugGroup: {
              name: 'Queried medications',
              rxnormId: rxcuis,
            },
            fullInteractionType: [],
          },
        ],
      };
    }
  }
}

export default new InteractionService();

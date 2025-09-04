import axios from 'axios';
import logger from '../../../utils/logger';

const DAILYMED_BASE_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';

interface DailyMedSPL {
  set_id: string;
  title: string;
  published_date: string;
  content: any[];
}

interface DailyMedSearchResult {
  metadata: {
    total_elements: number;
    per_page: number;
    current_page: number;
  };
  results: Array<{
    setid: string;
    title: string;
    published_date: string;
  }>;
}

interface DailyMedMonograph {
  SPL?: DailyMedSPL;
}

class DailyMedService {
  /**
   * Search for drug monographs by name
   * @param {string} drugName - Name of the drug to search for
   * @returns {Promise<DailyMedSearchResult>} - Search results
   */
  async searchMonographs(drugName: string): Promise<DailyMedSearchResult> {
    try {
      const response = await axios.get(`${DAILYMED_BASE_URL}/spls.json`, {
        params: { drug_name: drugName }
      });
      return response.data;
    } catch (error: any) {
      logger.error('DailyMed search error:', error);
      throw new Error(`Failed to search monographs: ${error.message}`);
    }
  }

  /**
   * Get drug monograph by set ID
   * @param {string} setId - Set ID of the monograph
   * @returns {Promise<DailyMedMonograph>} - Monograph details
   */
  async getMonographById(setId: string): Promise<DailyMedMonograph> {
    try {
      const response = await axios.get(`${DAILYMED_BASE_URL}/spls/${setId}.json`);
      return response.data;
    } catch (error: any) {
      logger.error('DailyMed monograph error:', error);
      throw new Error(`Failed to get monograph: ${error.message}`);
    }
  }
}

export default new DailyMedService();
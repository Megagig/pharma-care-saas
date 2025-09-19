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
declare class DailyMedService {
    searchMonographs(drugName: string): Promise<DailyMedSearchResult>;
    getMonographById(setId: string): Promise<DailyMedMonograph>;
}
declare const _default: DailyMedService;
export default _default;
//# sourceMappingURL=dailymedService.d.ts.map
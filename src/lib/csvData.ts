// import 'server-only';

interface LineData {
    line_cd: string;
    company_cd: string;
    line_name: string;
    line_name_k: string;
    line_name_h: string;
    line_color_c: string;
    line_color_t: string;
}

interface StationData {
    station_cd: string;
    station_g_cd: string;
    station_name: string;
    station_name_k: string;
    station_name_r: string;
    line_cd: string;
    pref_cd: string;
    post: string;
    address: string;
    lon: string;
    lat: string;
    open_ymd: string;
    close_ymd: string;
    e_status: string;
    e_sort: string;
}

let lineData: LineData[] = [];
let stationData: StationData[] = [];
let isDataLoaded = false;

export async function loadCSVData() {
    if (isDataLoaded) {
        return true;
    }

    try {
        // 路線データの読み込み
        const lineModule = await import('../data/line.csv?raw');
        const lineRows = lineModule.default.split('\n').slice(1); // ヘッダーをスキップ
        lineData = lineRows
            .filter((row: string) => row.trim()) // 空行を除外
            .map((row: string) => {
                const [line_cd, company_cd, line_name, line_name_k, line_name_h, line_color_c, line_color_t] = row.split(',');
                return { line_cd, company_cd, line_name, line_name_k, line_name_h, line_color_c, line_color_t };
            });

        // 駅データの読み込み
        const stationModule = await import('../data/station.csv?raw');
        const stationRows = stationModule.default.split('\n').slice(1); // ヘッダーをスキップ
        stationData = stationRows
            .filter((row: string) => row.trim()) // 空行を除外
            .map((row: string) => {
                const [station_cd, station_g_cd, station_name, station_name_k, station_name_r, line_cd, pref_cd, post, address, lon, lat, open_ymd, close_ymd, e_status, e_sort] = row.split(',');
                return { station_cd, station_g_cd, station_name, station_name_k, station_name_r, line_cd, pref_cd, post, address, lon, lat, open_ymd, close_ymd, e_status, e_sort };
            });

        console.log('CSVデータの読み込みが完了しました');
        console.log('路線数:', lineData.length);
        console.log('駅数:', stationData.length);

        isDataLoaded = true;
        return true;
    } catch (error) {
        console.error('Failed to load CSV data:', error);
        return false;
    }
}

export function findLineByName(lineName: string): LineData | undefined {
    if (!isDataLoaded) {
        console.warn('CSVデータが読み込まれていません');
        return undefined;
    }
    return lineData.find(line => line.line_name === lineName);
}

export function findStationsByLineCd(lineCd: string): StationData[] {
    if (!isDataLoaded) {
        console.warn('CSVデータが読み込まれていません');
        return [];
    }
    return stationData.filter(station => station.line_cd === lineCd);
}

export function findStationByName(stationName: string, lineCd: string): StationData | undefined {
    if (!isDataLoaded) {
        console.warn('CSVデータが読み込まれていません');
        return undefined;
    }
    return stationData.find(station =>
        station.station_name === stationName &&
        station.line_cd === lineCd
    );
}

export function getLineSuggestions(input: string): LineData[] {
    if (!isDataLoaded) {
        console.warn('CSVデータが読み込まれていません');
        return [];
    }
    if (!input) return [];
    return lineData.filter(line =>
        line.line_name.includes(input) ||
        line.line_name_k.includes(input)
    );
}

export function getStationSuggestions(input: string, lineCd: string): StationData[] {
    if (!isDataLoaded) {
        console.warn('CSVデータが読み込まれていません');
        return [];
    }
    if (!input) return [];
    return stationData.filter(station =>
        station.line_cd === lineCd &&
        (station.station_name.includes(input) ||
            station.station_name_k.includes(input))
    );
} 
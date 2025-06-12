import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            stationCd,
            stationName,
            videoId,
            startTime,
            lat,
            lon,
            lineName,
            lineCd,
            userId
        } = req.body;

        // 必須パラメータのチェック
        if (!stationCd || !stationName || !videoId || !startTime || !lat || !lon || !lineName || !lineCd || !userId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 駅マッピングの追加
        const { data, error } = await supabase
            .from('station_mappings')
            .insert([{
                station_cd: stationCd,
                station_name: stationName,
                video_id: videoId,
                start_time: startTime,
                lat: lat,
                lon: lon,
                line_name: lineName,
                line_cd: lineCd,
                user_id: userId
            }])
            .select();

        if (error) {
            console.error('Error adding station mapping:', error);
            return res.status(500).json({ error: 'Failed to add station mapping' });
        }

        return res.status(200).json(data[0]);
    } catch (error) {
        console.error('Error in station-mappings API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 
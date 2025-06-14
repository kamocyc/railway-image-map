'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RailwayVideo } from '../types/RailwayData';
import { useAuth } from '../lib/auth';

export default function HomePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [railwayData, setRailwayData] = useState<RailwayVideo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/railway-data');
                const data = await response.json();
                setRailwayData(data);
            } catch (error) {
                console.error('Failed to fetch railway data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Railway Image Map</h1>
            {/* 既存のコンテンツをここに移動 */}
        </div>
    );
} 
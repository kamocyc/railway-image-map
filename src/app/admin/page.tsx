'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { StationMapping } from '../../types/StationMapping';
import { Report } from '../../types/Report';
import { updateReportStatus } from '../../lib/reports';
import camelcaseKeys from 'camelcase-keys';

interface UserData {
    id: string;
    email: string;
    created_at: string;
    mappings_count: number;
}

export async function isAdmin(userId: string | undefined) {
    if (!userId) return false;

    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', userId)
            .single();

        return !error && data !== null;
    } catch (err) {
        console.error('Admin check failed:', err);
        return false;
    }
}

export default function AdminPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userMappings, setUserMappings] = useState<StationMapping[]>([]);
    const [loadingMappings, setLoadingMappings] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
    const [reports, setReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        async function checkAdminAndFetchUsers() {
            const adminStatus = await isAdmin(user?.id);

            if (!adminStatus) {
                setError('管理者権限がありません');
                return;
            }

            await fetchUsers();
        }

        checkAdminAndFetchUsers();
    }, [user, router]);

    async function fetchUsers() {
        try {
            setLoading(true);

            const { data: adminCheck, error: adminCheckError } = await supabase
                .from('admin_users')
                .select('user_id')
                .eq('user_id', user?.id)
                .single();

            if (adminCheckError || !adminCheck) {
                throw new Error('管理者権限がありません');
            }

            const { data: mappingsData, error: mappingsError } = await supabase
                .from('station_mappings')
                .select('user_id')
                .order('user_id');

            if (mappingsError) {
                throw mappingsError;
            }

            const uniqueUserIds = [...new Set(mappingsData.map(item => item.user_id))];

            const usersWithCounts = await Promise.all(
                uniqueUserIds.map(async (userId) => {
                    const { count } = await supabase
                        .from('station_mappings')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId);

                    return {
                        id: userId,
                        email: userId,
                        created_at: new Date().toISOString(),
                        mappings_count: count || 0
                    };
                })
            );

            setUsers(usersWithCounts);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('ユーザー情報の取得に失敗しました');
        } finally {
            setLoading(false);
        }
    }

    const fetchReports = async () => {
        setLoadingReports(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select(`
          *,
          station_mappings(*),
          reporter:reporter_id(email)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedReports = (data || []).map(item => ({
                id: item.id,
                mappingId: item.mapping_id,
                reporterId: item.reporter_id,
                reporterEmail: item.reporter?.email || '不明',
                reason: item.reason,
                status: item.status,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                stationMapping: item.station_mappings
            }));

            setReports(formattedReports);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setError('通報情報の取得に失敗しました');
        } finally {
            setLoadingReports(false);
        }
    };

    useEffect(() => {
        async function checkAdminAndFetchReports() {
            if (activeTab === 'reports' && user) {
                const adminStatus = await isAdmin(user.id);
                if (adminStatus) {
                    fetchReports();
                }
            }
        }

        checkAdminAndFetchReports();
    }, [activeTab, user]);

    const handleUserSelect = async (userId: string) => {
        setSelectedUser(userId);
        setLoadingMappings(true);
        setUserMappings([]);

        try {
            const { data, error } = await supabase
                .from('station_mappings')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            setUserMappings(camelcaseKeys(data) || []);
        } catch (err) {
            console.error('Failed to fetch user mappings:', err);
            setError('ユーザーの投稿情報の取得に失敗しました');
        } finally {
            setLoadingMappings(false);
        }
    };

    const handleDeleteMapping = async (id?: number) => {
        if (!id) return;

        if (window.confirm('この投稿を削除してもよろしいですか？')) {
            try {
                const { error } = await supabase
                    .from('station_mappings')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setUserMappings(prev => prev.filter(mapping => mapping.id !== id));
                setSuccess('投稿を削除しました');
            } catch (err) {
                console.error('Failed to delete mapping:', err);
                setError('投稿の削除に失敗しました');
            }
        }
    };

    const handleUpdateReportStatus = async (reportId: string, newStatus: 'reviewed' | 'rejected') => {
        try {
            await updateReportStatus(reportId, newStatus);
            await fetchReports();
            setSuccess('通報のステータスを更新しました');
        } catch (err) {
            console.error('Failed to update report status:', err);
            setError('通報のステータス更新に失敗しました');
        }
    };

    if (error) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '1rem', borderRadius: '4px' }}>
                    {error}
                </div>
                <button onClick={() => router.push('/')} style={{ padding: '0.5rem 1rem' }}>
                    ホームに戻る
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2>管理者ページ</h2>

            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTab === 'users' ? '#2196f3' : '#e0e0e0',
                            color: activeTab === 'users' ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ユーザー管理
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTab === 'reports' ? '#2196f3' : '#e0e0e0',
                            color: activeTab === 'reports' ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        通報管理
                    </button>
                </div>

                {activeTab === 'users' ? (
                    <div>
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                                <div>
                                    <h3>ユーザー一覧</h3>
                                    <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '600px', overflowY: 'auto' }}>
                                        {users.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleUserSelect(user.id)}
                                                style={{
                                                    padding: '1rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedUser === user.id ? '#e3f2fd' : 'white',
                                                    borderBottom: '1px solid #eee'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold' }}>{user.email}</div>
                                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    投稿数: {user.mappings_count}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    {selectedUser ? (
                                        <div>
                                            <h3>ユーザーの投稿一覧</h3>
                                            {loadingMappings ? (
                                                <div>Loading...</div>
                                            ) : (
                                                <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '600px', overflowY: 'auto' }}>
                                                    {userMappings.map((mapping) => (
                                                        <div
                                                            key={mapping.id}
                                                            style={{
                                                                padding: '1rem',
                                                                borderBottom: '1px solid #eee'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 'bold' }}>{mapping.stationName}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                                        路線: {mapping.lineName}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                                        動画ID: {mapping.videoId}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                                        開始時間: {mapping.startTime}秒
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteMapping(mapping.id)}
                                                                    style={{
                                                                        padding: '0.25rem 0.5rem',
                                                                        backgroundColor: '#f44336',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    削除
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#666' }}>
                                            ユーザーを選択してください
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {loadingReports ? (
                            <div>Loading...</div>
                        ) : (
                            <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '600px', overflowY: 'auto' }}>
                                {reports.map((report) => (
                                    <div
                                        key={report.id}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid #eee'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>通報ID: {report.id}</div>
                                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    通報者: {report.reporterEmail}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    理由: {report.reason}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    ステータス: {report.status}
                                                </div>
                                                {report.stationMapping && (
                                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                        <div style={{ fontWeight: 'bold' }}>対象の投稿</div>
                                                        <div>駅名: {report.stationMapping.stationName}</div>
                                                        <div>路線: {report.stationMapping.lineName}</div>
                                                        <div>動画ID: {report.stationMapping.videoId}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                                                    disabled={report.status === 'reviewed'}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#4caf50',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: report.status === 'reviewed' ? 'not-allowed' : 'pointer',
                                                        opacity: report.status === 'reviewed' ? 0.7 : 1
                                                    }}
                                                >
                                                    確認済み
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                                                    disabled={report.status === 'rejected'}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: report.status === 'rejected' ? 'not-allowed' : 'pointer',
                                                        opacity: report.status === 'rejected' ? 0.7 : 1
                                                    }}
                                                >
                                                    却下
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/compat/router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { StationMapping } from '../../src/types/StationMapping';
import { Report } from '../../src/types/Report';
import { updateReportStatus } from '../../src/lib/reports';
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

function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userMappings, setUserMappings] = useState<StationMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (!user) {
      if (router) {
        router.push('/login');
      }
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

      // 管理者テーブルをチェック
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user?.id)
        .single();

      if (adminCheckError || !adminCheck) {
        throw new Error('管理者権限がありません');
      }

      // ユーザー情報を station_mappings テーブルから取得
      // 注: auth.admin API は管理者権限が必要なため、代わりに投稿データからユーザー情報を集計
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('station_mappings')
        .select('user_id')
        .order('user_id');

      if (mappingsError) {
        throw mappingsError;
      }

      // ユニークなユーザーIDを抽出
      const uniqueUserIds = [...new Set(mappingsData.map(item => item.user_id))];

      // 各ユーザーの投稿数を取得
      const usersWithCounts = await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const { count } = await supabase
            .from('station_mappings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

          return {
            id: userId,
            email: userId, // 注: メールアドレスは取得できないため、IDを表示
            created_at: new Date().toISOString(), // 正確な作成日は取得できない
            mappings_count: count || 0
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('ユーザー情報の取得に失敗しました');

      // 開発用のダミーデータ
      setUsers([
        { id: '1', email: 'user1@example.com', created_at: '2023-01-01', mappings_count: 5 },
        { id: '2', email: 'user2@example.com', created_at: '2023-01-02', mappings_count: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // 通報一覧を取得
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

      // データを整形
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

      // 開発用のダミーデータ
      setReports([
        {
          id: '1',
          mappingId: 1,
          reporterId: '1',
          reporterEmail: 'user1@example.com',
          reason: '不適切な内容です',
          status: 'pending',
          createdAt: '2023-01-01T00:00:00Z',
          stationMapping: {
            id: 1,
            stationCd: 1123142,
            stationName: '長町',
            lineName: '東北本線',
            lineCd: 12345,
            videoId: 'zBtJUyfPh5E',
            startTime: 0,
            lat: 38.226797,
            lon: 140.885986,
            userId: '2',
            createdAt: '2023-01-01T00:00:00Z'
          }
        }
      ]);
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
      // 選択したユーザーの投稿を取得
      const { data, error } = await supabase
        .from('station_mappings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setUserMappings(camelcaseKeys(data) || []);
    } catch (err) {
      console.error('Failed to fetch user mappings:', err);

      // 開発用のダミーデータ
      setUserMappings([
        {
          id: 1,
          stationCd: 1123142,
          stationName: '長町',
          lineName: '東北本線',
          lineCd: 12345,
          videoId: 'zBtJUyfPh5E',
          startTime: 0,
          lat: 38.226797,
          lon: 140.885986,
          userId: userId,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ]);
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

        // 削除後、リストを更新
        setUserMappings(prev => prev.filter(mapping => mapping.id !== id));

        // 通報タブが表示されている場合は通報リストも更新
        if (activeTab === 'reports') {
          fetchReports();
        }
      } catch (err) {
        console.error('Failed to delete mapping:', err);
        alert('削除に失敗しました');
      }
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: 'reviewed' | 'rejected') => {
    try {
      const success = await updateReportStatus(reportId, newStatus);
      if (success) {
        // 更新後、リストを更新
        setReports(prev =>
          prev.map(report =>
            report.id === reportId ? { ...report, status: newStatus } : report
          )
        );
      } else {
        throw new Error('ステータスの更新に失敗しました');
      }
    } catch (err) {
      console.error('Failed to update report status:', err);
      alert('ステータスの更新に失敗しました');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>ユーザー情報を読み込み中...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
        <button onClick={() => {
          if (router) {
            router.push('/');
          }
        }} style={{ padding: '0.5rem 1rem' }}>
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>管理画面</h2>

      {/* タブ切り替え */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'users' ? '#e3f2fd' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #2196f3' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'users' ? 'bold' : 'normal'
          }}
        >
          ユーザー管理
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'reports' ? '#e3f2fd' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'reports' ? '2px solid #2196f3' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'reports' ? 'bold' : 'normal'
          }}
        >
          通報管理
        </button>
      </div>

      {activeTab === 'users' ? (
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
          {/* ユーザーリスト */}
          <div style={{ flex: '1', maxWidth: '300px' }}>
            <h3>ユーザー一覧</h3>
            <div style={{ marginTop: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              {users.length === 0 ? (
                <p style={{ padding: '1rem', textAlign: 'center' }}>ユーザーがいません</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {users.map(user => (
                    <li
                      key={user.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #ddd',
                        backgroundColor: selectedUser === user.id ? '#e3f2fd' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <div style={{ fontWeight: 'bold' }}>{user.email}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        登録: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        投稿数: {user.mappings_count}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ユーザーの投稿一覧 */}
          <div style={{ flex: '2' }}>
            <h3>投稿一覧</h3>
            {!selectedUser ? (
              <p>左側のリストからユーザーを選択してください</p>
            ) : loadingMappings ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>投稿を読み込み中...</div>
            ) : userMappings.length === 0 ? (
              <p>このユーザーの投稿はありません</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>駅名</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>動画ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>投稿日時</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userMappings.map(mapping => (
                      <tr key={mapping.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.75rem' }}>{mapping.id}</td>
                        <td style={{ padding: '0.75rem' }}>{mapping.stationName}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <a
                            href={`https://www.youtube.com/watch?v=${mapping.videoId}&t=${mapping.startTime}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {mapping.videoId}
                          </a>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {mapping.createdAt ? new Date(mapping.createdAt).toLocaleString() : '不明'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // 通報管理タブ
        <div>
          <h3>通報一覧</h3>
          {loadingReports ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>通報を読み込み中...</div>
          ) : reports.length === 0 ? (
            <p>通報はありません</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>通報者</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>対象駅</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>理由</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ステータス</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>通報日時</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id} style={{
                      borderBottom: '1px solid #ddd',
                      backgroundColor: report.status === 'pending' ? '#fff8e1' :
                        report.status === 'reviewed' ? '#e8f5e9' :
                          report.status === 'rejected' ? '#ffebee' : 'transparent'
                    }}>
                      <td style={{ padding: '0.75rem' }}>{report.id}</td>
                      <td style={{ padding: '0.75rem' }}>{report.reporterEmail}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {report.stationMapping ? report.stationMapping.stationName : '削除済み'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{report.reason}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor:
                            report.status === 'pending' ? '#fff8e1' :
                              report.status === 'reviewed' ? '#e8f5e9' :
                                report.status === 'rejected' ? '#ffebee' : 'transparent',
                          color:
                            report.status === 'pending' ? '#f57f17' :
                              report.status === 'reviewed' ? '#2e7d32' :
                                report.status === 'rejected' ? '#c62828' : 'black',
                        }}>
                          {report.status === 'pending' ? '未対応' :
                            report.status === 'reviewed' ? '対応済み' :
                              report.status === 'rejected' ? '却下' : report.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {report.createdAt ? new Date(report.createdAt).toLocaleString() : '不明'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                対応済み
                              </button>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                却下
                              </button>
                            </>
                          )}
                          {report.stationMapping && (
                            <button
                              onClick={() => handleDeleteMapping(report.stationMapping?.id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#9e9e9e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              投稿削除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
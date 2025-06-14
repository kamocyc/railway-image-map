import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signOut } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        // ログイン処理
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/');
      } else {
        // サインアップ処理
        const { error, user } = await signUp(email, password);
        if (error) throw error;

        if (user) {
          setMessage('登録が完了しました。メールを確認してアカウントを有効化してください。');
          setMode('login');
        }
      }
    } catch (err: any) {
      setError(err.message || '認証エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      setMessage('ログアウトしました');
    } catch (err: any) {
      setError(err.message || 'ログアウトエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // すでにログインしている場合
  if (user) {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
        <h2>ログイン済み</h2>
        <p>あなたは既にログインしています。</p>
        <p>メールアドレス: {user.email}</p>

        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginTop: '1rem'
          }}
        >
          {loading ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2>{mode === 'login' ? '管理ログイン' : 'アカウント登録'}</h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '1rem', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            メールアドレス:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            パスワード:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            width: '100%'
          }}
        >
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録'}
        </button>
      </form>

      {/* <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        {mode === 'login' ? (
          <p>
            アカウントをお持ちでない場合は
            <button 
              onClick={() => setMode('signup')}
              style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer', textDecoration: 'underline' }}
            >
              こちら
            </button>
            から登録
          </p>
        ) : (
          <p>
            既にアカウントをお持ちの場合は
            <button 
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer', textDecoration: 'underline' }}
            >
              こちら
            </button>
            からログイン
          </p>
        )}
      </div> */}
    </div>
  );
}

export default LoginPage;
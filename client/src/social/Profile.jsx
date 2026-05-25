import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GlassCard, BottomNav } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function PostGrid({ posts, onLike }) {
  if (!posts.length) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
        <div>Sin publicaciones aún</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {posts.map(post => (
        <GlassCard key={post._id} style={{ padding: '14px 16px' }}>
          {post.image && (
            <img src={post.image} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 10, maxHeight: 320, objectFit: 'cover' }} />
          )}
          <div style={{ color: '#0a0a14', fontSize: 14, lineHeight: 1.55, marginBottom: 10 }}>{post.content}</div>
          <div style={{ display: 'flex', gap: 16, color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>
            <span>❤️ {post.likes?.length || 0}</span>
            <span>💬 {post.comments?.length || 0}</span>
            <span style={{ marginLeft: 'auto' }}>{new Date(post.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function BookmarksTab({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/posts/bookmarked`)
      .then(r => setPosts(r.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(10,10,20,0.35)' }}>Cargando...</div>;
  if (!posts.length) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔖</div>
        <div>Sin guardados aún</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Guarda posts con el botón 🔖 del feed</div>
      </div>
    );
  }
  return <PostGrid posts={posts} />;
}

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [tab, setTab] = useState('posts');

  const targetId = userId || currentUser?._id || currentUser?.id;
  const isOwnProfile = !userId || userId === (currentUser?._id || currentUser?.id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileEndpoint = isOwnProfile
          ? `${API_URL}/auth/profile`
          : `${API_URL}/users/${targetId}`;

        const [profileRes, postsRes] = await Promise.all([
          axios.get(profileEndpoint),
          axios.get(`${API_URL}/posts/user/${targetId}`)
        ]);

        const profileData = profileRes.data.user || profileRes.data;
        setProfile(profileData);
        setPosts(postsRes.data.posts || []);

        if (!isOwnProfile && currentUser) {
          const followed = profileData.followers?.some(
            f => (f._id || f)?.toString() === (currentUser._id || currentUser.id)?.toString()
          );
          setIsFollowing(!!followed);
        }
      } catch (err) {
        // silenced;
      } finally {
        setLoading(false);
      }
    };

    const fetchBlockStatus = async () => {
      if (!currentUser || isOwnProfile) return;
      try {
        const res = await axios.get(`${API_URL}/users/blocked`);
        const blocked = res.data.blocked || [];
        setIsBlocked(blocked.some(b => (b.blockedUser?._id || b.blockedUser)?.toString() === targetId?.toString()));
      } catch {}
    };

    fetchProfile();
    fetchBlockStatus();
  }, [targetId]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axios.post(`${API_URL}/auth/unfollow/${targetId}`);
      } else {
        await axios.post(`${API_URL}/auth/follow/${targetId}`);
      }
      setIsFollowing(f => !f);
      setProfile(p => ({
        ...p,
        followers: isFollowing
          ? (p.followers || []).filter(f => (f._id || f)?.toString() !== (currentUser?._id || currentUser?.id)?.toString())
          : [...(p.followers || []), currentUser?._id || currentUser?.id]
      }));
    } catch (err) {
      // silenced;
    }
  };

  const handleBlock = async () => {
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await axios.delete(`${API_URL}/users/${targetId}/block`);
        setIsBlocked(false);
      } else {
        await axios.post(`${API_URL}/users/${targetId}/block`);
        setIsBlocked(true);
      }
    } catch (err) {
      // silenced;
    } finally {
      setBlockLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(10,10,20,0.5)' }}>Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.5)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>😕</div>
          <div>Perfil no encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 100 }}>
      {/* Back button */}
      {userId && (
        <button onClick={() => navigate(-1)}
          style={{ position: 'fixed', top: 16, left: 16, zIndex: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(79,172,254,0.18)', borderRadius: '50%', width: 40, height: 40, color: '#0a0a14', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
      )}

      {/* Cover + Avatar */}
      <div style={{ position: 'relative', height: 180, background: 'linear-gradient(135deg,#1a0533,#0c1a3d,#001c2e)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(168,85,247,0.3)', top: i * 10 - 60, left: i * 25 - 80 }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)' }}>
          <img src={profile.avatar} alt={profile.username}
            style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(168,85,247,0.8)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }} />
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
        {/* Profile info */}
        <div style={{ paddingTop: 56, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ color: '#0a0a14', fontSize: 20, fontWeight: 800, marginBottom: 2 }}>
            {profile.firstName || ''} {profile.lastName || ''}
            {profile.isVerified && <span style={{ marginLeft: 6, fontSize: 16 }}>✅</span>}
          </div>
          <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 13, marginBottom: 8 }}>@{profile.username}</div>
          {profile.bio && (
            <div style={{ color: 'rgba(10,10,20,0.7)', fontSize: 13, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 12px' }}>{profile.bio}</div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
            {[
              { label: 'Posts', value: posts.length },
              { label: 'Seguidores', value: profile.followers?.length || 0 },
              { label: 'Siguiendo', value: profile.following?.length || 0 },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#0a0a14', fontSize: 18, fontWeight: 800 }}>{stat.value}</div>
                <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!isOwnProfile && currentUser && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleFollow}
                style={{ padding: '9px 28px', borderRadius: 28, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', background: isFollowing ? 'rgba(79,172,254,0.1)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#0a0a14' }}>
                {isFollowing ? 'Siguiendo ✓' : 'Seguir'}
              </button>
              <button onClick={handleBlock} disabled={blockLoading}
                style={{ padding: '9px 20px', borderRadius: 28, fontWeight: 700, fontSize: 13, border: `1px solid ${isBlocked ? 'rgba(251,191,36,0.5)' : 'rgba(239,68,68,0.4)'}`, background: 'transparent', color: isBlocked ? '#fbbf24' : '#ef4444', cursor: 'pointer', opacity: blockLoading ? 0.5 : 1 }}>
                {blockLoading ? '...' : isBlocked ? 'Desbloquear' : 'Bloquear'}
              </button>
            </div>
          )}
          {isOwnProfile && (
            <button onClick={() => navigate('/settings')}
              style={{ padding: '9px 24px', borderRadius: 28, fontWeight: 700, fontSize: 13, border: '1px solid rgba(79,172,254,0.25)', background: 'transparent', color: '#0a0a14', cursor: 'pointer' }}>
              ✏️ Editar perfil
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(79,172,254,0.04)', borderRadius: 14, padding: 4 }}>
          {[
            { id: 'posts', label: '📝 Posts' },
            ...(isOwnProfile ? [{ id: 'bookmarks', label: '🔖 Guardados' }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t.id ? 'rgba(124,58,237,0.6)' : 'transparent', color: '#0a0a14', transition: 'background 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'posts' && <PostGrid posts={posts} />}
        {tab === 'bookmarks' && isOwnProfile && <BookmarksTab userId={targetId} />}
      </div>

      <BottomNav />
    </div>
  );
}

export default Profile;

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GlassCard, BottomNav, HashtagText } from '../components/kronos';
import { AuthContext } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentOpen, setCommentOpen] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [tab, setTab] = useState('posts');

  const fetchCommunity = async () => {
    try {
      const res = await axios.get(`${API_URL}/communities/${id}`);
      setCommunity(res.data.data);
    } catch (e) {
      // silenced;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommunity(); }, [id]);

  const myEntry = community?.members?.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isMember = !!myEntry;
  const myRole = myEntry?.role || null;
  const isAdmin = myRole === 'admin';
  const isMod = myRole === 'mod' || myRole === 'admin';

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      await axios.post(`${API_URL}/communities/${id}/posts`, { content: postText });
      setPostText('');
      fetchCommunity();
    } catch (e) {
      // silenced;
    } finally {
      setPosting(false);
    }
  };

  const handleJoin = async () => {
    const userId = user?._id || user?.id;
    // Optimistic update
    if (isMember) {
      setCommunity(c => ({ ...c, members: c.members.filter(m => (m.user?._id || m.user)?.toString() !== userId?.toString()) }));
    } else {
      setCommunity(c => ({ ...c, members: [...(c.members || []), { user: { _id: userId, username: user?.username, avatar: user?.avatar, firstName: user?.firstName, lastName: user?.lastName }, role: 'member' }] }));
    }
    try {
      await axios.post(`${API_URL}/communities/${id}/join`);
      fetchCommunity(); // sync with server
    } catch (e) {
      fetchCommunity(); // revert on error
    }
  };

  const handleLike = async postId => {
    try {
      await axios.post(`${API_URL}/communities/${id}/posts/${postId}/like`);
      fetchCommunity();
    } catch (e) {
      // silenced;
    }
  };

  const handleDeletePost = async postId => {
    if (!window.confirm('¿Eliminar este post?')) return;
    try {
      await axios.delete(`${API_URL}/communities/${id}/posts/${postId}`);
      fetchCommunity();
    } catch (e) {
      // silenced;
    }
  };

  const handleAssignRole = async (targetUserId, role) => {
    try {
      await axios.put(`${API_URL}/communities/${id}/members/role`, { targetUserId, role });
      fetchCommunity();
    } catch (e) {
      // silenced;
    }
  };

  const handleComment = async postId => {
    if (!commentText.trim()) return;
    try {
      await axios.post(`${API_URL}/communities/${id}/posts/${postId}/comment`, { text: commentText });
      setCommentText('');
      setCommentOpen(null);
      fetchCommunity();
    } catch (e) {
      // silenced;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 80 }}>
        <div style={{ height: 140, background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2))' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: 'rgba(79,172,254,0.04)', borderRadius: 16, marginBottom: 14, height: i === 1 ? 100 : 140, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  if (!community) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(10,10,20,0.5)' }}>
        Comunidad no encontrada
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 80 }}>
      {/* Cover/Header */}
      <div style={{ height: 140, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', position: 'relative' }}>
        <button onClick={() => navigate('/communities')} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.4)', border: 'none', color: '#0a0a14', fontSize: 18, cursor: 'pointer', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
        {/* Community info */}
        <GlassCard style={{ marginTop: -30, marginBottom: 16, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#0a0a14', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{community.name}</div>
              {community.description && (
                <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 13, marginBottom: 10, lineHeight: 1.4 }}>{community.description}</div>
              )}
              <div style={{ display: 'flex', gap: 16, color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>
                <span>👥 {community.members?.length || 0} miembros</span>
                <span>📝 {community.posts?.length || 0} posts</span>
                <span>{community.privacy === 'private' ? '🔒 Privada' : '🌍 Pública'}</span>
              </div>
            </div>
            <button onClick={handleJoin}
              style={{ padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: isMember ? 'rgba(79,172,254,0.1)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff' }}>
              {isMember ? 'Salir' : 'Unirse'}
            </button>
          </div>
        </GlassCard>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ id: 'posts', label: '📝 Posts' }, { id: 'members', label: '👥 Miembros' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '9px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.06)', color: '#fff' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <>
            {/* Post composer */}
            <GlassCard style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=U&background=7c3aed&color=fff&size=36`}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder={`Escribe en ${community.name}...`}
                  style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 12, padding: '10px 14px', color: '#0a0a14', fontSize: 14, resize: 'none', outline: 'none', minHeight: 70, fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handlePost} disabled={posting || !postText.trim()}
                  style={{ padding: '8px 24px', borderRadius: 20, background: postText.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: postText.trim() ? 'pointer' : 'default' }}>
                  {posting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </GlassCard>

            {/* Posts */}
            {(community.posts || []).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div>Aún no hay posts en esta comunidad</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {community.posts.map(post => {
                  const isLiked = post.likes?.some(l => (l._id || l)?.toString() === user?._id?.toString());
                  const isOpen = commentOpen === post._id;
                  return (
                    <GlassCard key={post._id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <img
                          src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.username || 'U')}&background=7c3aed&color=fff&size=36`}
                          alt=""
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#0a0a14', fontSize: 13, fontWeight: 600 }}>{post.author?.firstName} {post.author?.lastName || post.author?.username}</div>
                          <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 11 }}>{new Date(post.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        {(isMod || post.author?._id?.toString() === user?._id?.toString()) && (
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', fontSize: 14, padding: '4px 6px' }}
                            title="Eliminar post"
                          >🗑️</button>
                        )}
                      </div>
                      <div style={{ color: 'rgba(10,10,20,0.65)', fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>
                        <HashtagText text={post.content} />
                      </div>
                      <div style={{ display: 'flex', gap: 24, color: 'rgba(10,10,20,0.5)', fontSize: 13, paddingTop: 8, borderTop: '1px solid rgba(79,172,254,0.12)' }}>
                        <button onClick={() => handleLike(post._id)}
                          style={{ background: 'none', border: 'none', color: isLiked ? '#ec4899' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
                          {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                        </button>
                        <button onClick={() => { setCommentOpen(isOpen ? null : post._id); setCommentText(''); }}
                          style={{ background: 'none', border: 'none', color: isOpen ? '#06b6d4' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
                          💬 {post.comments?.length || 0}
                        </button>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: 10 }}>
                          {post.comments?.slice(-3).map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                              <img
                                src={c.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.username || 'U')}&background=7c3aed&color=fff&size=26`}
                                alt=""
                                style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              />
                              <div style={{ background: 'rgba(79,172,254,0.07)', borderRadius: 10, padding: '6px 10px', flex: 1 }}>
                                {c.author?.username && (
                                  <div style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>@{c.author.username}</div>
                                )}
                                <div style={{ color: 'rgba(10,10,20,0.65)', fontSize: 12 }}>{c.text}</div>
                              </div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment(post._id)}
                              placeholder="Comenta..."
                              style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 20, padding: '7px 12px', color: '#0a0a14', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                            <button onClick={() => handleComment(post._id)} disabled={!commentText.trim()}
                              style={{ padding: '7px 14px', borderRadius: 20, background: commentText.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>→</button>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(community.members || []).map(entry => {
              const member = entry.user || entry;
              const memberId = member._id || member;
              const role = entry.role || 'member';
              void (community.creator?._id?.toString() === memberId?.toString());
              const roleBadge = role === 'admin'
                ? { label: 'Admin', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)' }
                : role === 'mod'
                  ? { label: 'Mod', bg: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }
                  : null;

              return (
                <GlassCard key={memberId}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.username || 'U')}&background=7c3aed&color=fff&size=44`}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 600 }}>{member.firstName} {member.lastName || member.username}</div>
                      <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>@{member.username}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {roleBadge && (
                        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: roleBadge.bg, color: '#0a0a14', fontWeight: 700 }}>
                          {roleBadge.label}
                        </span>
                      )}
                      {/* Admin puede cambiar roles de no-admins que no sean él mismo */}
                      {isAdmin && memberId?.toString() !== user?._id?.toString() && role !== 'admin' && (
                        <select
                          value={role}
                          onChange={e => handleAssignRole(memberId, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{
                            background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.18)',
                            borderRadius: 8, padding: '3px 8px', color: '#0a0a14', fontSize: 11, cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="member">Member</option>
                          <option value="mod">Mod</option>
                        </select>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

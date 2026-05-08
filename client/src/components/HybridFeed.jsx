import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HoloText, GlassCard, BottomNav } from './kronos';
import { AuthContext } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function HybridFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentOpen, setCommentOpen] = useState(null);
  const [commentText, setCommentText] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/feed/hybrid`, { params: { page: 1, limit: 20 } });
      setFeed(res.data.feed || []);
    } catch (e) {
      console.error('Error fetching feed:', e);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      await axios.post(`${API_URL}/posts`, { content: postText });
      setPostText('');
      fetchFeed();
    } catch (e) {
      console.error('Error creating post:', e);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/posts/${postId}/like`);
      fetchFeed();
    } catch (e) {
      console.error('Error liking post:', e);
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await axios.post(`${API_URL}/posts/${postId}/comment`, { text: commentText });
      setCommentText('');
      setCommentOpen(null);
      fetchFeed();
    } catch (e) {
      console.error('Error commenting:', e);
    }
  };

  const handleShare = async (postId) => {
    try {
      await axios.post(`${API_URL}/posts/${postId}/share`);
      fetchFeed();
    } catch (e) {
      // share endpoint may not exist yet — just show native share
    }
    if (navigator.share) {
      navigator.share({ title: 'Kronos', url: window.location.href }).catch(() => {});
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#08080f', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 680, margin: '0 auto' }}>
        <HoloText size={26}>Feed</HoloText>
        <div style={{ display: 'flex', gap: 14, fontSize: 22 }}>
          <span style={{ cursor: 'pointer' }}>🔔</span>
          <span style={{ cursor: 'pointer' }}>✨</span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>

        {/* Post composer */}
        <GlassCard style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=U&background=7c3aed&color=fff&size=40`}
              alt="avatar"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="¿Qué está pasando?"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, resize: 'none',
                outline: 'none', minHeight: 70, fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handlePost}
              disabled={posting || !postText.trim()}
              style={{
                padding: '8px 24px', borderRadius: 20,
                background: postText.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)',
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: postText.trim() ? 'pointer' : 'default', transition: 'all 0.2s',
              }}
            >
              {posting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </GlassCard>

        {/* Feed items */}
        {loading && feed.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>Cargando feed...</div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Sin publicaciones aún</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>¡Sé el primero en publicar algo!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {feed.map((item) => {
              if (item.type === 'post') {
                const post = item.data;
                const isLiked = post.likes?.some(id => id === user?._id || id?.toString() === user?._id?.toString());
                const isOpen = commentOpen === post._id;
                return (
                  <GlassCard key={`post-${post._id}`}>
                    {/* Author */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <img
                        src={post.author?.avatar || 'https://ui-avatars.com/api/?name=U&background=random&color=fff&size=40'}
                        alt={post.author?.username}
                        onClick={() => navigate(`/social/profile/${post.author?._id}`)}
                        style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                          {post.author?.firstName} {post.author?.lastName || post.author?.username}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                          {new Date(post.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {post.content && (
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>
                        {post.content}
                      </div>
                    )}
                    {post.image && (
                      <img src={post.image} alt="post" style={{ width: '100%', borderRadius: 10, maxHeight: 400, objectFit: 'cover', marginBottom: 10 }} />
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 24, color: 'rgba(255,255,255,0.5)', fontSize: 13, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        onClick={() => handleLike(post._id)}
                        style={{ background: 'none', border: 'none', color: isLiked ? '#ec4899' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}
                      >
                        {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                      </button>
                      <button
                        onClick={() => { setCommentOpen(isOpen ? null : post._id); setCommentText(''); }}
                        style={{ background: 'none', border: 'none', color: isOpen ? '#06b6d4' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}
                      >
                        💬 {post.comments?.length || 0}
                      </button>
                      <button
                        onClick={() => handleShare(post._id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}
                      >
                        🔄 {post.shares || 0}
                      </button>
                    </div>

                    {/* Comments section */}
                    {isOpen && (
                      <div style={{ marginTop: 10 }}>
                        {post.comments?.length > 0 && (
                          <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {post.comments.slice(-3).map((c, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👤</div>
                                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '6px 10px', flex: 1 }}>
                                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{c.text}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleComment(post._id)}
                            placeholder="Escribe un comentario..."
                            style={{
                              flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 20, padding: '8px 14px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                            }}
                          />
                          <button
                            onClick={() => handleComment(post._id)}
                            disabled={!commentText.trim()}
                            style={{ padding: '8px 16px', borderRadius: 20, background: commentText.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}
                          >
                            →
                          </button>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                );
              }

              const product = item.data;
              return (
                <GlassCard
                  key={`product-${product._id}`}
                  onClick={() => navigate(`/shop/product/${product._id}`)}
                  style={{ cursor: 'pointer', border: '1px solid rgba(168,85,247,0.2)', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))' }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.name} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{product.name}</div>
                        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: '#fff' }}>🛍️</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ color: '#a855f7', fontSize: 18, fontWeight: 800 }}>${product.price}</span>
                        {product.originalPrice && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'line-through' }}>${product.originalPrice}</span>}
                        <span style={{ color: '#facc15', fontSize: 12, marginLeft: 'auto' }}>⭐ {product.rating || 0}</span>
                      </div>
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

export default HybridFeed;

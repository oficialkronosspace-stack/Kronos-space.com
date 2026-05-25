import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HoloText, GlassCard, KronosImage } from './kronos';
import { AuthContext } from '../context/AuthContext';
import StoriesBar from './stories/StoriesBar';
import FollowSuggestions from './FollowSuggestions';
import HashtagText from './HashtagText';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Renderiza solo posts cercanos al viewport usando IntersectionObserver
function LazyFeedItem({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? 'auto' : 120 }}>
      {visible ? children : null}
    </div>
  );
}

function HybridFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentOpen, setCommentOpen] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [bookmarks, setBookmarks] = useState(new Set());
  const sentinelRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const fetchFeed = useCallback(async (cursorId = null) => {
    if (cursorId) setLoadingMore(true); else setLoading(true);
    try {
      const params = { limit: 20 };
      if (cursorId) params.cursor = cursorId;
      const res = await axios.get(`${API_URL}/feed/hybrid`, { params });
      const items = res.data.feed || [];
      if (cursorId) {
        setFeed(prev => [...prev, ...items]);
      } else {
        setFeed(items);
      }
      // cursor = id del último item recibido
      const last = items[items.length - 1];
      setCursor(last ? (last.data?._id || null) : null);
      setHasMore(items.length === 20);
    } catch (e) {
      console.error('Error fetching feed:', e);
      if (!cursorId) setFeed([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // Infinite scroll via IntersectionObserver en el sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && cursor) fetchFeed(cursor); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetchFeed]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setPostImage(null);
    setPostImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!postText.trim() && !postImage) return;
    setPosting(true);
    try {
      let imageUrl = null;
      if (postImage) {
        const fd = new FormData();
        fd.append('file', postImage);
        fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_PRESET || 'kronos_posts');
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (cloudName) {
          const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, fd
          );
          imageUrl = res.data.secure_url;
        }
      }
      await axios.post(`${API_URL}/posts`, { content: postText, image: imageUrl });
      setPostText('');
      clearImage();
      fetchFeed();
    } catch (e) {
      console.error('Error creating post:', e);
    } finally {
      setPosting(false);
    }
  };

  const handleBookmark = async (postId) => {
    try {
      await axios.post(`${API_URL}/posts/${postId}/bookmark`);
      setBookmarks(prev => {
        const next = new Set(prev);
        next.has(postId) ? next.delete(postId) : next.add(postId);
        return next;
      });
    } catch (e) {
      console.error('Error bookmarking:', e);
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
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 680, margin: '0 auto' }}>
        <HoloText size={26}>Feed</HoloText>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>

        {/* Stories Bar */}
        <GlassCard style={{ marginBottom: 16, padding: '8px 16px' }}>
          <StoriesBar />
        </GlassCard>

        {/* Follow Suggestions */}
        <FollowSuggestions />

        {/* Post composer */}
        <GlassCard style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <KronosImage
              src={user?.avatar}
              alt={user?.username || 'U'}
              width={36} height={36}
              rounded
              style={{ flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value.slice(0, 280))}
                placeholder="¿Qué está pasando?"
                style={{
                  width: '100%', background: 'rgba(79,172,254,0.07)', border: `1px solid ${postText.length > 260 ? (postText.length >= 280 ? '#ef4444' : '#f59e0b') : 'rgba(79,172,254,0.18)'}`,
                  borderRadius: 12, padding: '10px 14px', color: '#0a0a14', fontSize: 14, resize: 'none',
                  outline: 'none', minHeight: 70, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              {postText.length > 0 && (
                <div style={{ textAlign: 'right', fontSize: 11, marginTop: 3, color: postText.length >= 280 ? '#ef4444' : postText.length > 260 ? '#f59e0b' : 'rgba(10,10,20,0.35)' }}>
                  {postText.length}/280
                </div>
              )}
            </div>
          </div>
          {postImagePreview && (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <img src={postImagePreview} alt="preview" style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover' }} />
              <button onClick={clearImage} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', color: 'rgba(10,10,20,0.5)', fontSize: 20, padding: '4px 8px' }} title="Agregar imagen">
              📷
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
            </label>
            <button
              onClick={handlePost}
              disabled={posting || (!postText.trim() && !postImage)}
              style={{
                padding: '8px 24px', borderRadius: 20,
                background: (postText.trim() || postImage) ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)',
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                cursor: (postText.trim() || postImage) ? 'pointer' : 'default', transition: 'all 0.2s',
              }}
            >
              {posting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </GlassCard>

        {/* Feed items */}
        {loading && feed.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.5)', padding: 40 }}>Cargando feed...</div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(10,10,20,0.5)' }}>Sin publicaciones aún</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>¡Sé el primero en publicar algo!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {feed.map((item) => {
              if (item.type === 'post') {
                const post = item.data;
                const postKey = `post-${post._id}`;
                const isLiked = post.likes?.some(id => id === user?._id || id?.toString() === user?._id?.toString());
                const isOpen = commentOpen === post._id;
                return (
                  <LazyFeedItem key={postKey}>
                  <GlassCard>
                    {/* Author */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <KronosImage
                        src={post.author?.avatar}
                        alt={post.author?.username || 'U'}
                        width={36} height={36}
                        rounded
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 600 }}>
                          {post.author?.firstName} {post.author?.lastName || post.author?.username}
                        </div>
                        <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 11 }}>
                          {new Date(post.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {post.content && (
                      <div style={{ color: '#0a0a14', fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>
                        <HashtagText text={post.content} />
                      </div>
                    )}
                    {post.image && (
                      <KronosImage src={post.image} alt="post" style={{ width: '100%', borderRadius: 10, maxHeight: 400, objectFit: 'cover', marginBottom: 10 }} />
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 24, color: 'rgba(10,10,20,0.5)', fontSize: 13, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
                        style={{ background: 'none', border: 'none', color: 'rgba(10,10,20,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}
                      >
                        🔄 {post.shares || 0}
                      </button>
                      <button
                        onClick={() => handleBookmark(post._id)}
                        style={{ background: 'none', border: 'none', color: bookmarks.has(post._id) ? '#a855f7' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit', marginLeft: 'auto' }}
                      >
                        {bookmarks.has(post._id) ? '🔖' : '🏷️'}
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
                                <div style={{ background: 'rgba(79,172,254,0.07)', borderRadius: 10, padding: '6px 10px', flex: 1 }}>
                                  <div style={{ color: '#0a0a14', fontSize: 13 }}>{c.text}</div>
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
                              flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.18)',
                              borderRadius: 20, padding: '8px 14px', color: '#0a0a14', fontSize: 13, outline: 'none', fontFamily: 'inherit',
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
                  </LazyFeedItem>
                );
              }

              // Productos de tienda no aparecen en el feed social
              return null;
            })}

            {/* Sentinel para infinite scroll */}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && (
              <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 16, fontSize: 13 }}>
                Cargando más...
              </div>
            )}
            {!hasMore && feed.length > 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 16, fontSize: 12 }}>
                — Fin del feed —
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default HybridFeed;

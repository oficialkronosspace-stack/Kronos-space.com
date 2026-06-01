const Post = require('../models/Post');
const User = require('../models/User');
const UserBlock = require('../models/UserBlock');
const { emitNotification } = require('../services/socketService');
const aiService = require('../services/aiService');

// Helper: IDs de usuarios bloqueados (en ambas direcciones)
const getBlockedUserIds = async (userId) => {
  const blocks = await UserBlock.find({
    $or: [{ blockedBy: userId }, { blockedUser: userId }]
  }).select('blockedBy blockedUser');

  const blockedIds = new Set();
  blocks.forEach((b) => {
    const otherId = b.blockedBy.toString() === userId.toString()
      ? b.blockedUser.toString()
      : b.blockedBy.toString();
    blockedIds.add(otherId);
  });

  return Array.from(blockedIds);
};

// Crear post
exports.createPost = async (req, res) => {
  try {
    const { content, image, video, music, visibility } = req.body;

    // Moderación IA: analizar contenido de texto antes de publicar
    if (content && content.trim().length > 0) {
      const moderation = await aiService.analyzeSentiment(content);
      // Bloquear si toxicidad alta o marcado como no seguro
      if (!moderation.safe || moderation.toxicity >= 0.75) {
        return res.status(422).json({
          success: false,
          blocked: true,
          reason: 'Tu publicación fue bloqueada por contener contenido inapropiado. Revísala y vuelve a intentarlo.',
          toxicity: moderation.toxicity
        });
      }
    }

    const post = new Post({
      author: req.user.id,
      content,
      image,
      video,
      music,
      visibility: visibility || 'public'
    });

    await post.save();
    await post.populate('author', 'username avatar firstName lastName');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener feed (posts de usuarios que sigo)
exports.getFeed = async (req, res) => {
  try {
    const [currentUser, blockedIds] = await Promise.all([
      User.findById(req.user.id),
      getBlockedUserIds(req.user.id)
    ]);
    const followingIds = [...currentUser.following, req.user.id]; // Incluir posts propios

    const posts = await Post.find({
      author: { $in: followingIds, $nin: blockedIds },
      visibility: { $in: ['public', 'followers'] }
    })
      .populate('author', 'username avatar firstName lastName')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener posts de un usuario
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user ? req.user.id : null;

    // Verificar si el solicitante tiene bloqueado al autor (o viceversa)
    if (requesterId) {
      const block = await UserBlock.findOne({
        $or: [
          { blockedBy: requesterId, blockedUser: userId },
          { blockedBy: userId, blockedUser: requesterId }
        ]
      });

      if (block) {
        return res.status(403).json({ message: 'You cannot view posts from this user' });
      }
    }

    const posts = await Post.find({ author: userId, visibility: 'public' })
      .populate('author', 'username avatar firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already liked this post' });
    }

    post.likes.push(req.user.id);
    await post.save();

    // Notificar al autor del post (si no es el mismo usuario)
    const postAuthorId = post.author.toString();
    if (postAuthorId !== req.user.id.toString()) {
      emitNotification(postAuthorId, {
        type: 'like',
        from: req.user.id,
        postId: post._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post liked'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Comentar en post
exports.commentPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.user.id,
      text
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'username avatar');

    // Notificar al autor del post (si no es el mismo usuario)
    const postAuthorId = post.author.toString();
    if (postAuthorId !== req.user.id.toString()) {
      emitNotification(postAuthorId, {
        type: 'comment',
        from: req.user.id,
        postId: post._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment added',
      post
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle bookmark
exports.bookmarkPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user = await User.findById(req.user.id).select('bookmarks');
    const bookmarks = user.bookmarks || [];
    const idx = bookmarks.findIndex(b => b.toString() === postId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
    } else {
      bookmarks.push(postId);
    }
    await User.findByIdAndUpdate(req.user.id, { bookmarks });
    res.json({ success: true, bookmarked: idx < 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bookmarked posts
exports.getBookmarkedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bookmarks');
    const posts = await Post.find({ _id: { $in: user.bookmarks || [] } })
      .populate('author', 'username avatar firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Chat from './Chat';
import ConversationList from './ConversationList';

function SocialModule() {
  return (
    <Routes>
      <Route path="/chat" element={<ConversationList />} />
      <Route path="/chat/:userName" element={<Chat />} />
    </Routes>
  );
}

export default SocialModule;

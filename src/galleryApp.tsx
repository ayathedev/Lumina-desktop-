import React, { useContext, useState } from 'react';
import { SocialContext, Post } from './App';
import { X } from 'lucide-react';

export const GalleryApp = () => {
  const { posts } = useContext(SocialContext);
  const photos = posts.filter(p => p.type === 'photo');
  const [selectedPhoto, setSelectedPhoto] = useState<Post | null>(null);

  const deletePhoto = (postId: string) => {
    // Note: Since SocialContext doesn't provide a deletePost method,
    // this currently only logs the action.
    console.log('Delete photo requested for:', postId);
  };

  return (
    <div className="h-full bg-slate-50 p-6 overflow-y-auto">
      <h3 className="text-2xl font-black text-slate-800 mb-6">Gallery</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map(post => (
          <div key={post.id} className="relative group rounded-2xl overflow-hidden aspect-square border border-slate-200">
            <img 
              src={post.content} 
              alt="Gallery" 
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
              onClick={() => setSelectedPhoto(post)}
            />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                deletePhoto(post.id);
              }}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto.content} alt="Full" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
};

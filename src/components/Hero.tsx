import React from 'react';

interface HeroProps {
  onBrowseClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBrowseClick }) => {
  return (
    <div className="relative pt-16">
      <div className="absolute inset-0">
        <img
          className="w-full h-[600px] object-cover"
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
          alt="Library"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-64">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="text-4xl font-serif tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block font-sans font-light">Welcome to the</span>
            <span className="block font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text animate-text-glow">
              WordWave
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 font-light italic">
            Your Gateway to Infinite Stories
          </p>
          <p className="mt-6 text-xl text-gray-300">
            Explore thousands of books from contemporary bestsellers to timeless classics,
            all at your fingertips.
          </p>
          <div className="mt-10 flex gap-4">
            <button 
              onClick={onBrowseClick}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Browse Library
            </button>
            <button className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
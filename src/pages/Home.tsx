import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import FeaturedBooks from '../components/FeaturedBooks';
import PopularBooks from '../components/PopularBooks';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleBrowseClick = () => {
    navigate('/books');
  };

  return (
    <div>
      <Hero onBrowseClick={handleBrowseClick} />
      <FeaturedBooks />
      <PopularBooks />
    </div>
  );
};

export default Home;
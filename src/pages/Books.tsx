import React from 'react';
import BrowseLibrary from '../components/BrowseLibrary';
import { useNavigate } from 'react-router-dom';

const Books: React.FC = () => {
  const navigate = useNavigate();

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  return (
    <BrowseLibrary onBookClick={handleBookClick} />
  );
};

export default Books;
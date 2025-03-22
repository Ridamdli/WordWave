import React from 'react';

const PopularBooks: React.FC = () => {
  const books = [
    {
      id: 1,
      title: "Dune",
      author: "Frank Herbert",
      cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      readers: 12453
    },
    {
      id: 2,
      title: "The Silent Patient",
      author: "Alex Michaelides",
      cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.6,
      readers: 9876
    },
    {
      id: 3,
      title: "The Psychology of Money",
      author: "Morgan Housel",
      cover: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      readers: 8543
    },
    {
      id: 4,
      title: "The Thursday Murder Club",
      author: "Richard Osman",
      cover: "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.5,
      readers: 7654
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 dark:text-white">Popular Now</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg dark:text-white">{book.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{book.author}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1 text-gray-600 dark:text-gray-300">{book.rating}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {book.readers.toLocaleString()} readers
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularBooks;
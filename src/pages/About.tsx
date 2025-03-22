import React from 'react';
import { Book, Users, Globe, Shield } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About WordWave
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your gateway to endless knowledge and entertainment through digital books.
            We're committed to making reading accessible to everyone, everywhere.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <Book className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Vast Collection
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Access thousands of books across multiple genres and categories.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <Users className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Community
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Join a growing community of readers and share your literary journey.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <Globe className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Accessibility
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Read anywhere, anytime, on any device with our responsive platform.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <Shield className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Security
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your data and reading preferences are always safe and secure.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            We believe that knowledge should be accessible to everyone. Our mission is to create
            a digital platform that breaks down barriers to education and entertainment,
            providing readers worldwide with access to quality literature and resources.
          </p>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Have questions or suggestions? We'd love to hear from you!
          </p>
          <a
            href="mailto:contact@wordwave.com"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
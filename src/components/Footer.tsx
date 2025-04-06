import React from 'react';
import { Book, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center">
              <Book className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold text-white">WordWave</span>
            </div>
            <p className="mt-4">Your gateway to endless knowledge and entertainment through digital books.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="../pages/Home.tsx" className="hover:text-blue-400">Home</a></li>
              <li><a href="#" className="hover:text-blue-400">Browse</a></li>
              <li><a href="#" className="hover:text-blue-400">Categories</a></li>
              <li><a href="#" className="hover:text-blue-400">About Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                gusgrifit@gmail.com
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                +212 621-962745
              </li>
              <li className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                 Morocco, Imouzzer Kander City
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p>&copy; {new Date().getFullYear()} WordWave. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
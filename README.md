# WordWave - Digital Library Platform

WordWave is a modern digital library platform built with React, TypeScript, and Supabase. It provides users with a seamless experience to discover, download, and read books across multiple genres.

## 🚀 Features

- **Digital Book Repository**: Browse thousands of books across multiple categories
- **Smart Search**: Search books by title, author, genre with AI-powered enhancements
- **User Authentication**: Secure signup/login with Supabase Auth
- **Personalized Experience**: Favorite books, track reading progress, and download history
- **Book Details**: Comprehensive information for each book including reviews and ratings
- **Dark Mode**: Full dark mode support for comfortable reading day and night
- **Mobile Responsive**: Optimized UI for all device sizes
- **AI Chat Assistant**: Get help and book recommendations from an intelligent assistant

## 📋 Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account (for database and authentication)

## 🛠️ Installation & Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/wordwave.git
cd wordwave
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Environment Setup**

Copy the environment example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Open `.env` and add your Supabase URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-goes-here
```

4. **Supabase Setup**

- Create a new Supabase project
- Run the SQL migrations from the `supabase/migrations` folder in the Supabase SQL editor
- Or use the Supabase CLI to apply migrations:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

5. **Start the development server**

```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173/`

## 🏗️ Project Structure

```
wordwave/
├── public/             # Static files
├── src/                # Source code
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and libraries
│   ├── pages/          # Application pages
│   ├── services/       # API services
│   ├── config/         # Configuration files
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Application entry point
├── supabase/           # Supabase configuration and migrations
│   ├── functions/      # Supabase Edge Functions
│   └── migrations/     # Database migrations
├── .env.example        # Example environment variables
└── package.json        # Project dependencies
```

## 🔒 Security & Environment Variables

This project uses environment variables for secure configuration. Never commit your actual `.env` file to version control. The `.env` file should contain:

- Supabase URL and anonymous key
- API endpoints and keys
- Application configuration

## 🧪 Testing

```bash
npm run test
# or
yarn test
```

## 🚢 Deployment

The application can be built for production using:

```bash
npm run build
# or
yarn build
```

This will create a `dist` folder with the compiled assets ready for deployment.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

If you have any questions or suggestions, please open an issue on this repository.

---

Built with ❤️ by [Your Name] 
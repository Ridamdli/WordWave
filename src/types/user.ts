export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  last_login?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences: {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
    readingReminders: boolean;
  };
}
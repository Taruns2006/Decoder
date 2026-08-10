import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

interface Profile {
  id: number;
  user_id: number;
  name: string;
  student_type: string;
  institution: string;
  course_class: string;
  year: string;
  goals: string;
  career_interests: string[];
  weekly_hours: number;
  preferred_study_time: string;
  current_skill_level: string;
  readiness_score: number;
  streak: number;
  xp: number;
  level: number;
  created_at: string;
}

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (credentials: any) => Promise<void>;
  logout: () => void;
  onboard: (profileData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch (err) {
      console.error("Error loading user profile:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('atlantis_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const res = await authAPI.login(credentials);
      localStorage.setItem('atlantis_token', res.data.access_token);
      localStorage.setItem('atlantis_user_id', res.data.user_id.toString());
      await fetchProfile();
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (credentials: any) => {
    setLoading(true);
    try {
      const res = await authAPI.register(credentials);
      localStorage.setItem('atlantis_token', res.data.access_token);
      localStorage.setItem('atlantis_user_id', res.data.user_id.toString());
      await fetchProfile();
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const onboard = async (profileData: any) => {
    try {
      const res = await authAPI.onboard(profileData);
      setUser(res.data);
    } catch (err) {
      console.error("Error during onboarding:", err);
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem('atlantis_token');
    localStorage.removeItem('atlantis_user_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, onboard, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;

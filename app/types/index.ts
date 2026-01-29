export interface UserData {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  blocked: boolean;
  createdAt: string;
  avatar?: string;
}

export interface ReviewData {
  id: string;
  text: string;
  mark: number;
  geotagId: string;
  userId: string;
  createdAt: string;
  user?: UserData;
  owner?: UserData;
}

export interface PhotoData {
  id: string;
  url: string;
  geotagId: string;
  createdAt: string;
  owner?: UserData;
  user?: UserData;
  comments?: CommentData[];
  uploadedAt?: string;
}

export interface CommentData {
  id: string;
  text: string;
  createdAt: string;
  owner?: UserData;
  user?: UserData;
}

export interface MarkerData {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  owner?: UserData;
  photos?: PhotoData[];
  reviews?: ReviewData[];
  rating?: number;
} 
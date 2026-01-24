export interface ExtractedEvent {
  title: string;
  date: string;
  notes?: string;
}

export interface CreateUserData {
  email: string;
  name?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
}

export type ReadingStatus = 'read' | 'reading' | 'want_to_read';

export interface ReadingSession { id: string; date: string; pages: number; }
export interface Book {
  id: string;
  user_id?: string | null;
  title: string;
  authors: string[];
  cover_url: string;
  page_count: number;
  published_date: string;
  description?: string;
  isbn?: string;
  publisher?: string;
  language?: string;
  sessions?: ReadingSession[];
  categories?: string[];
  
  // Reading tracking info
  start_date: string | null; // Format: YYYY-MM-DD
  end_date: string | null;   // Format: YYYY-MM-DD
  status: ReadingStatus;
  rating: number | null;     // 1 to 5
  notes?: string;
  pages_read?: number;       // For books currently in progress
  
  created_at: string;
  updated_at: string;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    language?: string;
  };
}

export interface ReadingPeriodFilter {
  type: 'all' | 'this_year' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  year?: number;
}

export interface UserStats {
  totalBooksRead: number;
  totalPagesRead: number;
  averageRating: number;
  averagePagesPerBook: number;
  averageDaysPerBook: number;
  annualBooksRead: number;
  goalYear: number;
  sessionPages: number;
  sessionCount: number;
  weeklyActivity: Array<{ month: string; pages: number }>;
  activity: Array<{ month: string; pages: number }>;
  annualGoal: number;
  annualGoalProgress: number; // percentage
  booksByMonth: Array<{
    month: string;
    books: number;
    pages: number;
  }>;
  ratingsDistribution: Array<{
    stars: number;
    count: number;
  }>;
}

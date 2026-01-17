// Database Configuration File
// Modify this file to change database connection settings for deployment

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// Global Admin Database (for schools management)
export const ADMIN_DB_CONFIG: DatabaseConfig = {
  host: process.env.ADMIN_DB_HOST || 'localhost',
  port: parseInt(process.env.ADMIN_DB_PORT || '5432'),
  database: process.env.ADMIN_DB_NAME || 'academic_admin',
  username: process.env.ADMIN_DB_USER || 'postgres',
  password: process.env.ADMIN_DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production'
};

// Function to get school-specific database config
export const getSchoolDBConfig = (schoolIdentifier: string): DatabaseConfig => {
  return {
    host: process.env.SCHOOL_DB_HOST || 'localhost',
    port: parseInt(process.env.SCHOOL_DB_PORT || '5432'),
    database: `school_${schoolIdentifier.toLowerCase()}`,
    username: process.env.SCHOOL_DB_USER || 'postgres',
    password: process.env.SCHOOL_DB_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production'
  };
};

// Database connection helper (placeholder for actual implementation)
export const connectToDatabase = async (config: DatabaseConfig) => {
  // Connection established - no logging in production
  return {
    query: async (sql: string, params?: any[]) => {
      // Query executed - no logging in production
      return { rows: [], rowCount: 0 };
    },
    close: () => {
      // Connection closed - no logging in production
    }
  };
};

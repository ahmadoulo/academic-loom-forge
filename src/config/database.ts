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
  // This will be implemented with actual PostgreSQL client
  console.log(`Connecting to database: ${config.database} at ${config.host}:${config.port}`);
  return {
    query: async (sql: string, params?: any[]) => {
      console.log('Executing query:', sql, params);
      return { rows: [], rowCount: 0 };
    },
    close: () => console.log('Database connection closed')
  };
};
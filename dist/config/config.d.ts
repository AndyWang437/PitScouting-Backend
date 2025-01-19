interface DbConfig {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: string;
  dialect: string;
  dialectOptions?: {
    ssl?: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
}

interface Config {
  development: DbConfig;
  test: DbConfig;
  production: DbConfig;
}

declare const config: Config;
export default config; 
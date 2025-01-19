require('dotenv').config();
const parseDbUrl = (url) => {
    if (!url)
        return {};
    const matches = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!matches)
        return {};
    return {
        username: matches[1],
        password: matches[2],
        host: matches[3],
        port: matches[4],
        database: matches[5],
    };
};
const dbConfig = parseDbUrl(process.env.DATABASE_URL);
module.exports = {
    development: {
        ...dbConfig,
        dialect: 'postgres',
    },
    test: {
        ...dbConfig,
        dialect: 'postgres',
    },
    production: {
        ...dbConfig,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
};

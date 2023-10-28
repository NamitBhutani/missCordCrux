import { Redis } from "ioredis";
const redis = new Redis(
    {
        host: process.env.NEXT_PUBLIC_REDIS_HOST,
        port: process.env.NEXT_PUBLIC_REDIS_PORT as unknown as number,
        password: process.env.NEXT_PUBLIC_REDIS_PASSWORD,
    }
);

export default redis;
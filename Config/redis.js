import { createClient } from "redis";

// ⚠️ MODIFICATION REQUIRED: Replace 'YOUR_REDIS_PASSWORD' with the actual password.
const REDIS_PASSWORD = process.env.REDIS_PASSWORD; 

const redis = createClient({
    url: "redis://localhost:6379", // or your Redis Cloud URL
    
    // ✅ ADDED: Include the password for authentication
    password: REDIS_PASSWORD 
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

await redis.connect();

export default redis;
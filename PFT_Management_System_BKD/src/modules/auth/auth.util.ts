import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the expected user shape for token generation
interface JwtUserPayload {
  id: number;
  email: string;
  isAdmin: number;
}

// Define the JWT payload type (optional)
interface JwtPayload extends JwtUserPayload {
  iat?: number;
  exp?: number;
}

// Generate a JWT token
const generateToken = (user: JwtUserPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    secret,
    { expiresIn: "24h" }
  );
};

// Hash password using bcrypt
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Compare plain password with hashed password
const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export { generateToken, hashPassword, comparePassword };

import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export const verifyToken = (req) => {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
};

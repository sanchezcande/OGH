import { verifyToken } from '../../../src/lib/auth';

export default async function handler(req, res) {
    const decoded = verifyToken(req);

    if (decoded) {
        return res.status(200).json({ authenticated: true });
    }

    return res.status(200).json({ authenticated: false });
}

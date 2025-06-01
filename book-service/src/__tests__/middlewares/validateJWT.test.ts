import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateJWT } from '../../middlewares/validateJWT';

// Minimal mock of Express’s Response:
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json = jest.fn().mockReturnValue(res as Response);
    return res as Response;
};

// Minimal mock of Express’s Request:
const mockRequest = (headers: Record<string, any>): Request => {
    return { headers } as unknown as Request;
};

describe('validateJWT middleware', () => {
    const ORIGINAL_SECRET = process.env.JWT_SECRET;

    beforeAll(() => {
        // Ensure JWT_SECRET is defined (but since we mock jwt.verify, the value isn't used)
        process.env.JWT_SECRET = 'test-secret';
    });

    afterAll(() => {
        process.env.JWT_SECRET = ORIGINAL_SECRET;
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should respond 401 when Authorization header is missing', () => {
        const req = mockRequest({});
        const res = mockResponse();
        const next = jest.fn();

        validateJWT(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing or invalid Authorization header' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should respond 401 when Authorization header does not start with "Bearer "', () => {
        const req = mockRequest({ authorization: 'Token abcdef' });
        const res = mockResponse();
        const next = jest.fn();

        validateJWT(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing or invalid Authorization header' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should respond 401 when jwt.verify throws (invalid or expired token)', () => {
        // Mock jwt.verify to throw
        jest.spyOn(jwt, 'verify').mockImplementation(() => {
            throw new Error('bad token');
        });

        const req = mockRequest({ authorization: 'Bearer invalid.token.here' });
        const res = mockResponse();
        const next = jest.fn();

        validateJWT(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('invalid.token.here', 'test-secret');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() and attach userId when jwt.verify succeeds', () => {
        // Mock jwt.verify to return a payload
        const fakePayload = { userId: 'user-123', iat: 0, exp: 999999 } as any;
        jest.spyOn(jwt, 'verify').mockReturnValue(fakePayload);

        // Use a plain object so we can inspect (req as any).userId
        const req = ({ headers: { authorization: 'Bearer valid.token.here' } } as unknown) as Request;
        const res = mockResponse();
        const next = jest.fn();

        validateJWT(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('valid.token.here', 'test-secret');
        // After success, next() must be called
        expect(next).toHaveBeenCalled();
        // And req.userId is set to fakePayload.userId
        expect((req as any).userId).toBe('user-123');
        // res.status / res.json should not have been called
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});

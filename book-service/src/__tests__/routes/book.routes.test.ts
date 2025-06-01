import router from '../../routes/book.routes';
import * as BookController from '../../controllers/book.controller';
import { validateJWT } from '../../middlewares/validateJWT';
import { Router } from 'express';

// Helper: find the Route object in the router’s stack by HTTP method + path
function findRoute(
    router: Router,
    method: 'get' | 'post' | 'put' | 'delete',
    path: string
) {
    // @ts-ignore – router.stack is not typed as public in Express types, but it exists at runtime
    const stack = router.stack as any[];

    for (const layer of stack) {
        if (!layer.route) continue;
        const route = layer.route;
        if (
            route.path === path &&
            route.methods &&
            route.methods[method]
        ) {
            return route;
        }
    }
    return undefined;
}

describe('Book Routes configuration', () => {
    it('should have GET / mapped to BookController.getAll without validateJWT', () => {
        const route = findRoute(router, 'get', '/');
        expect(route).toBeDefined();

        // route.stack is an array of layer objects in the order they run
        // for GET '/', there should be exactly one handler: BookController.getAll
        const handlers = route.stack.map((layer: any) => layer.handle);
        expect(handlers).toContain(BookController.getAll);
        // validateJWT should NOT appear for GET '/'
        expect(handlers).not.toContain(validateJWT);
    });

    it('should have GET /:id mapped to validateJWT then BookController.getById', () => {
        const route = findRoute(router, 'get', '/:id');
        expect(route).toBeDefined();

        const handlers = route.stack.map((layer: any) => layer.handle);
        // The first handler must be validateJWT, next is BookController.getById
        expect(handlers[0]).toBe(validateJWT);
        expect(handlers[1]).toBe(BookController.getById);
    });

    it('should have POST / mapped to validateJWT then BookController.create', () => {
        const route = findRoute(router, 'post', '/');
        expect(route).toBeDefined();

        const handlers = route.stack.map((layer: any) => layer.handle);
        expect(handlers[0]).toBe(validateJWT);
        expect(handlers[1]).toBe(BookController.create);
    });

    it('should have PUT /:id mapped to validateJWT then BookController.update', () => {
        const route = findRoute(router, 'put', '/:id');
        expect(route).toBeDefined();

        const handlers = route.stack.map((layer: any) => layer.handle);
        expect(handlers[0]).toBe(validateJWT);
        expect(handlers[1]).toBe(BookController.update);
    });

    it('should have DELETE /:id mapped to validateJWT then BookController.softDelete', () => {
        const route = findRoute(router, 'delete', '/:id');
        expect(route).toBeDefined();

        const handlers = route.stack.map((layer: any) => layer.handle);
        expect(handlers[0]).toBe(validateJWT);
        expect(handlers[1]).toBe(BookController.softDelete);
    });
});

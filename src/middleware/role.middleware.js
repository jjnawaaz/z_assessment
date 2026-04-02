import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory for role-based access control.
 * Returns middleware that checks if the authenticated user's role
 * is included in the allowed roles list.
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

export default authorize;

const requireAssignmentPermission = (req, res, next) => {
    if (req.user.role === "admin" || req.user.role === "lead") {
        return next();
    }

    return res.status(403).json({
        message: "Only admins and leads can manage incident assignments"
    });
};

module.exports = requireAssignmentPermission;
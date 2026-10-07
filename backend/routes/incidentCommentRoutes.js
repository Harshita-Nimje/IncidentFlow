const express = require("express");

const {
    addComment,
    getComments,
    deleteComment
} = require("../controllers/incidentCommentController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, addComment);
router.delete("/:id", authenticateToken, deleteComment);
router.get("/:incident_id", authenticateToken, getComments);

module.exports = router;
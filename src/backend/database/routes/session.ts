import express from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { sessionState } from "../db/schema.js";
import { AuthManager } from "../../utils/auth-manager.js";
import { apiLogger } from "../../utils/logger.js";
import type { Request, Response } from "express";

const router = express.Router();
const authManager = AuthManager.getInstance();
const authenticateJWT = authManager.createAuthMiddleware();

// Route: Get session state for the current user
// GET /session
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = getDb();
    const session = await db
      .select()
      .from(sessionState)
      .where(eq(sessionState.userId, userId));

    if (!session || session.length === 0) {
      return res.status(404).json({ error: "No session state found" });
    }

    res.json({
      sessionData: JSON.parse(session[0].sessionData),
      updatedAt: session[0].updatedAt,
    });
  } catch (err) {
    apiLogger.error("Failed to get session state", err, {
      operation: "get_session_state",
    });
    res.status(500).json({ error: "Failed to get session state" });
  }
});

// Route: Save or update session state
// POST /session
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { sessionData } = req.body;

  if (!sessionData) {
    return res.status(400).json({ error: "Session data is required" });
  }

  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = getDb();

    // Serialize session data
    const serializedData = JSON.stringify(sessionData);

    // Check if session exists for this user
    const existing = await db
      .select()
      .from(sessionState)
      .where(eq(sessionState.userId, userId));

    if (existing && existing.length > 0) {
      // Update existing session
      await db
        .update(sessionState)
        .set({
          sessionData: serializedData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessionState.userId, userId));
    } else {
      // Insert new session
      await db.insert(sessionState).values({
        userId,
        sessionData: serializedData,
      });
    }

    apiLogger.success("Session state saved", {
      operation: "save_session_state",
      userId,
    });

    res.json({ message: "Session state saved successfully" });
  } catch (err) {
    apiLogger.error("Failed to save session state", err, {
      operation: "save_session_state",
    });
    res.status(500).json({ error: "Failed to save session state" });
  }
});

// Route: Delete session state
// DELETE /session
router.delete("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = getDb();
    await db.delete(sessionState).where(eq(sessionState.userId, userId));

    apiLogger.success("Session state deleted", {
      operation: "delete_session_state",
      userId,
    });

    res.json({ message: "Session state deleted successfully" });
  } catch (err) {
    apiLogger.error("Failed to delete session state", err, {
      operation: "delete_session_state",
    });
    res.status(500).json({ error: "Failed to delete session state" });
  }
});

export default router;

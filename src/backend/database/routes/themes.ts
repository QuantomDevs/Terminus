import express from "express";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { colorThemes } from "../db/schema.js";
import { AuthManager } from "../../utils/auth-manager.js";
import { apiLogger } from "../../utils/logger.js";
import type { Request, Response } from "express";

const router = express.Router();
const authManager = AuthManager.getInstance();
const authenticateJWT = authManager.createAuthMiddleware();

// Route: Get all themes for the current user
// GET /themes
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const db = getDb();
    const themes = await db
      .select()
      .from(colorThemes)
      .where(eq(colorThemes.userId, userId));

    res.json(themes);
  } catch (err) {
    apiLogger.error("Failed to get themes", err, {
      operation: "get_themes",
      userId,
    });
    res.status(500).json({ error: "Failed to get themes" });
  }
});

// Route: Get a specific theme by ID
// GET /themes/:id
router.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const themeId = parseInt(req.params.id);

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (isNaN(themeId)) {
    return res.status(400).json({ error: "Invalid theme ID" });
  }

  try {
    const db = getDb();
    const theme = await db
      .select()
      .from(colorThemes)
      .where(
        and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
      );

    if (!theme || theme.length === 0) {
      return res.status(404).json({ error: "Theme not found" });
    }

    res.json(theme[0]);
  } catch (err) {
    apiLogger.error("Failed to get theme", err, {
      operation: "get_theme",
      themeId,
      userId,
    });
    res.status(500).json({ error: "Failed to get theme" });
  }
});

// Route: Create a new theme
// POST /themes
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { name, colors } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (!name || !colors) {
    return res.status(400).json({ error: "Name and colors are required" });
  }

  try {
    const db = getDb();

    // Convert colors object to JSON string if it's not already
    const colorsString =
      typeof colors === "string" ? colors : JSON.stringify(colors);

    const result = await db.insert(colorThemes).values({
      userId,
      name,
      colors: colorsString,
      isActive: false,
    });

    apiLogger.success(`Theme created: ${name}`, {
      operation: "create_theme",
      userId,
      name,
    });

    res.status(201).json({
      message: "Theme created successfully",
      id: result.lastInsertRowid,
      name,
    });
  } catch (err) {
    apiLogger.error("Failed to create theme", err, {
      operation: "create_theme",
      userId,
      name,
    });
    res.status(500).json({ error: "Failed to create theme" });
  }
});

// Route: Update a theme
// PUT /themes/:id
router.put("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const themeId = parseInt(req.params.id);
  const { name, colors } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (isNaN(themeId)) {
    return res.status(400).json({ error: "Invalid theme ID" });
  }

  try {
    const db = getDb();

    // Verify theme belongs to user
    const existingTheme = await db
      .select()
      .from(colorThemes)
      .where(
        and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
      );

    if (!existingTheme || existingTheme.length === 0) {
      return res.status(404).json({ error: "Theme not found" });
    }

    // Convert colors object to JSON string if it's not already
    const colorsString =
      typeof colors === "string" ? colors : JSON.stringify(colors);

    await db
      .update(colorThemes)
      .set({
        name: name || existingTheme[0].name,
        colors: colorsString || existingTheme[0].colors,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
      );

    apiLogger.success(`Theme updated: ${themeId}`, {
      operation: "update_theme",
      userId,
      themeId,
    });

    res.json({ message: "Theme updated successfully" });
  } catch (err) {
    apiLogger.error("Failed to update theme", err, {
      operation: "update_theme",
      userId,
      themeId,
    });
    res.status(500).json({ error: "Failed to update theme" });
  }
});

// Route: Delete a theme
// DELETE /themes/:id
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const themeId = parseInt(req.params.id);

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (isNaN(themeId)) {
    return res.status(400).json({ error: "Invalid theme ID" });
  }

  try {
    const db = getDb();

    // Verify theme belongs to user
    const existingTheme = await db
      .select()
      .from(colorThemes)
      .where(
        and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
      );

    if (!existingTheme || existingTheme.length === 0) {
      return res.status(404).json({ error: "Theme not found" });
    }

    await db
      .delete(colorThemes)
      .where(
        and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
      );

    apiLogger.success(`Theme deleted: ${themeId}`, {
      operation: "delete_theme",
      userId,
      themeId,
    });

    res.json({ message: "Theme deleted successfully" });
  } catch (err) {
    apiLogger.error("Failed to delete theme", err, {
      operation: "delete_theme",
      userId,
      themeId,
    });
    res.status(500).json({ error: "Failed to delete theme" });
  }
});

// Route: Activate a theme
// PUT /themes/:id/activate
router.put(
  "/:id/activate",
  authenticateJWT,
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const themeId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (isNaN(themeId)) {
      return res.status(400).json({ error: "Invalid theme ID" });
    }

    try {
      const db = getDb();

      // Verify theme belongs to user
      const existingTheme = await db
        .select()
        .from(colorThemes)
        .where(
          and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
        );

      if (!existingTheme || existingTheme.length === 0) {
        return res.status(404).json({ error: "Theme not found" });
      }

      // Deactivate all other themes for this user
      await db
        .update(colorThemes)
        .set({ isActive: false })
        .where(eq(colorThemes.userId, userId));

      // Activate the selected theme
      await db
        .update(colorThemes)
        .set({ isActive: true, updatedAt: new Date().toISOString() })
        .where(
          and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
        );

      apiLogger.success(`Theme activated: ${themeId}`, {
        operation: "activate_theme",
        userId,
        themeId,
      });

      res.json({
        message: "Theme activated successfully",
        theme: existingTheme[0],
      });
    } catch (err) {
      apiLogger.error("Failed to activate theme", err, {
        operation: "activate_theme",
        userId,
        themeId,
      });
      res.status(500).json({ error: "Failed to activate theme" });
    }
  }
);

export default router;

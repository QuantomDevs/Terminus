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
  const { name, colors, author } = req.body;

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
      author: author || null,
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
  const { name, colors, author } = req.body;

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

    // Build update object - only include fields that were provided
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (colors !== undefined) updateData.colors = colorsString;
    if (author !== undefined) updateData.author = author || null;

    await db
      .update(colorThemes)
      .set(updateData)
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

// Route: Import a theme from JSON
// POST /themes/import
router.post(
  "/import",
  authenticateJWT,
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const themeData = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate required fields
    if (!themeData.name || !themeData.colors) {
      return res
        .status(400)
        .json({ error: "Theme name and colors are required" });
    }

    try {
      const db = getDb();

      // Check for duplicate name
      const existingTheme = await db
        .select()
        .from(colorThemes)
        .where(
          and(
            eq(colorThemes.userId, userId),
            eq(colorThemes.name, themeData.name)
          )
        );

      let finalName = themeData.name;
      if (existingTheme && existingTheme.length > 0) {
        // Add " (Imported)" suffix to avoid name collision
        finalName = `${themeData.name} (Imported)`;
      }

      // Parse colors if string, validate if object
      let colorsString: string;
      if (typeof themeData.colors === "string") {
        try {
          JSON.parse(themeData.colors);
          colorsString = themeData.colors;
        } catch {
          return res.status(400).json({ error: "Invalid JSON in colors field" });
        }
      } else if (typeof themeData.colors === "object") {
        colorsString = JSON.stringify(themeData.colors);
      } else {
        return res
          .status(400)
          .json({ error: "Colors must be object or JSON string" });
      }

      // Parse tags if provided
      let tagsString: string | undefined;
      if (themeData.tags) {
        if (typeof themeData.tags === "string") {
          tagsString = themeData.tags;
        } else if (Array.isArray(themeData.tags)) {
          tagsString = JSON.stringify(themeData.tags);
        }
      }

      // Create theme with imported data
      const result = await db.insert(colorThemes).values({
        userId,
        name: finalName,
        colors: colorsString,
        description: themeData.description || null,
        author: themeData.author || null,
        version: themeData.version || "1.0.0",
        tags: tagsString || null,
        isActive: false,
        isFavorite: false,
        duplicateCount: 0,
      });

      apiLogger.success(`Theme imported: ${finalName}`, {
        operation: "import_theme",
        userId,
        name: finalName,
      });

      res.status(201).json({
        message: "Theme imported successfully",
        id: result.lastInsertRowid,
        name: finalName,
      });
    } catch (err) {
      apiLogger.error("Failed to import theme", err, {
        operation: "import_theme",
        userId,
      });
      res.status(500).json({ error: "Failed to import theme" });
    }
  }
);

// Route: Export a theme with metadata
// GET /themes/:id/export
router.get(
  "/:id/export",
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
      const theme = await db
        .select()
        .from(colorThemes)
        .where(
          and(eq(colorThemes.id, themeId), eq(colorThemes.userId, userId))
        );

      if (!theme || theme.length === 0) {
        return res.status(404).json({ error: "Theme not found" });
      }

      // Parse colors string to object for export
      const colors =
        typeof theme[0].colors === "string"
          ? JSON.parse(theme[0].colors)
          : theme[0].colors;

      // Parse tags if present
      let tags: string[] = [];
      if (theme[0].tags) {
        try {
          tags =
            typeof theme[0].tags === "string"
              ? JSON.parse(theme[0].tags)
              : theme[0].tags;
        } catch {
          tags = [];
        }
      }

      // Create export-ready object
      const exportData = {
        name: theme[0].name,
        colors,
        description: theme[0].description || "",
        author: theme[0].author || "",
        version: theme[0].version || "1.0.0",
        tags,
        exported_at: new Date().toISOString(),
        exported_from: "Terminus",
      };

      res.json(exportData);
    } catch (err) {
      apiLogger.error("Failed to export theme", err, {
        operation: "export_theme",
        userId,
        themeId,
      });
      res.status(500).json({ error: "Failed to export theme" });
    }
  }
);

export default router;

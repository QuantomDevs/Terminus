import express from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { settings } from "../db/schema.js";
import { AuthManager } from "../../utils/auth-manager.js";
import { apiLogger } from "../../utils/logger.js";
import type { Request, Response } from "express";

const router = express.Router();
const authManager = AuthManager.getInstance();
const authenticateJWT = authManager.createAuthMiddleware();

// Route: Get a specific setting by key
// GET /settings/:key
router.get("/:key", authenticateJWT, async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const db = getDb();
    const setting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));

    if (!setting || setting.length === 0) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.json({
      key: setting[0].key,
      value: setting[0].value,
    });
  } catch (err) {
    apiLogger.error("Failed to get setting", err, {
      operation: "get_setting",
      key,
    });
    res.status(500).json({ error: "Failed to get setting" });
  }
});

// Route: Get all settings
// GET /settings
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const allSettings = await db.select().from(settings);

    const settingsMap: Record<string, string> = {};
    allSettings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    res.json(settingsMap);
  } catch (err) {
    apiLogger.error("Failed to get all settings", err, {
      operation: "get_all_settings",
    });
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// Route: Save or update a setting
// POST /settings
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: "Key and value are required" });
  }

  try {
    const db = getDb();

    // Check if setting exists
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));

    if (existing && existing.length > 0) {
      // Update existing setting
      await db
        .update(settings)
        .set({ value: value.toString() })
        .where(eq(settings.key, key));
    } else {
      // Insert new setting
      await db.insert(settings).values({
        key,
        value: value.toString(),
      });
    }

    apiLogger.success(`Setting saved: ${key} = ${value}`, {
      operation: "save_setting",
      key,
    });

    res.json({
      message: "Setting saved successfully",
      key,
      value: value.toString(),
    });
  } catch (err) {
    apiLogger.error("Failed to save setting", err, {
      operation: "save_setting",
      key,
    });
    res.status(500).json({ error: "Failed to save setting" });
  }
});

// Route: Delete a setting
// DELETE /settings/:key
router.delete("/:key", authenticateJWT, async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const db = getDb();
    await db.delete(settings).where(eq(settings.key, key));

    apiLogger.success(`Setting deleted: ${key}`, {
      operation: "delete_setting",
      key,
    });

    res.json({ message: "Setting deleted successfully" });
  } catch (err) {
    apiLogger.error("Failed to delete setting", err, {
      operation: "delete_setting",
      key,
    });
    res.status(500).json({ error: "Failed to delete setting" });
  }
});

export default router;

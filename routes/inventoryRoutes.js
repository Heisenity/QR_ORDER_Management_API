const express = require("express");
const { exec } = require("child_process");
const router = express.Router();

router.get("/predict", async (req, res) => {
  exec("python3 ai_scripts/predict_inventory.py", (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ AI script error: ${error.message}`);
      return res.status(500).json({ error: "AI prediction failed" });
    }
    console.log(`✅ AI Output:\n${stdout}`);
    res.json({ message: "AI Prediction completed", output: stdout });
  });
});

module.exports = router;

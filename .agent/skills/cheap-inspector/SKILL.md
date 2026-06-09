---
name: cheap-inspector
description: Analyzes large, messy data files or error logs using a free LLM worker. Use this when you need to inspect massive files without wasting premium context window limits.
---

# Cheap Inspector

## Goal
To safely read massive, messy log files or data dumps and return a clean, structured JSON summary of findings.

## Instructions
- When the user asks you to read a massive log file or perform a broad inspection of a messy data dump, do NOT read the file directly into your own context.
- Instead, execute the Node script located in this folder against the target file.
- Command: `node .agents/skills/cheap-inspector/index.js <path-to-file>`
- Wait for the script to print the structured JSON response.
- Read the JSON output and use those findings to determine your next debugging or development action.

## Constraints
- Do not attempt to parse the massive file natively. Always delegate to the script.
- Ensure the `OPENROUTER_API_KEY` environment variable is accessible in the terminal before running.
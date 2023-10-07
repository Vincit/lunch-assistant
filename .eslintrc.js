module.exports = {
  parser: "@typescript-eslint/parser", // Use the appropriate parser for your code (e.g., for TypeScript)
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended", // Use this for TypeScript (optional)
    "prettier", // Enable Prettier
  ],
  plugins: ["@typescript-eslint", "prettier"], // Include the Prettier plugin
  rules: {
    "prettier/prettier": [
      "error",
      {
        singleQuote: true, // Enforce single quotes
        semi: true, // Add semicolons at the end of statements (optional)
      },
    ],
  },
};
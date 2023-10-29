const express = require("express");
const app = express();

// Define the URL you want to redirect from
const redirectUrl = "/api/test";

// Define the target URL where you want to redirect
const targetUrl = "http://viaduct.proxy.rlwy.net:29260";

// Create a middleware that performs the redirection
app.use(redirectUrl, (req, res) => {
  // Redirect to the target URL
  res.redirect(targetUrl);
});

// Start the Express app on a specific port (e.g., 3000)
const port = 3000;
app.listen(port, "::", () => {
  console.log(`Express app is listening on port ${port}`);
});

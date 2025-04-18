// GitHub configuration example
// 1. Rename this file to config.js
// 2. Replace YOUR_GITHUB_USERNAME with your GitHub username
// 3. Replace YOUR_GITHUB_TOKEN with your personal access token from GitHub
// 4. Set the number of projects you want to display
window.githubConfig = {
  username: "YOUR_GITHUB_USERNAME",
  apiToken: "YOUR_GITHUB_TOKEN",
  projectCount: 4 // Number of projects to display
}; 

/**
 * EmailJS Configuration
 * 
 * To use EmailJS:
 * 1. Sign up at https://www.emailjs.com/
 * 2. Create a service (e.g., Gmail or another email provider)
 * 3. Create an email template with the following variables:
 *    - {{user_name}} - Name from form
 *    - {{user_email}} - Email from form
 *    - {{message}} - Message from form
 */

// EmailJS configuration
const PUBLIC_KEY = "Your_Public_Key"; // EmailJS public key
const SERVICE_ID = "Your_Service_ID"; // EmailJS service ID
const TEMPLATE_ID = "Your_Template_ID"; // EmailJS template ID

window.EMAILJS_CONFIG = {
  PUBLIC_KEY: PUBLIC_KEY,
  SERVICE_ID: SERVICE_ID,
  TEMPLATE_ID: TEMPLATE_ID
};
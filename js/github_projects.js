// GitHub API integration with fallback options
async function fetchGitHubProjects() {
  try {
    console.log("GitHub Config:", window.githubConfig);
    
    // Get username from config or use default
    const username = window.githubConfig?.username || "TypTech";
    // Get project count from config or use default
    const projectCount = window.githubConfig?.projectCount || 3;
    
    console.log("Using GitHub username:", username);
    
    // API options
    const options = {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    };
    
    // Check if we have an API token in local config
    if (window.githubConfig && window.githubConfig.apiToken && window.githubConfig.apiToken.length > 5) {
      options.headers.Authorization = `token ${window.githubConfig.apiToken}`;
      console.log("Using GitHub API token");
    } else {
      console.log("No GitHub API token provided, using unauthenticated requests");
    }

    // Set initial values for stats in case API fails
    let totalProjects = 10;
    let totalStars = 5;
    let languageCount = 3;
    
    // Update stats in the UI immediately with default values
    updateStatCounters(totalProjects, totalStars, languageCount);
    
    try {
      // First, fetch all repos to count them
      const allReposResponse = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100`,
        options
      );
      
      if (allReposResponse.ok) {
        const allRepos = await allReposResponse.json();
        
        // Filter non-fork repositories
        const nonForkRepos = allRepos.filter(repo => !repo.fork);
        totalProjects = nonForkRepos.length;
        
        // Calculate total stars
        totalStars = nonForkRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        
        // Count unique languages
        const languages = new Set();
        nonForkRepos.forEach(repo => {
          if (repo.language) {
            languages.add(repo.language);
          }
        });
        languageCount = languages.size;
        
        // Update stats with real values from API
        updateStatCounters(totalProjects, totalStars, languageCount);
        
        // Load project cards
        await loadProjectCards(username, projectCount, options);
      } else {
        console.error("GitHub API error:", allReposResponse.status, await allReposResponse.text());
        loadDefaultProjectCards(username);
      }
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      loadDefaultProjectCards(username);
    }
  } catch (error) {
    console.error("Critical error in GitHub integration:", error);
    // Use fallback values and project cards
    updateStatCounters(10, 5, 3);
    loadDefaultProjectCards("TypTech");
  }
}

// Update stat counters with animation
function updateStatCounters(projectCount, starsCount, languagesCount) {
  // Update the projects count in the About section
  updateCounter('projects-count', projectCount);
  
  // Update stars count
  updateCounter('stars-count', starsCount);
  
  // Update languages count
  updateCounter('languages-count', languagesCount);
}

// Update a single counter with animation
function updateCounter(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Start with current value
  const startValue = parseInt(element.textContent) || 0;
  animateCounter(element, startValue, value);
}

// Animate counter from start to end
function animateCounter(element, start, end) {
  const duration = 1500; // Animation duration in milliseconds
  const frameDuration = 1000 / 60; // 60fps
  const totalFrames = Math.round(duration / frameDuration);
  const increment = (end - start) / totalFrames;
  
  let currentNumber = start;
  let frame = 0;
  
  const counter = setInterval(() => {
    frame++;
    currentNumber += increment;
    
    // Make sure we don't exceed the end value
    if (frame === totalFrames) {
      clearInterval(counter);
      element.textContent = end;
    } else {
      element.textContent = Math.floor(currentNumber);
    }
  }, frameDuration);
}

// Load project cards from GitHub API
async function loadProjectCards(username, projectCount, options) {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=${projectCount}`,
      options
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();
    const projectsContainer = document.getElementById("projects-container");
    
    // Clear loading message
    projectsContainer.innerHTML = "";

    // Filter out forks
    const filteredRepos = repos.filter((repo) => !repo.fork);

    if (filteredRepos.length === 0) {
      loadDefaultProjectCards(username);
      return;
    }

    // Create the inner container
    const innerContainer = document.createElement("div");
    innerContainer.className = `projects-inner projects-count-${filteredRepos.length}`;
    projectsContainer.appendChild(innerContainer);

    // Add project cards
    filteredRepos.forEach((repo, index) => {
      const delayClass = `delay-${index + 1}`;

      // Format the repository name
      const formattedName = repo.name
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

      // Create project card
      const projectCard = document.createElement("div");
      projectCard.className = `project-card fade-in ${delayClass}`;
      projectCard.innerHTML = `
    <div class="project-image" style="background: linear-gradient(135deg, #3a86ff, #7209b7); display: flex; align-items: center; justify-content: center;">
        <i class="fab fa-github" style="font-size: 3rem; color: white;"></i>
        <div style="position: absolute; bottom: 10px; left: 10px; display: flex; gap: 10px;">
            ${
              repo.language
                ? `<span style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; color: white;">${repo.language}</span>`
                : ""
            }
            <span style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; color: white;">
                <i class="fas fa-star"></i> ${repo.stargazers_count}
            </span>
            <span style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; color: white;">
                <i class="fas fa-code-branch"></i> ${repo.forks_count}
            </span>
        </div>
    </div>
    <div class="project-content">
        <h3>${formattedName}</h3>
        <p>${repo.description || "No description available"}</p>
        <div class="project-links">
            <a href="${
              repo.html_url
            }" class="btn btn-primary" target="_blank">View Code <i class="fab fa-github"></i></a>
            ${
              repo.homepage
                ? `<a href="${repo.homepage}" class="btn btn-secondary" target="_blank">Live Demo <i class="fas fa-globe"></i></a>`
                : ""
            }
        </div>
    </div>
`;

      innerContainer.appendChild(projectCard);
    });

    // Trigger animations
    document.querySelectorAll(".fade-in").forEach((el) => {
      el.classList.add("visible");
    });
  } catch (error) {
    console.error("Error loading project cards:", error);
    loadDefaultProjectCards(username);
  }
}

// Load default project cards when API fails
function loadDefaultProjectCards(username) {
  const projectsContainer = document.getElementById("projects-container");
  if (!projectsContainer) return;
  
  projectsContainer.innerHTML = `
    <div class="projects-inner projects-count-1">
      <div class="project-card fade-in">
        <div class="project-image" style="background: linear-gradient(135deg, #3a86ff, #7209b7); display: flex; align-items: center; justify-content: center;">
          <i class="fab fa-github" style="font-size: 3rem; color: white;"></i>
        </div>
        <div class="project-content">
          <h3>GitHub Projects</h3>
          <p>Check out my repositories on GitHub to see my latest work and contributions.</p>
          <div class="project-links">
            <a href="https://github.com/${username}" class="btn btn-primary" target="_blank">Visit My GitHub <i class="fab fa-github"></i></a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Trigger animations
  document.querySelectorAll(".fade-in").forEach((el) => {
    el.classList.add("visible");
  });
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", fetchGitHubProjects);

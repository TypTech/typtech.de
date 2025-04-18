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
    if (window.githubConfig && window.githubConfig.apiToken) {
      // Format the token correctly
      let token = window.githubConfig.apiToken;
      if (token.startsWith('github_pat_')) {
        // For fine-grained token support
        options.headers.Authorization = `Bearer ${token}`;
      } else {
        // For classic tokens
        options.headers.Authorization = `token ${token}`;
      }
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
        
        // Create languages display section
        createLanguagesSection(Array.from(languages), username, options);
        
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

// Function to create a languages section
async function createLanguagesSection(languages, username, options) {
  try {
    // Find or create the languages container
    let languagesContainer = document.getElementById('languages-container');
    
    // If container doesn't exist, create it after the skills section
    if (!languagesContainer) {
      const skillsSection = document.querySelector('#skills .skills-container');
      if (skillsSection) {
        languagesContainer = document.createElement('div');
        languagesContainer.id = 'languages-container';
        languagesContainer.className = 'languages-container fade-in';
        languagesContainer.style.marginTop = '40px';
        
        const heading = document.createElement('h3');
        heading.textContent = 'Programming Languages I Use';
        heading.style.textAlign = 'center';
        heading.style.marginBottom = '25px';
        
        languagesContainer.appendChild(heading);
        
        const langItems = document.createElement('div');
        langItems.className = 'language-items';
        langItems.style.display = 'flex';
        langItems.style.flexWrap = 'wrap';
        langItems.style.justifyContent = 'center';
        langItems.style.gap = '15px';
        
        languagesContainer.appendChild(langItems);
        
        skillsSection.parentNode.insertBefore(languagesContainer, skillsSection.nextSibling);
      }
    }
    
    const langItems = languagesContainer.querySelector('.language-items');
    if (!langItems) return;
    
    // Clear existing languages
    langItems.innerHTML = '';
    
    // Map of languages to their corresponding icons and colors
    const languageIcons = {
      JavaScript: { icon: 'fab fa-js', color: '#f7df1e' },
      TypeScript: { icon: 'fab fa-js', color: '#007acc' },
      HTML: { icon: 'fab fa-html5', color: '#e34c26' },
      CSS: { icon: 'fab fa-css3-alt', color: '#264de4' },
      Python: { icon: 'fab fa-python', color: '#3776ab' },
      Java: { icon: 'fab fa-java', color: '#007396' },
      PHP: { icon: 'fab fa-php', color: '#777bb4' },
      Ruby: { icon: 'fas fa-gem', color: '#cc342d' },
      Go: { icon: 'fab fa-golang', color: '#00add8' },
      Swift: { icon: 'fab fa-swift', color: '#ffac45' },
      Kotlin: { icon: 'fab fa-android', color: '#7f52ff' },
      "C#": { icon: 'fab fa-microsoft', color: '#178600' },
      "C++": { icon: 'fas fa-code', color: '#f34b7d' },
      C: { icon: 'fas fa-code', color: '#555555' },
      Rust: { icon: 'fas fa-gears', color: '#dea584' },
      Shell: { icon: 'fas fa-terminal', color: '#89e051' },
      PowerShell: { icon: 'fas fa-terminal', color: '#012456' },
      Dockerfile: { icon: 'fab fa-docker', color: '#0db7ed' },
      Vue: { icon: 'fab fa-vuejs', color: '#4fc08d' },
      React: { icon: 'fab fa-react', color: '#61dafb' },
      Angular: { icon: 'fab fa-angular', color: '#dd0031' }
    };
    
    // For each language, get more details and create an element
    for (const language of languages) {
      // Create language item
      const langItem = document.createElement('div');
      langItem.className = 'language-item';
      langItem.style.display = 'flex';
      langItem.style.flexDirection = 'column';
      langItem.style.alignItems = 'center';
      langItem.style.padding = '15px';
      langItem.style.background = 'rgba(255, 255, 255, 0.05)';
      langItem.style.borderRadius = '10px';
      langItem.style.minWidth = '120px';
      langItem.style.transition = 'all 0.3s ease';
      
      // On hover effects
      langItem.onmouseover = function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        this.style.background = 'rgba(58, 134, 255, 0.1)';
      };
      
      langItem.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
        this.style.background = 'rgba(255, 255, 255, 0.05)';
      };
      
      // Get icon and color info
      const iconInfo = languageIcons[language] || { icon: 'fas fa-code', color: '#3a86ff' };
      
      // Create icon
      const icon = document.createElement('i');
      icon.className = iconInfo.icon;
      icon.style.fontSize = '2.5rem';
      icon.style.marginBottom = '10px';
      icon.style.color = iconInfo.color;
      
      // Create language name
      const name = document.createElement('span');
      name.textContent = language;
      name.style.color = '#d1d1d1';
      
      // Add elements to item
      langItem.appendChild(icon);
      langItem.appendChild(name);
      
      // Add item to container
      langItems.appendChild(langItem);
    }
    
    // Make sure the container is visible
    languagesContainer.classList.add('visible');
    
  } catch (error) {
    console.error('Error creating languages section:', error);
  }
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", fetchGitHubProjects);

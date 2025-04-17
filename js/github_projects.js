// GitHub API integration with authentication
async function fetchGitHubProjects() {
  try {
    // Get username from config or use default
    const username = window.githubConfig?.username || "TypTech";
    // Get project count from config or use default
    const projectCount = window.githubConfig?.projectCount || 3;
    
    // API options
    const options = {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    };
    
    // Check if we have an API token in local config
    if (window.githubConfig && window.githubConfig.apiToken) {
      options.headers.Authorization = `token ${window.githubConfig.apiToken}`;
    }

    // First, fetch all repos to count them
    const allReposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      options
    );

    if (!allReposResponse.ok) {
      throw new Error(
        `GitHub API error: ${allReposResponse.status} - ${await allReposResponse.text()}`
      );
    }

    const allRepos = await allReposResponse.json();
    const totalProjects = allRepos.filter(repo => !repo.fork).length;
    
    // Calculate total stars and forks
    let totalStars = 0;
    let totalForks = 0;
    const languages = new Set();
    
    allRepos.forEach(repo => {
      if (!repo.fork) {
        totalStars += repo.stargazers_count;
        totalForks += repo.forks_count;
        if (repo.language) {
          languages.add(repo.language);
        }
      }
    });
    
    // Update the projects count in the About section
    const projectsCountElement = document.getElementById('projects-count');
    if (projectsCountElement) {
      projectsCountElement.textContent = totalProjects;
    }
    
    // Update stars count
    const starsCountElement = document.getElementById('stars-count');
    if (starsCountElement) {
      starsCountElement.textContent = totalStars;
    }
    
    // Update languages count
    const languagesCountElement = document.getElementById('languages-count');
    if (languagesCountElement) {
      languagesCountElement.textContent = languages.size;
    }

    // Now fetch the display repos
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=${projectCount}`,
      options
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} - ${await response.text()}`
      );
    }

    const repos = await response.json();
    const projectsContainer = document.getElementById("projects-container");

    // Clear loading message
    projectsContainer.innerHTML = "";

    // Filter out forks if you only want original repos
    const filteredRepos = repos.filter((repo) => !repo.fork);

    if (filteredRepos.length === 0) {
      projectsContainer.innerHTML = `
    <div class="project-card fade-in">
        <div class="project-content">
            <h3>No Projects Found</h3>
            <p>I don't have any public repositories yet, but check back soon!</p>
            <div class="project-links">
                <a href="https://github.com/${username}" class="btn btn-primary" target="_blank">Visit My GitHub <i class="fab fa-github"></i></a>
            </div>
        </div>
    </div>
`;
      return;
    }

    // Create the inner container with the appropriate class
    const innerContainer = document.createElement("div");
    innerContainer.className = `projects-inner projects-count-${filteredRepos.length}`;
    projectsContainer.appendChild(innerContainer);

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
    console.error("Error fetching GitHub projects:", error);
    const projectsContainer = document.getElementById("projects-container");
    projectsContainer.innerHTML = `
<div class="project-card fade-in">
    <div class="project-content">
        <h3>Error Loading Projects</h3>
        <p>${error.message}</p>
        <div class="project-links">
            <a href="https://github.com" class="btn btn-primary" target="_blank">Visit GitHub <i class="fab fa-github"></i></a>
        </div>
    </div>
</div>
`;
    document.querySelector(".fade-in").classList.add("visible");
  }
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", fetchGitHubProjects);

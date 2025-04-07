async function uploadResume() {
    const status = document.getElementById("status");
    status.style.display = "flex";
    document.getElementById("result-container").style.display = "none";
    const fileInput = document.getElementById("resumeInput");
    if (!fileInput.files.length) {
        alert("Please upload a resume file.");
        return;
    }

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);

    // document.getElementById("status").innerText = "Analyzing resume...";

    try {
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        const result = data.result;

        if (response.ok) {

            document.getElementById("status").style.display = "none";
            document.getElementById("result-container").style.display = "block";

            // Summary
            document.getElementById("resumeSummary").textContent = result.summary || "No summary available.";

            // Score Progress Bar
            const score = result.score || 0;
            document.getElementById("resumeScoreBar").style.width = `${score}%`;
            document.getElementById("resumeScoreText").innerText = `${score}%`;

            // Resume Level Badge
            document.getElementById("resumeLevel").innerText = result.level || "N/A";

            // Suggestions
            document.getElementById("resumeSuggestions").innerText = result.suggestions || "No suggestions available.";

            // Top Skills
            const skillsContainer = document.getElementById("resumeTopSkills");
            skillsContainer.innerHTML = "";

            result.topSkills.forEach((skill) => {
                const btn = document.createElement("button");
                btn.className = "pinBtn";
                btn.innerHTML = `
                <span class="IconContainer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.09 8.26H20.18L15.55 12.14L17.64 18.4L12 14.52L6.36 18.4L8.45 12.14L3.82 8.26H9.91L12 2Z" />
                  </svg>
                </span>
                <p class="text">${skill}</p>
              `;
                skillsContainer.appendChild(btn);
            });

        }
        else {
            status.style.display = "none";
            document.getElementById("status").innerText = "Error: " + result.error;
        }
    } catch (error) {

        status.style.display = "none";
        console.error("Error:", error);
        // document.getElementById("status").innerText = "Failed to analyze resume.";
    }
}

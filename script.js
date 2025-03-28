async function uploadResume() {
    const fileInput = document.getElementById("resumeInput");
    if (!fileInput.files.length) {
        alert("Please upload a resume file.");
        return;
    }

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);

    document.getElementById("status").innerText = "Analyzing resume...";

    try {
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        const resultx=result.result;
        const suggestionsX = result.suggestions;

        if (response.ok) {
            // AI sometimes returns unnecessary text before the JSON response.
            document.getElementById("resumeSummary").innerText =resultx;
            
            document.getElementById("resumeSuggestions").innerText = (suggestionsX.replaceAll('###','\n--') || "All necessary sections are present.");
         
       
        } else {
            document.getElementById("status").innerText = "Error: " + result.error;
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("status").innerText = "Failed to analyze resume.";
    }
}

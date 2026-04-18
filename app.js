document.getElementById('btnAi').addEventListener('click', async () => {
    // Ambil link dari input
    let url = videoInput.value.trim();
    
    // CEK: Kalau user belum klik "Download Video", kita cari link aslinya dulu
    showLoader("Mengekstrak Video & Menganalisis...");
    
    try {
        // Step 1: Ambil link video asli dari TikWM (biar gak error HTML)
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        
        if (!json.data || !json.data.play) {
            throw new Error("Gagal mengambil file video. Klik Download Video dulu!");
        }

        const directVideoUrl = json.data.play; // Ini link file .mp4 asli

        // Step 2: Kirim link file asli ke AI
        const start = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: directVideoUrl, // PENTING: Pakai link file, bukan link TikTok
                speech_models: ["universal-3-pro", "universal-2"],
                language_detection: true,
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets"
            })
        });
        
        const initialData = await start.json();
        if(initialData.id) {
            checkAiStatus(initialData.id);
        } else {
            throw new Error(initialData.error || "Gagal inisialisasi AI");
        }
    } catch (e) {
        alert("Gagal: " + e.message);
        hideLoader();
    }
});

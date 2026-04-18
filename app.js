const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// Fitur Paste
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// Fitur Download
document.getElementById('btnDownload').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Tempel link videonya dulu!");
    showLoader("Mencari Video...");
    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if(json.data) {
            const v = json.data;
            document.getElementById('thumb').src = v.cover || v.thumbnail;
            document.getElementById('videoTitle').innerText = v.title || "Video Ditemukan";
            document.getElementById('finalDownload').href = v.play || v.url;
            document.getElementById('videoResult').classList.remove('hidden');
        } else { alert("Video tidak ditemukan."); }
    } catch (e) { alert("Error koneksi."); }
    hideLoader();
});

// Fitur AI - MENIRU PERSIS LOGIKA DOKUMEN YANG BOS KIRIM
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("AI Sedang Menganalisis...");
    try {
        const start = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: url,
                language_detection: true, // Sesuai dokumen
                speech_models: ["universal-3-pro", "universal-2"], // Sesuai dokumen
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

async function checkAiStatus(id) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`/api/process-ai?id=${id}`);
            const data = await res.json();

            if (data.status === 'completed') {
                clearInterval(interval);
                hideLoader();
                document.getElementById('videoResult').classList.add('hidden');
                document.getElementById('aiResult').classList.remove('hidden');
                // Tampilkan hasil rangkuman
                document.getElementById('aiSummary').innerText = data.summary || data.text;
            } else if (data.status === 'error') {
                clearInterval(interval);
                alert("AI Gagal: " + data.error);
                hideLoader();
            }
        } catch (e) {
            clearInterval(interval);
            hideLoader();
        }
    }, 3000); // Polling setiap 3 detik sesuai dokumen
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }

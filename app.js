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
            document.getElementById('aiResult').classList.add('hidden');
        } else { alert("Video tidak ditemukan."); }
    } catch (e) { alert("Error koneksi."); }
    hideLoader();
});

// Fitur AI (Disederhanakan agar Stabil)
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
                speech_models: ["universal-3-pro"], // Pakai 1 model utama saja
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets"
            })
        });
        
        const initialData = await start.json();
        if(initialData.id) {
            checkAiStatus(initialData.id);
        } else {
            throw new Error(initialData.error || "Gagal inisialisasi");
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
            
            console.log("Status AI:", data.status); // Cek di console log HP/Laptop

            if (data.status === 'completed') {
                clearInterval(interval);
                showAiResult(data);
            } else if (data.status === 'error') {
                clearInterval(interval);
                alert("AI Gagal: " + (data.error || "Cek link video Anda."));
                hideLoader();
            }
        } catch (e) {
            clearInterval(interval);
            hideLoader();
        }
    }, 3000);
}

function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    // Pastikan ID element ini ada di HTML Bos
    const summaryBox = document.getElementById('aiSummary');
    summaryBox.innerText = data.summary || "Rangkuman tidak tersedia untuk video ini.";
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
